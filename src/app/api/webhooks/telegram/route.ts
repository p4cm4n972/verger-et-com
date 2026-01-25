// ==========================================
// VERGER & COM - Webhook Telegram
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderAcceptedConfirmation, sendTelegramMessage } from '@/lib/telegram';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import {
  getSession,
  setSession,
  deleteSession,
  createSessionFromInvite,
  generateInviteToken,
  validateInviteToken,
  consumeInviteToken,
  IDF_SECTORS,
  SectorCode,
} from '@/lib/telegram/sessions';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'verger2024admin';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'VergerEtComBot';

interface TelegramUpdate {
  update_id: number;
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      chat: {
        id: number;
      };
      message_id: number;
    };
    data: string;
  };
  message?: {
    chat: {
      id: number;
    };
    text?: string;
    from: {
      id: number;
      first_name: string;
    };
  };
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (token && token !== TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    if (update.message?.text) {
      await handleMessage(update.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erreur webhook Telegram:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Gère les callback queries (boutons)
 */
async function handleCallbackQuery(callbackQuery: NonNullable<TelegramUpdate['callback_query']>) {
  const { id, from, data, message } = callbackQuery;
  const chatId = message?.chat.id.toString() || '';

  const [action, param] = data.split(':');

  const supabase = await createClient();

  switch (action) {
    case 'accept_order':
      await handleAcceptOrder(supabase, param, chatId, from, id);
      break;

    case 'refuse_order':
      await handleRefuseOrder(supabase, param, chatId, from, id);
      break;

    case 'deliver_order':
      await handleDeliverOrder(supabase, param, chatId, from, id);
      break;

    case 'sector':
      await handleSectorSelection(chatId, param as SectorCode, id);
      break;

    default:
      await answerCallbackQuery(id, '❌ Action inconnue');
  }
}

/**
 * Gère les messages texte
 */
async function handleMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id.toString();
  const text = message.text || '';

  // Vérifier s'il y a une session d'inscription en cours
  const session = getSession(chatId);
  if (session && !text.startsWith('/')) {
    await handleRegistrationStep(chatId, text, session);
    return;
  }

  // Commande /start avec token d'invitation
  if (text.startsWith('/start invite_')) {
    const token = text.replace('/start invite_', '').trim();
    await handleInviteStart(chatId, token);
    return;
  }

  // Commande /start simple
  if (text === '/start') {
    deleteSession(chatId);
    await sendTelegramMessage({
      chat_id: chatId,
      text: `
🍎 <b>Bienvenue sur Verger & Com !</b>

Ce bot est réservé aux livreurs.
Si vous avez reçu un lien d'invitation, cliquez dessus pour vous inscrire.

<b>Admin ?</b>
Générer une invitation: <code>/invite motdepasse</code>
      `.trim(),
      parse_mode: 'HTML',
    });
    return;
  }

  // Commande /cancel
  if (text === '/cancel') {
    deleteSession(chatId);
    await sendTelegramMessage({
      chat_id: chatId,
      text: '❌ Inscription annulée.',
      parse_mode: 'HTML',
    });
    return;
  }

  // Commande /invite (admin)
  if (text.startsWith('/invite ')) {
    const password = text.replace('/invite ', '').trim();
    await handleGenerateInvite(chatId, password);
    return;
  }

  // Commande /mes_livraisons
  if (text === '/mes_livraisons') {
    await handleMyDeliveries(chatId);
    return;
  }
}

/**
 * Génère un lien d'invitation (admin)
 */
async function handleGenerateInvite(chatId: string, password: string) {
  if (password !== ADMIN_PASSWORD) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: '❌ Mot de passe incorrect.',
      parse_mode: 'HTML',
    });
    return;
  }

  const token = generateInviteToken();
  const inviteLink = `https://t.me/${BOT_USERNAME}?start=invite_${token}`;

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
✅ <b>Lien d'invitation généré !</b>

Envoie ce lien au nouveau livreur:
<code>${inviteLink}</code>

⏰ Valide 24h
    `.trim(),
    parse_mode: 'HTML',
  });
}

/**
 * Démarre l'inscription avec un token d'invitation
 */
async function handleInviteStart(chatId: string, token: string) {
  if (!validateInviteToken(token)) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: `
❌ <b>Lien invalide ou expiré</b>

Demande un nouveau lien d'invitation à l'administrateur.
      `.trim(),
      parse_mode: 'HTML',
    });
    return;
  }

  // Vérifier si ce chat n'est pas déjà un livreur
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (existing) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: `
✅ Tu es déjà inscrit comme livreur !

• /mes_livraisons - Voir tes livraisons
      `.trim(),
      parse_mode: 'HTML',
    });
    return;
  }

  // Démarrer la session d'inscription
  createSessionFromInvite(chatId, token);

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
🍎 <b>Inscription Livreur Verger & Com</b>

<b>Étape 1/4</b> - Ton adresse email ?

(Tape /cancel pour annuler)
    `.trim(),
    parse_mode: 'HTML',
  });
}

/**
 * Gère les étapes d'inscription
 */
async function handleRegistrationStep(
  chatId: string,
  text: string,
  session: NonNullable<ReturnType<typeof getSession>>
) {
  switch (session.step) {
    case 'email':
      if (!text.includes('@') || !text.includes('.')) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: '❌ Email invalide. Réessaie:',
          parse_mode: 'HTML',
        });
        return;
      }
      session.email = text.trim().toLowerCase();
      session.step = 'name';
      setSession(chatId, session);
      await sendTelegramMessage({
        chat_id: chatId,
        text: `
📧 Email: <code>${session.email}</code>

<b>Étape 2/4</b> - Ton nom complet ?
        `.trim(),
        parse_mode: 'HTML',
      });
      break;

    case 'name':
      if (text.length < 2) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: '❌ Nom trop court. Réessaie:',
          parse_mode: 'HTML',
        });
        return;
      }
      session.name = text.trim();
      session.step = 'phone';
      setSession(chatId, session);
      await sendTelegramMessage({
        chat_id: chatId,
        text: `
📧 Email: <code>${session.email}</code>
👤 Nom: ${session.name}

<b>Étape 3/4</b> - Ton numéro de téléphone ?
        `.trim(),
        parse_mode: 'HTML',
      });
      break;

    case 'phone':
      session.phone = text.trim();
      session.step = 'sector';
      setSession(chatId, session);

      // Afficher les boutons de sélection de secteur
      const keyboard = buildSectorKeyboard();

      await sendTelegramMessage({
        chat_id: chatId,
        text: `
📧 Email: <code>${session.email}</code>
👤 Nom: ${session.name}
📞 Tél: ${session.phone}

<b>Étape 4/4</b> - Ton secteur de livraison ?
        `.trim(),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      });
      break;

    case 'sector':
      // Cette étape est gérée par les boutons
      await sendTelegramMessage({
        chat_id: chatId,
        text: '👆 Clique sur un bouton pour choisir ton secteur.',
        parse_mode: 'HTML',
      });
      break;
  }
}

/**
 * Construit le clavier des secteurs
 */
function buildSectorKeyboard() {
  const sectors = Object.entries(IDF_SECTORS);
  const keyboard = [];

  // Paris (2 par ligne)
  const parisSectors = sectors.filter(([code]) => code.startsWith('paris'));
  for (let i = 0; i < parisSectors.length; i += 2) {
    const row = parisSectors.slice(i, i + 2).map(([code, info]) => ({
      text: `${info.emoji} ${info.label.split(' (')[0]}`,
      callback_data: `sector:${code}`,
    }));
    keyboard.push(row);
  }

  // Départements (2 par ligne)
  const deptSectors = sectors.filter(([code]) => !code.startsWith('paris'));
  for (let i = 0; i < deptSectors.length; i += 2) {
    const row = deptSectors.slice(i, i + 2).map(([code, info]) => ({
      text: `${info.emoji} ${info.label}`,
      callback_data: `sector:${code}`,
    }));
    keyboard.push(row);
  }

  return keyboard;
}

/**
 * Gère la sélection du secteur
 */
async function handleSectorSelection(chatId: string, sectorCode: SectorCode, callbackId: string) {
  const session = getSession(chatId);

  if (!session || session.step !== 'sector') {
    await answerCallbackQuery(callbackId, '❌ Session expirée. Recommence.');
    return;
  }

  const sector = IDF_SECTORS[sectorCode];
  if (!sector) {
    await answerCallbackQuery(callbackId, '❌ Secteur invalide.');
    return;
  }

  // Consommer le token d'invitation
  if (!consumeInviteToken(session.inviteToken)) {
    await answerCallbackQuery(callbackId, '❌ Invitation expirée.');
    deleteSession(chatId);
    return;
  }

  // Créer le livreur en base
  const supabase = await createClient();

  // Vérifier si l'email existe déjà
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingEmail } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('email', session.email)
    .single();

  if (existingEmail) {
    await answerCallbackQuery(callbackId, '❌ Email déjà utilisé.');
    deleteSession(chatId);
    await sendTelegramMessage({
      chat_id: chatId,
      text: `❌ L'email <code>${session.email}</code> est déjà utilisé.`,
      parse_mode: 'HTML',
    });
    return;
  }

  // Créer l'utilisateur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error: userError } = await (supabase as any)
    .from('users')
    .insert({
      email: session.email,
      name: session.name,
      phone: session.phone,
      role: 'driver',
      telegram_chat_id: chatId,
      is_active: true,
    })
    .select('id')
    .single();

  if (userError) {
    console.error('Erreur création user:', userError);
    await answerCallbackQuery(callbackId, '❌ Erreur. Réessaie.');
    return;
  }

  // Créer l'entrée drivers avec le secteur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('drivers')
    .insert({
      user_id: user.id,
      current_zone: sector.label,
    });

  deleteSession(chatId);
  await answerCallbackQuery(callbackId, '✅ Inscription réussie !');

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
🎉 <b>Bienvenue ${session.name} !</b>

Tu es maintenant livreur Verger & Com.

📧 Email: <code>${session.email}</code>
📞 Tél: ${session.phone}
📍 Secteur: ${sector.emoji} ${sector.label}

Tu recevras les notifications de nouvelles commandes dans ton secteur.

• /mes_livraisons - Voir tes livraisons
    `.trim(),
    parse_mode: 'HTML',
  });
}

/**
 * Accepter une commande
 */
async function handleAcceptOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  chatId: string,
  _from: { id: number; first_name: string; last_name?: string },
  callbackId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id, name')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (!driver) {
    await answerCallbackQuery(callbackId, '❌ Tu n\'es pas inscrit comme livreur');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('id, driver_status, assigned_driver_id, delivery_date')
    .eq('id', orderId)
    .single();

  if (!order) {
    await answerCallbackQuery(callbackId, '❌ Commande introuvable');
    return;
  }

  if (order.driver_status === 'accepted' && order.assigned_driver_id) {
    await answerCallbackQuery(callbackId, '❌ Cette commande a déjà été prise');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('orders')
    .update({
      assigned_driver_id: driver.id,
      driver_status: 'accepted',
      driver_accepted_at: new Date().toISOString(),
      status: 'preparing',
    })
    .eq('id', orderId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('telegram_notifications')
    .insert({
      order_id: orderId,
      driver_id: driver.id,
      status: 'accepted',
      responded_at: new Date().toISOString(),
    });

  await answerCallbackQuery(callbackId, '✅ Commande acceptée !');
  await sendOrderAcceptedConfirmation(chatId, orderId, order.delivery_date);
}

/**
 * Refuser une commande
 */
async function handleRefuseOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  chatId: string,
  _from: { id: number; first_name: string },
  callbackId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (driver) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('telegram_notifications')
      .insert({
        order_id: orderId,
        driver_id: driver.id,
        status: 'refused',
        responded_at: new Date().toISOString(),
      });
  }

  await answerCallbackQuery(callbackId, '👌 Commande refusée');

  await sendTelegramMessage({
    chat_id: chatId,
    text: '👌 Tu as refusé cette commande. Un autre livreur la prendra.',
    parse_mode: 'HTML',
  });
}

/**
 * Valider une livraison
 */
async function handleDeliverOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  chatId: string,
  _from: { id: number; first_name: string },
  callbackId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id, name')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (!driver) {
    await answerCallbackQuery(callbackId, '❌ Tu n\'es pas inscrit comme livreur');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('id, assigned_driver_id, customer_email, status')
    .eq('id', orderId)
    .single();

  if (!order) {
    await answerCallbackQuery(callbackId, '❌ Commande introuvable');
    return;
  }

  if (order.assigned_driver_id !== driver.id) {
    await answerCallbackQuery(callbackId, '❌ Cette commande ne t\'est pas assignée');
    return;
  }

  if (order.status === 'delivered') {
    await answerCallbackQuery(callbackId, '✅ Déjà livrée');
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  await answerCallbackQuery(callbackId, '✅ Livraison validée !');

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
🎉 <b>Livraison validée !</b>

Commande #${orderId.slice(0, 8)} marquée comme livrée.
Merci pour ton travail ! 🍎
    `.trim(),
    parse_mode: 'HTML',
  });

  if (order.customer_email) {
    await sendOrderStatusUpdateEmail(order.customer_email, orderId, 'delivered');
  }
}

/**
 * Afficher les livraisons du livreur
 */
async function handleMyDeliveries(chatId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (!driver) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: '❌ Tu n\'es pas inscrit comme livreur.',
      parse_mode: 'HTML',
    });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any)
    .from('orders')
    .select('id, delivery_date, delivery_address, total, status')
    .eq('assigned_driver_id', driver.id)
    .in('status', ['confirmed', 'preparing'])
    .order('delivery_date', { ascending: true });

  if (!orders || orders.length === 0) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: '📦 Tu n\'as aucune livraison en cours.',
      parse_mode: 'HTML',
    });
    return;
  }

  const ordersList = orders
    .map((o: { id: string; delivery_date: string; delivery_address: string; total: number; status: string }) =>
      `📦 #${o.id.slice(0, 8)} - ${o.delivery_date}\n   📍 ${o.delivery_address || 'Adresse à confirmer'}\n   💰 ${o.total}€`
    )
    .join('\n\n');

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
📋 <b>Tes livraisons en cours:</b>

${ordersList}
    `.trim(),
    parse_mode: 'HTML',
  });
}

/**
 * Répondre à un callback query
 */
async function answerCallbackQuery(callbackQueryId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: true,
    }),
  });
}
