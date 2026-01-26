// ==========================================
// VERGER & COM - Intégration Telegram
// ==========================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface OrderNotificationData {
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  deliveryDate: string;
  deliveryDay: 'monday' | 'tuesday';
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

/**
 * Envoie un message Telegram
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<{ ok: boolean; result?: { message_id: number } }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN non configuré');
    return { ok: false };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Erreur Telegram:', result);
    }

    return result;
  } catch (error) {
    console.error('Erreur envoi Telegram:', error);
    return { ok: false };
  }
}

/**
 * Formate le jour de livraison en français
 */
function formatDeliveryDay(day: 'monday' | 'tuesday'): string {
  return day === 'monday' ? 'Lundi' : 'Mardi';
}

/**
 * Envoie une notification de nouvelle commande aux livreurs
 */
export async function sendNewOrderNotificationToDrivers(
  driverChatIds: string[],
  orderData: OrderNotificationData
): Promise<void> {
  const itemsList = orderData.items
    .map(item => `  • ${item.name} x${item.quantity}`)
    .join('\n');

  const messageText = `
🍎 <b>NOUVELLE COMMANDE</b> 🍎

📦 <b>Commande #${orderData.orderId.slice(0, 8)}</b>

📅 <b>Livraison:</b> ${formatDeliveryDay(orderData.deliveryDay)}
📆 <b>Date:</b> ${orderData.deliveryDate}

📍 <b>Adresse:</b>
${orderData.deliveryAddress || 'À confirmer'}

🛒 <b>Articles:</b>
${itemsList}

💰 <b>Total:</b> ${orderData.total}€

👤 <b>Client:</b> ${orderData.customerEmail}
📞 <b>Tél:</b> ${orderData.customerPhone || 'Non renseigné'}
`.trim();

  const keyboard: InlineKeyboardButton[][] = [
    [
      { text: '✅ Accepter', callback_data: `accept_order:${orderData.orderId}` },
      { text: '❌ Refuser', callback_data: `refuse_order:${orderData.orderId}` },
    ],
  ];

  // Envoyer à tous les livreurs disponibles
  for (const chatId of driverChatIds) {
    await sendTelegramMessage({
      chat_id: chatId,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
  }
}

/**
 * Envoie une notification au livreur quand une commande lui est attribuée par l'admin
 */
export async function sendOrderAssignedNotification(
  chatId: string,
  orderData: {
    orderId: string;
    total: number;
    deliveryDate: string;
    deliveryAddress: string;
    customerEmail: string;
    customerPhone?: string;
  }
): Promise<void> {
  const messageText = `
🚚 <b>COMMANDE ATTRIBUÉE</b>

📦 <b>Commande #${orderData.orderId.slice(0, 8)}</b>

📅 <b>Date de livraison:</b> ${orderData.deliveryDate}

📍 <b>Adresse:</b>
${orderData.deliveryAddress || 'À confirmer'}

💰 <b>Total:</b> ${orderData.total}€
💵 <b>Ta part:</b> ${orderData.total - 10}€

👤 <b>Client:</b> ${orderData.customerEmail}
${orderData.customerPhone ? `📞 <b>Tél:</b> ${orderData.customerPhone}` : ''}

Une fois la livraison effectuée, clique sur le bouton ci-dessous:
`.trim();

  const keyboard: InlineKeyboardButton[][] = [
    [{ text: '📦 Valider la livraison', callback_data: `deliver_order:${orderData.orderId}` }],
  ];

  await sendTelegramMessage({
    chat_id: chatId,
    text: messageText,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * Envoie une confirmation d'acceptation au livreur
 */
export async function sendOrderAcceptedConfirmation(
  chatId: string,
  orderId: string,
  deliveryDate: string
): Promise<void> {
  const messageText = `
✅ <b>Commande acceptée !</b>

📦 Commande #${orderId.slice(0, 8)}
📅 Livraison prévue: ${deliveryDate}

Tu recevras un rappel le jour de la livraison.

Pour valider la livraison, utilise le bouton ci-dessous le jour J:
`.trim();

  const keyboard: InlineKeyboardButton[][] = [
    [{ text: '📦 Valider la livraison', callback_data: `deliver_order:${orderId}` }],
  ];

  await sendTelegramMessage({
    chat_id: chatId,
    text: messageText,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard },
  });
}

/**
 * Envoie une notification de livraison effectuée
 */
export async function sendDeliveryCompletedNotification(
  adminChatId: string,
  orderId: string,
  driverName: string
): Promise<void> {
  const messageText = `
📦 <b>Livraison effectuée !</b>

Commande #${orderId.slice(0, 8)} livrée par ${driverName}.
`.trim();

  await sendTelegramMessage({
    chat_id: adminChatId,
    text: messageText,
    parse_mode: 'HTML',
  });
}

/**
 * Envoie un rappel de livraison au livreur
 */
export async function sendDeliveryReminder(
  chatId: string,
  orderId: string,
  deliveryAddress: string
): Promise<void> {
  const messageText = `
⏰ <b>RAPPEL LIVRAISON</b>

📦 Commande #${orderId.slice(0, 8)}
📍 Adresse: ${deliveryAddress}

N'oublie pas de valider la livraison une fois terminée !
`.trim();

  const keyboard: InlineKeyboardButton[][] = [
    [{ text: '📦 Valider la livraison', callback_data: `deliver_order:${orderId}` }],
  ];

  await sendTelegramMessage({
    chat_id: chatId,
    text: messageText,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard },
  });
}
