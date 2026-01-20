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

// Créer une session de checkout pour abonnement
export async function createSubscriptionCheckoutSession({
  priceId,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    customer_email: customerEmail,
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'fr',
  });

  return session;
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
