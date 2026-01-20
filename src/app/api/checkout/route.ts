// ==========================================
// VERGER & COM - API Checkout
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, LineItem } from '@/lib/stripe/server';

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
  companyId?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, customerEmail, companyId, deliveryDate, deliveryAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Aucun article dans le panier' },
        { status: 400 }
      );
    }

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
    if (deliveryDate) metadata.deliveryDate = deliveryDate;
    if (deliveryAddress) metadata.deliveryAddress = deliveryAddress;

    // Créer la session Stripe
    const origin = request.headers.get('origin') || 'http://localhost:3001';
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
