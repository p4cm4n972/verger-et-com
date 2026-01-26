// ==========================================
// VERGER & COM - API Checkout
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createSubscriptionCheckoutSession, getOrCreateStripeCustomer, LineItem } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

// Prix Stripe par taille de panier (abonnements hebdomadaires uniquement)
// STRIPE_PRICE_DISCOVERY = panier découverte (35€/semaine)
// STRIPE_PRICE_TEAM = panier équipe (45€/semaine)
// STRIPE_PRICE_ENTERPRISE = panier entreprise (60€/semaine)
const SUBSCRIPTION_PRICES: Record<string, string | undefined> = {
  discovery: process.env.STRIPE_PRICE_DISCOVERY,
  team: process.env.STRIPE_PRICE_TEAM,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

// Types pour la requête
interface CheckoutRequestItem {
  type: 'basket' | 'juice' | 'dried';
  productId: string;
  name: string;
  description?: string;
  price: number; // en euros
  quantity: number;
  isCustom?: boolean;
  customBasketData?: {
    basketSizeId: string;
    items: Array<{ fruitId: string; quantity: number }>;
  };
}

interface CheckoutRequest {
  items: CheckoutRequestItem[];
  customerEmail?: string;
  customerPhone?: string;
  companyId?: string;
  deliveryDay?: 'monday' | 'tuesday';
  deliveryDate?: string;
  deliveryAddress?: string;
  // Champs pour abonnement
  isSubscription?: boolean;
  subscriptionPlan?: 'discovery' | 'team' | 'enterprise'; // Taille du panier
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const {
      items,
      customerEmail,
      customerPhone,
      companyId,
      deliveryDay,
      deliveryDate,
      deliveryAddress,
      isSubscription,
      subscriptionPlan,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article dans le panier' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || 'http://localhost:3001';

    // === MODE ABONNEMENT (tous hebdomadaires) ===
    if (isSubscription && subscriptionPlan) {
      if (!customerEmail) {
        return NextResponse.json(
          { error: 'Email requis pour un abonnement' },
          { status: 400 }
        );
      }

      const priceId = SUBSCRIPTION_PRICES[subscriptionPlan];
      if (!priceId) {
        return NextResponse.json(
          { error: `Prix non configuré pour le plan: ${subscriptionPlan}` },
          { status: 500 }
        );
      }

      // Créer ou récupérer le client Stripe
      const stripeCustomerId = await getOrCreateStripeCustomer(customerEmail);

      // Stocker stripe_customer_id sur la company si elle existe
      if (companyId) {
        const supabase = await createClient();
        await supabase
          .from('companies')
          .update({ stripe_customer_id: stripeCustomerId } as never)
          .eq('id', companyId);
      }

      // Métadonnées pour l'abonnement (tous les abonnements sont hebdomadaires)
      const metadata: Record<string, string> = {
        items: JSON.stringify(items.map((item) => ({
          type: item.type,
          productId: item.productId,
          quantity: item.quantity,
          isCustom: item.isCustom || false,
          customBasketData: item.customBasketData ? JSON.stringify(item.customBasketData) : null,
        }))),
        subscriptionFrequency: 'weekly', // Toujours hebdomadaire
        subscriptionPlan,
        isSubscription: 'true',
      };

      if (companyId) metadata.companyId = companyId;
      if (customerPhone) metadata.customerPhone = customerPhone;
      if (deliveryDay) metadata.deliveryDay = deliveryDay;
      if (deliveryDate) metadata.deliveryDate = deliveryDate;
      if (deliveryAddress) metadata.deliveryAddress = deliveryAddress;

      // Créer la session de checkout pour abonnement
      const session = await createSubscriptionCheckoutSession({
        priceId,
        customerId: stripeCustomerId,
        customerEmail,
        metadata,
        successUrl: `${origin}/commander/succes?session_id={CHECKOUT_SESSION_ID}&subscription=true`,
        cancelUrl: `${origin}/commander?cancelled=true`,
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // === MODE PAIEMENT UNIQUE ===
    // Convertir les items en format Stripe
    const lineItems: LineItem[] = items.map((item) => ({
      name: item.name,
      description: item.description,
      amount: Math.round(item.price * 100), // Convertir en centimes
      quantity: item.quantity,
    }));

    // Métadonnées pour traitement post-paiement
    const metadata: Record<string, string> = {
      items: JSON.stringify(items.map((item) => ({
        type: item.type,
        productId: item.productId,
        quantity: item.quantity,
        isCustom: item.isCustom || false,
        customBasketData: item.customBasketData ? JSON.stringify(item.customBasketData) : null,
      }))),
    };

    if (companyId) metadata.companyId = companyId;
    if (customerPhone) metadata.customerPhone = customerPhone;
    if (deliveryDay) metadata.deliveryDay = deliveryDay;
    if (deliveryDate) metadata.deliveryDate = deliveryDate;
    if (deliveryAddress) metadata.deliveryAddress = deliveryAddress;

    // Créer la session Stripe
    const session = await createCheckoutSession({
      lineItems,
      customerEmail,
      metadata,
      successUrl: `${origin}/commander/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/commander?cancelled=true`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Erreur checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur: ${errorMessage}` },
      { status: 500 }
    );
  }
}
