// ==========================================
// VERGER & COM - Stripe Server
// ==========================================

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Types pour les produits Verger & Com
export interface LineItem {
  name: string;
  description?: string;
  amount: number; // en centimes
  quantity: number;
  image?: string;
}

// Créer une session de checkout
export async function createCheckoutSession({
  lineItems,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
}: {
  lineItems: LineItem[];
  customerEmail?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    customer_email: customerEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'fr',
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['FR'],
    },
  });

  return session;
}

// Récupérer ou créer un client Stripe par email
export async function getOrCreateStripeCustomer(email: string, name?: string): Promise<string> {
  // Chercher un client existant par email
  const existingCustomers = await stripe.customers.list({
    email: email.toLowerCase().trim(),
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Créer un nouveau client
  const customer = await stripe.customers.create({
    email: email.toLowerCase().trim(),
    name: name || undefined,
    metadata: {
      source: 'verger-et-com',
    },
  });

  return customer.id;
}

// Créer un coupon Stripe pour une réduction unique (premier paiement seulement)
export async function createOneTimeCoupon({
  discountType,
  discountValue,
  promoCode,
}: {
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  promoCode: string;
}): Promise<string> {
  const couponData: Stripe.CouponCreateParams = {
    duration: 'once', // Appliquer une seule fois (premier paiement)
    name: `Promo ${promoCode}`,
    metadata: {
      promo_code: promoCode,
    },
  };

  if (discountType === 'percentage') {
    couponData.percent_off = discountValue;
  } else {
    couponData.amount_off = Math.round(discountValue * 100); // En centimes
    couponData.currency = 'eur';
  }

  const coupon = await stripe.coupons.create(couponData);
  return coupon.id;
}

// Créer une session de checkout pour abonnement avec customerId
export async function createSubscriptionCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
  couponId,
}: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  couponId?: string; // Coupon pour réduction sur le premier paiement
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    metadata,
    subscription_data: {
      metadata,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'fr',
    billing_address_collection: 'required',
  };

  // Ajouter le coupon si présent (réduction sur premier paiement uniquement)
  if (couponId) {
    sessionParams.discounts = [{ coupon: couponId }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

// Créer une session du Customer Portal Stripe
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Annuler un abonnement Stripe (à la fin de la période)
export async function cancelStripeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

// Récupérer un abonnement Stripe
export async function getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription as Stripe.Subscription;
}

// Récupérer une session de checkout
export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'customer'],
  });
}

// Construire l'événement webhook
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
