// ==========================================
// VERGER & COM - Stripe Webhook
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail } from '@/lib/email';
import { sendNewOrderNotificationToDrivers } from '@/lib/telegram';
import Stripe from 'stripe';

// Désactiver le body parsing de Next.js pour les webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Erreur de vérification du webhook:', err);
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    );
  }

  // Traitement des événements
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Paiement réussi: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Paiement échoué: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur traitement webhook:', error);
    return NextResponse.json(
      { error: 'Erreur de traitement' },
      { status: 500 }
    );
  }
}

// Traitement d'une commande complétée
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = await createClient();

  // Récupérer les métadonnées
  const metadata = session.metadata || {};
  const items = metadata.items ? JSON.parse(metadata.items) : [];
  const companyId = metadata.companyId;
  const customerPhone = metadata.customerPhone;
  const deliveryDay = metadata.deliveryDay as 'monday' | 'tuesday' | undefined;
  const deliveryDate = metadata.deliveryDate;

  // Récupérer l'adresse de livraison depuis les métadonnées ou la session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionAny = session as any;
  const shippingAddress = sessionAny.shipping_details?.address;
  const deliveryAddress = metadata.deliveryAddress || (shippingAddress ? formatAddress(shippingAddress) : '');

  // Récupérer les détails de la session pour le total
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items'],
  });

  const total = (fullSession.amount_total || 0) / 100;
  const subtotal = (fullSession.amount_subtotal || 0) / 100;

  // Créer la commande dans Supabase
  const orderData = {
    company_id: companyId || null,
    status: 'pending' as const,
    subtotal,
    delivery_fee: 0,
    total,
    delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
    delivery_address: deliveryAddress,
    preferred_delivery_day: deliveryDay || null,
    customer_email: session.customer_email || null,
    customer_phone: customerPhone || null,
    driver_status: 'pending' as const,
    notes: `Paiement Stripe: ${session.payment_intent}`,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderError } = await (supabase as any)
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) {
    console.error('Erreur création commande:', orderError);
    throw orderError;
  }

  // Créer les articles de commande
  if (order && items.length > 0) {
    const orderId = (order as { id: string }).id;
    const orderItems = items.map((item: {
      type: string;
      productId: string;
      quantity: number;
      isCustom: boolean;
      customBasketData: string | null;
    }) => ({
      order_id: orderId,
      product_type: item.type as 'basket' | 'juice' | 'dried',
      product_id: item.productId,
      quantity: item.quantity,
      is_custom: item.isCustom || false,
      custom_basket_data: item.customBasketData ? JSON.parse(item.customBasketData) : null,
      unit_price: 0,
      total_price: 0,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await (supabase as any)
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Erreur création articles:', itemsError);
    }
  }

  const orderId = order ? (order as { id: string }).id : 'unknown';
  console.log(`Commande créée: ${orderId} pour ${session.customer_email}`);

  // Envoyer les emails de notification
  const emailData = {
    orderId,
    customerEmail: session.customer_email || '',
    total,
    items: items.map((item: { productId: string; quantity: number }) => ({
      name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      quantity: item.quantity,
      price: Math.round(total / items.length), // Approximation
    })),
    deliveryAddress,
    deliveryDate,
  };

  // Email de confirmation au client
  if (session.customer_email) {
    await sendOrderConfirmationEmail(emailData);
  }

  // Notification à l'admin
  await sendNewOrderNotificationEmail(emailData);

  // Notification Telegram aux livreurs (envoyée même sans deliveryDay)
  try {
    console.log('=== NOTIFICATION TELEGRAM ===');
    console.log('deliveryDay:', deliveryDay);

    // Récupérer tous les livreurs actifs avec un chat ID Telegram
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: drivers, error: driversError } = await (supabase as any)
      .from('users')
      .select('telegram_chat_id')
      .eq('role', 'driver')
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    console.log('Livreurs trouvés:', drivers?.length || 0);
    if (driversError) {
      console.error('Erreur récupération livreurs:', driversError);
    }

    if (drivers && drivers.length > 0) {
      const driverChatIds = drivers
        .map((d: { telegram_chat_id: string }) => d.telegram_chat_id)
        .filter(Boolean);

      console.log('Chat IDs Telegram:', driverChatIds);

      await sendNewOrderNotificationToDrivers(driverChatIds, {
        orderId,
        customerEmail: session.customer_email || '',
        customerPhone: customerPhone || '',
        total,
        deliveryDate: deliveryDate || new Date().toISOString().split('T')[0],
        deliveryDay: deliveryDay || 'monday',
        deliveryAddress,
        items: items.map((item: { productId: string; quantity: number }) => ({
          name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          quantity: item.quantity,
        })),
      });

      console.log(`Notification Telegram envoyée à ${driverChatIds.length} livreurs`);
    } else {
      console.log('Aucun livreur avec telegram_chat_id trouvé');
    }
  } catch (telegramError) {
    console.error('Erreur notification Telegram:', telegramError);
    // Ne pas bloquer la commande si la notification échoue
  }
}

// Formater une adresse Stripe
function formatAddress(address: Stripe.Address | null | undefined): string {
  if (!address) return '';
  const parts = [
    address.line1,
    address.line2,
    address.postal_code,
    address.city,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}
