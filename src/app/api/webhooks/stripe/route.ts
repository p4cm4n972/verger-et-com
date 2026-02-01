// ==========================================
// VERGER & COM - Stripe Webhook
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendNewOrderNotificationEmail, sendPaymentFailedEmail } from '@/lib/email';
import { sendNewOrderNotificationToDrivers } from '@/lib/telegram';
import { calculateNextDeliveryFromCurrent } from '@/lib/stripe/subscription-utils';
import Stripe from 'stripe';

// Désactiver le body parsing de Next.js pour les webhooks
export const runtime = 'nodejs';

// Mapper fréquence Stripe → next_delivery_date
// Note: frequency gardé pour compatibilité future, actuellement tous les abonnements sont hebdomadaires
function calculateNextDeliveryDate(_frequency: 'weekly' | 'biweekly' | 'monthly'): string {
  const now = new Date();
  const nextDate = new Date(now);

  // Trouver le prochain lundi ou mardi
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  nextDate.setDate(now.getDate() + daysUntilMonday);

  // Si moins de 3 jours, décaler à la semaine suivante
  const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 3) {
    nextDate.setDate(nextDate.getDate() + 7);
  }

  return nextDate.toISOString().split('T')[0];
}

// calculateNextDeliveryFromCurrent est importé depuis @/lib/stripe/subscription-utils

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
    console.log(`=== WEBHOOK STRIPE REÇU: ${event.type} ===`);

    switch (event.type) {
      // === CHECKOUT COMPLÉTÉ ===
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed - mode: ${session.mode}, email: ${session.customer_email}`);
        console.log(`Metadata:`, JSON.stringify(session.metadata));
        if (session.mode === 'subscription') {
          console.log('>>> Traitement abonnement...');
          await handleSubscriptionCheckoutCompleted(session);
          console.log('>>> Abonnement traité avec succès');
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      // === FACTURE PAYÉE (renouvellement abonnement) ===
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Ne traiter que les factures de renouvellement (pas la première)
        if (invoice.billing_reason === 'subscription_cycle') {
          await handleInvoicePaymentSucceeded(invoice);
        }
        break;
      }

      // === ÉCHEC DE PAIEMENT ===
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // === ABONNEMENT MIS À JOUR ===
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      // === ABONNEMENT SUPPRIMÉ ===
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
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

    // Récupérer tous les livreurs actifs avec leur ID et chat ID Telegram
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: drivers, error: driversError } = await (supabase as any)
      .from('users')
      .select('id, telegram_chat_id')
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

      // Envoyer les notifications et récupérer les message_id
      const results = await sendNewOrderNotificationToDrivers(driverChatIds, {
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

      // Stocker les notifications avec message_id en base
      for (const result of results) {
        if (result.success && result.messageId) {
          // Trouver le driver_id correspondant au chat_id
          const driver = drivers.find(
            (d: { telegram_chat_id: string }) => d.telegram_chat_id === result.chatId
          );

          if (driver) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from('telegram_notifications').insert({
              order_id: orderId,
              driver_id: driver.id,
              message_id: result.messageId.toString(),
              status: 'sent',
              sent_at: new Date().toISOString(),
            });
          }
        }
      }

      console.log(`Notification Telegram envoyée à ${driverChatIds.length} livreurs (avec message_id stockés)`);
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

// ==========================================
// HANDLERS POUR ABONNEMENTS STRIPE
// ==========================================

// Handler: checkout.session.completed en mode subscription
async function handleSubscriptionCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('=== handleSubscriptionCheckoutCompleted START ===');
  const supabase = await createClient();

  const metadata = session.metadata || {};
  console.log('Raw metadata:', metadata);
  const subscriptionFrequency = metadata.subscriptionFrequency as 'weekly' | 'biweekly' | 'monthly';
  const items = metadata.items ? JSON.parse(metadata.items) : [];
  const companyId = metadata.companyId;
  const deliveryAddress = metadata.deliveryAddress || '';
  // customer_email peut être null si le client existe déjà - utiliser customer_details comme fallback
  const customerEmail = session.customer_email || session.customer_details?.email;
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  console.log('Parsed data:', {
    subscriptionFrequency,
    itemsCount: items.length,
    companyId,
    customerEmail,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  // Récupérer les détails de l'abonnement Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const stripePriceId = stripeSubscription.items.data[0]?.price.id || '';

  // Calculer la date de prochaine livraison
  const nextDeliveryDate = calculateNextDeliveryDate(subscriptionFrequency);

  // Créer ou mettre à jour la company avec stripe_customer_id
  let targetCompanyId = companyId;

  if (!targetCompanyId && customerEmail) {
    // Chercher une company existante par email
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('email', customerEmail.toLowerCase().trim())
      .single();

    if (existingCompany) {
      targetCompanyId = (existingCompany as { id: string }).id;
      // Mettre à jour le stripe_customer_id
      await supabase
        .from('companies')
        .update({ stripe_customer_id: stripeCustomerId } as never)
        .eq('id', targetCompanyId);
    } else {
      // Créer une nouvelle company
      const { data: newCompany } = await supabase
        .from('companies')
        .insert({
          name: 'Client abonné',
          email: customerEmail.toLowerCase().trim(),
          address: deliveryAddress,
          stripe_customer_id: stripeCustomerId,
        } as never)
        .select('id')
        .single();

      if (newCompany) {
        targetCompanyId = (newCompany as { id: string }).id;
      }
    }
  }

  if (!targetCompanyId) {
    console.error('Impossible de créer/trouver la company pour l\'abonnement');
    return;
  }

  console.log('Company ID trouvé/créé:', targetCompanyId);

  // Désactiver les anciens abonnements de cette company
  await supabase
    .from('subscriptions')
    .update({ is_active: false } as never)
    .eq('company_id', targetCompanyId);

  console.log('Anciens abonnements désactivés');

  // Créer l'abonnement en base de données
  const subscriptionData = {
    company_id: targetCompanyId,
    frequency: subscriptionFrequency,
    default_order_data: items,
    next_delivery_date: nextDeliveryDate,
    is_active: true,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_price_id: stripePriceId,
    stripe_status: stripeSubscription.status,
    current_period_end: stripeSubscription.items?.data[0]?.current_period_end
      ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
  };

  console.log('Données abonnement à insérer:', JSON.stringify(subscriptionData));

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert(subscriptionData as never)
    .select()
    .single();

  if (subError) {
    console.error('Erreur création abonnement:', subError);
    console.error('Détails erreur:', JSON.stringify(subError));
    return;
  }

  console.log('Abonnement créé avec succès:', subscription);

  const subscriptionId = subscription ? (subscription as { id: string }).id : 'unknown';
  console.log(`Abonnement créé: ${subscriptionId} pour ${customerEmail}`);

  // Créer la première commande
  const total = stripeSubscription.items.data[0]?.price.unit_amount
    ? stripeSubscription.items.data[0].price.unit_amount / 100
    : 0;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      company_id: targetCompanyId,
      status: 'pending',
      subtotal: total,
      delivery_fee: 0,
      total,
      is_subscription: true,
      subscription_frequency: subscriptionFrequency,
      subscription_id: subscriptionId,
      delivery_date: nextDeliveryDate,
      delivery_address: deliveryAddress,
      customer_email: customerEmail,
      notes: `Premier abonnement ${subscriptionFrequency} - Stripe: ${stripeSubscriptionId}`,
    } as never)
    .select()
    .single();

  if (orderError) {
    console.error('Erreur création commande initiale:', orderError);
  }

  const orderId = order ? (order as { id: string }).id : 'unknown';

  // Notifications
  if (customerEmail) {
    await sendOrderConfirmationEmail({
      orderId,
      customerEmail,
      total,
      items: items.map((item: { productId: string; quantity: number }) => ({
        name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        quantity: item.quantity,
        price: Math.round(total / items.length),
      })),
      deliveryAddress,
      deliveryDate: nextDeliveryDate,
    });
  }

  await sendNewOrderNotificationEmail({
    orderId,
    customerEmail: customerEmail || '',
    total,
    items: items.map((item: { productId: string; quantity: number }) => ({
      name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      quantity: item.quantity,
      price: Math.round(total / items.length),
    })),
    deliveryAddress,
    deliveryDate: nextDeliveryDate,
  });

  // Notification Telegram
  await sendTelegramNotification(supabase, {
    orderId,
    customerEmail: customerEmail || '',
    total,
    deliveryDate: nextDeliveryDate,
    deliveryAddress,
    items,
    isSubscription: true,
  });
}

// Handler: invoice.payment_succeeded (renouvellement)
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = await createClient();

  // Dans Stripe API v2023+, subscription est dans parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details;
  const stripeSubscriptionId = typeof subscriptionDetails?.subscription === 'string'
    ? subscriptionDetails.subscription
    : subscriptionDetails?.subscription?.id;

  if (!stripeSubscriptionId) {
    console.log('Invoice sans subscription, ignorée:', invoice.id);
    return;
  }

  const stripeInvoiceId = invoice.id;
  const customerEmail = invoice.customer_email;

  // Vérifier l'idempotence - éviter les doublons
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_invoice_id', stripeInvoiceId)
    .single();

  if (existingOrder) {
    console.log(`Commande déjà créée pour la facture ${stripeInvoiceId}`);
    return;
  }

  // Trouver l'abonnement en base
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .eq('is_active', true)
    .single();

  if (subError || !subscription) {
    console.error('Abonnement non trouvé pour:', stripeSubscriptionId);
    return;
  }

  const sub = subscription as {
    id: string;
    company_id: string;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    default_order_data: unknown;
    next_delivery_date: string;
  };

  // Récupérer l'adresse de livraison de la company
  const { data: company } = await supabase
    .from('companies')
    .select('address, email')
    .eq('id', sub.company_id)
    .single();

  const companyData = company as { address: string; email: string } | null;
  const deliveryAddress = companyData?.address || '';
  const total = invoice.amount_paid / 100;
  const items = sub.default_order_data as Array<{ productId: string; quantity: number }>;

  // Créer la commande automatique
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      company_id: sub.company_id,
      status: 'pending',
      subtotal: total,
      delivery_fee: 0,
      total,
      is_subscription: true,
      subscription_frequency: sub.frequency,
      subscription_id: sub.id,
      stripe_invoice_id: stripeInvoiceId,
      delivery_date: sub.next_delivery_date,
      delivery_address: deliveryAddress,
      customer_email: customerEmail,
      notes: `Renouvellement automatique - ${sub.frequency}`,
    } as never)
    .select()
    .single();

  if (orderError) {
    console.error('Erreur création commande renouvellement:', orderError);
    return;
  }

  const orderId = order ? (order as { id: string }).id : 'unknown';
  console.log(`Commande de renouvellement créée: ${orderId}`);

  // Mettre à jour next_delivery_date
  const newNextDeliveryDate = calculateNextDeliveryFromCurrent(sub.next_delivery_date, sub.frequency);
  await supabase
    .from('subscriptions')
    .update({ next_delivery_date: newNextDeliveryDate } as never)
    .eq('id', sub.id);

  // Notifications
  const emailToUse = customerEmail || companyData?.email || '';

  if (emailToUse) {
    await sendOrderConfirmationEmail({
      orderId,
      customerEmail: emailToUse,
      total,
      items: items.map((item) => ({
        name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        quantity: item.quantity,
        price: Math.round(total / items.length),
      })),
      deliveryAddress,
      deliveryDate: sub.next_delivery_date,
    });
  }

  await sendNewOrderNotificationEmail({
    orderId,
    customerEmail: emailToUse,
    total,
    items: items.map((item) => ({
      name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      quantity: item.quantity,
      price: Math.round(total / items.length),
    })),
    deliveryAddress,
    deliveryDate: sub.next_delivery_date,
  });

  // Notification Telegram
  await sendTelegramNotification(supabase, {
    orderId,
    customerEmail: emailToUse,
    total,
    deliveryDate: sub.next_delivery_date,
    deliveryAddress,
    items,
    isSubscription: true,
  });
}

// Handler: invoice.payment_failed
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerEmail = invoice.customer_email;

  if (customerEmail) {
    await sendPaymentFailedEmail({
      customerEmail,
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      nextAttempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR')
        : null,
    });
  }

  console.log(`Échec de paiement pour: ${customerEmail}, facture: ${invoice.id}`);
}

// Handler: customer.subscription.updated
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const supabase = await createClient();

  // Récupérer current_period_end depuis les items (API Stripe v2023+)
  const periodEnd = stripeSubscription.items?.data[0]?.current_period_end;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_status: stripeSubscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      is_active: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing',
    } as never)
    .eq('stripe_subscription_id', stripeSubscription.id);

  if (error) {
    console.error('Erreur mise à jour abonnement:', error);
  } else {
    console.log(`Abonnement mis à jour: ${stripeSubscription.id}, statut: ${stripeSubscription.status}`);
  }
}

// Handler: customer.subscription.deleted
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('subscriptions')
    .update({
      is_active: false,
      stripe_status: 'canceled',
    } as never)
    .eq('stripe_subscription_id', stripeSubscription.id);

  if (error) {
    console.error('Erreur suppression abonnement:', error);
  } else {
    console.log(`Abonnement annulé: ${stripeSubscription.id}`);
  }
}

// Fonction utilitaire pour envoyer les notifications Telegram
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendTelegramNotification(supabase: any, data: {
  orderId: string;
  customerEmail: string;
  total: number;
  deliveryDate: string;
  deliveryAddress: string;
  items: Array<{ productId: string; quantity: number }>;
  isSubscription?: boolean;
}) {
  try {
    // Récupérer tous les livreurs actifs avec leur ID et chat_id
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, telegram_chat_id')
      .eq('role', 'driver')
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (driversError) {
      console.error('Erreur récupération livreurs:', driversError);
      return;
    }

    if (drivers && drivers.length > 0) {
      const driverChatIds = drivers
        .map((d: { telegram_chat_id: string }) => d.telegram_chat_id)
        .filter(Boolean);

      // Envoyer les notifications et récupérer les message_id
      const results = await sendNewOrderNotificationToDrivers(driverChatIds, {
        orderId: data.orderId,
        customerEmail: data.customerEmail,
        customerPhone: '',
        total: data.total,
        deliveryDate: data.deliveryDate,
        deliveryDay: 'monday',
        deliveryAddress: data.deliveryAddress,
        items: data.items.map((item) => ({
          name: item.productId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          quantity: item.quantity,
        })),
      });

      // Stocker les notifications avec message_id en base
      for (const result of results) {
        if (result.success && result.messageId) {
          // Trouver le driver_id correspondant au chat_id
          const driver = drivers.find(
            (d: { telegram_chat_id: string }) => d.telegram_chat_id === result.chatId
          );

          if (driver) {
            await supabase.from('telegram_notifications').insert({
              order_id: data.orderId,
              driver_id: driver.id,
              message_id: result.messageId.toString(),
              status: 'sent',
              sent_at: new Date().toISOString(),
            });
          }
        }
      }

      console.log(`Notification Telegram envoyée à ${driverChatIds.length} livreurs (avec message_id stockés)`);
    }
  } catch (telegramError) {
    console.error('Erreur notification Telegram:', telegramError);
  }
}
