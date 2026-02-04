// ==========================================
// VERGER & COM - API Customer Portal
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

// POST - Générer une URL vers le Customer Portal Stripe
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Trouver la company par email pour récupérer le stripe_customer_id
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('stripe_customer_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Aucun compte trouvé avec cet email' },
        { status: 404 }
      );
    }

    const stripeCustomerId = (company as { stripe_customer_id: string | null }).stripe_customer_id;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun abonnement Stripe associé à ce compte' },
        { status: 404 }
      );
    }

    // Créer la session du Customer Portal
    const origin = request.headers.get('origin') || 'https://vergercom.fr';
    const session = await createCustomerPortalSession({
      customerId: stripeCustomerId,
      returnUrl: `${origin}/mon-abonnement`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Erreur Customer Portal:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du portail' },
      { status: 500 }
    );
  }
}
