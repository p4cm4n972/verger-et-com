// ==========================================
// VERGER & COM - Webhook Telegram
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderAcceptedConfirmation, sendTelegramMessage } from '@/lib/telegram';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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
  // Vérifier le token (optionnel mais recommandé)
  const token = request.nextUrl.searchParams.get('token');
  if (token && token !== TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // Gérer les callback queries (boutons inline)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    // Gérer les messages texte (commandes)
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
 * Gère les callback queries (boutons accepter/refuser/livrer)
 */
async function handleCallbackQuery(callbackQuery: NonNullable<TelegramUpdate['callback_query']>) {
  const { id, from, data, message } = callbackQuery;
  const chatId = message?.chat.id.toString() || '';

  // Parser le callback data
  const [action, orderId] = data.split(':');

  const supabase = await createClient();

  switch (action) {
    case 'accept_order':
      await handleAcceptOrder(supabase, orderId, chatId, from, id);
      break;

    case 'refuse_order':
      await handleRefuseOrder(supabase, orderId, chatId, from, id);
      break;

    case 'deliver_order':
      await handleDeliverOrder(supabase, orderId, chatId, from, id);
      break;

    default:
      await answerCallbackQuery(id, '❌ Action inconnue');
  }
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'verger2024admin';

/**
 * Gère les messages texte (commandes /start, etc.)
 */
async function handleMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id.toString();
  const text = message.text || '';

  if (text === '/start') {
    await sendTelegramMessage({
      chat_id: chatId,
      text: `
🍎 <b>Bienvenue sur Verger & Com !</b>

<b>Livreur ?</b>
Lie ton compte avec: <code>/register ton@email.com</code>

<b>Admin ?</b>
Ajoute un livreur: <code>/admin motdepasse email nom</code>
      `.trim(),
      parse_mode: 'HTML',
    });
  } else if (text.startsWith('/register ')) {
    const email = text.replace('/register ', '').trim();
    await handleLinkDriver(chatId, email);
  } else if (text.startsWith('/admin ')) {
    // Format: /admin password email|nom|telephone|adresse
    const content = text.replace('/admin ', '').trim();
    const spaceIndex = content.indexOf(' ');

    if (spaceIndex === -1) {
      await sendTelegramMessage({
        chat_id: chatId,
        text: `
❌ <b>Format incorrect</b>

Usage:
<code>/admin motdepasse email|nom|telephone|adresse</code>

Exemple:
<code>/admin verger2024admin jean@mail.fr|Jean Dupont|0612345678|12 rue Paris 75001</code>
        `.trim(),
        parse_mode: 'HTML',
      });
      return;
    }

    const password = content.substring(0, spaceIndex);
    const data = content.substring(spaceIndex + 1);
    const parts = data.split('|').map(p => p.trim());

    if (parts.length >= 4) {
      const [email, name, phone, address] = parts;
      await handleAdminAddDriver(chatId, password, email, name, phone, address);
    } else {
      await sendTelegramMessage({
        chat_id: chatId,
        text: `
❌ <b>Données manquantes</b>

Usage:
<code>/admin motdepasse email|nom|telephone|adresse</code>

Tu as fourni ${parts.length} champs, il en faut 4.
        `.trim(),
        parse_mode: 'HTML',
      });
    }
  } else if (text === '/mes_livraisons') {
    await handleMyDeliveries(chatId);
  }
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
  // Trouver le livreur par son chat ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id, name')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (!driver) {
    await answerCallbackQuery(callbackId, '❌ Tu n\'es pas enregistré comme livreur');
    return;
  }

  // Vérifier que la commande n'est pas déjà prise
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

  // Assigner la commande au livreur
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

  // Enregistrer dans les notifications
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

  // Envoyer confirmation au livreur
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
  // Trouver le livreur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (driver) {
    // Enregistrer le refus
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
  // Vérifier que c'est bien le livreur assigné
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id, name')
    .eq('telegram_chat_id', chatId)
    .eq('role', 'driver')
    .single();

  if (!driver) {
    await answerCallbackQuery(callbackId, '❌ Tu n\'es pas enregistré comme livreur');
    return;
  }

  // Vérifier la commande
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
    await answerCallbackQuery(callbackId, '✅ Cette commande a déjà été livrée');
    return;
  }

  // Marquer comme livrée
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  await answerCallbackQuery(callbackId, '✅ Livraison validée !');

  // Notification au livreur
  await sendTelegramMessage({
    chat_id: chatId,
    text: `
🎉 <b>Livraison validée !</b>

Commande #${orderId.slice(0, 8)} marquée comme livrée.
Merci pour ton travail ! 🍎
    `.trim(),
    parse_mode: 'HTML',
  });

  // Email au client
  if (order.customer_email) {
    await sendOrderStatusUpdateEmail(
      order.customer_email,
      orderId,
      'delivered'
    );
  }
}

/**
 * Lier un compte livreur existant à Telegram (pour les livreurs)
 */
async function handleLinkDriver(chatId: string, email: string) {
  const supabase = await createClient();

  // Vérifier si le livreur existe (créé par l'admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: driver } = await (supabase as any)
    .from('users')
    .select('id, name, role')
    .eq('email', email)
    .eq('role', 'driver')
    .single();

  if (!driver) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: `
❌ <b>Compte non trouvé</b>

Aucun compte livreur avec l'email <code>${email}</code>.
Contacte l'administrateur pour qu'il crée ton compte.
      `.trim(),
      parse_mode: 'HTML',
    });
    return;
  }

  // Lier le Telegram au compte existant
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('users')
    .update({ telegram_chat_id: chatId })
    .eq('id', driver.id);

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
✅ <b>Compte lié !</b>

Bienvenue ${driver.name} !
Tu recevras les notifications de nouvelles commandes.

• /mes_livraisons - Voir tes livraisons
    `.trim(),
    parse_mode: 'HTML',
  });
}

/**
 * Créer un nouveau livreur (réservé à l'admin)
 */
async function handleAdminAddDriver(
  chatId: string,
  password: string,
  email: string,
  name: string,
  phone: string,
  address: string
) {
  // Vérifier le mot de passe admin
  if (password !== ADMIN_PASSWORD) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: '❌ Mot de passe incorrect.',
      parse_mode: 'HTML',
    });
    return;
  }

  const supabase = await createClient();

  // Vérifier si le livreur existe déjà
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: `❌ Un compte avec l'email <code>${email}</code> existe déjà.`,
      parse_mode: 'HTML',
    });
    return;
  }

  // Créer le compte livreur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('users')
    .insert({
      email,
      name,
      phone,
      role: 'driver',
      is_active: true,
    });

  // Créer aussi l'entrée dans la table drivers avec l'adresse
  if (!error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('drivers')
        .insert({
          user_id: user.id,
          current_zone: address,
        });
    }
  }

  if (error) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: `❌ Erreur: ${error.message}`,
      parse_mode: 'HTML',
    });
    return;
  }

  await sendTelegramMessage({
    chat_id: chatId,
    text: `
✅ <b>Livreur créé !</b>

👤 Nom: ${name}
📧 Email: <code>${email}</code>
📞 Tél: ${phone}
📍 Adresse: ${address}

Le livreur peut maintenant lier son Telegram avec:
<code>/register ${email}</code>
    `.trim(),
    parse_mode: 'HTML',
  });
}

/**
 * Afficher les livraisons du livreur
 */
async function handleMyDeliveries(chatId: string) {
  const supabase = await createClient();

  // Trouver le livreur
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
      text: '❌ Tu n\'es pas enregistré comme livreur. Utilise /register pour t\'inscrire.',
      parse_mode: 'HTML',
    });
    return;
  }

  // Récupérer les livraisons en cours
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
      `📦 #${o.id.slice(0, 8)} - ${o.delivery_date}\n   📍 ${o.delivery_address || 'Adresse à confirmer'}\n   💰 ${o.total}€ - ${o.status === 'preparing' ? '🔄 En préparation' : '✅ Confirmée'}`
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
