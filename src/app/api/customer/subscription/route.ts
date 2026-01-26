import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelStripeSubscription, getStripeSubscription } from '@/lib/stripe/server';

interface Company {
  id: string;
  stripe_customer_id: string | null;
}

interface DBSubscription {
  id: string;
  company_id: string;
  frequency: string;
  default_order_data: unknown;
  next_delivery_date: string;
  is_active: boolean;
  stripe_subscription_id: string | null;
  stripe_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// GET - Récupérer l'abonnement actif par email avec données Stripe
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Trouver l'entreprise par email
    const { data: company } = await supabase
      .from('companies')
      .select('id, stripe_customer_id')
      .eq('email', email.toLowerCase().trim())
      .single() as { data: Company | null };

    if (!company) {
      return NextResponse.json({ subscription: null });
    }

    // Récupérer l'abonnement actif
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .single() as { data: DBSubscription | null; error: { code: string } | null };

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur récupération abonnement:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Si un abonnement Stripe existe, synchroniser les données depuis Stripe
    if (subscription?.stripe_subscription_id) {
      try {
        const stripeSubscription = await getStripeSubscription(subscription.stripe_subscription_id);

        // Extraire les données de l'abonnement Stripe
        // Note: Dans Stripe API v2023+, current_period_end est sur les items
        const periodEnd = stripeSubscription.items?.data[0]?.current_period_end
          || stripeSubscription.cancel_at
          || null;

        const stripeData = {
          status: stripeSubscription.status,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        };

        // Mettre à jour les données locales avec Stripe (async, non bloquant)
        supabase
          .from('subscriptions')
          .update({
            stripe_status: stripeData.status,
            current_period_end: stripeData.current_period_end,
            cancel_at_period_end: stripeData.cancel_at_period_end,
          } as never)
          .eq('id', subscription.id)
          .then(() => console.log('Subscription synced with Stripe'));

        // Retourner les données Stripe fraîches
        return NextResponse.json({
          subscription: {
            ...subscription,
            stripe_status: stripeData.status,
            current_period_end: stripeData.current_period_end,
            cancel_at_period_end: stripeData.cancel_at_period_end,
          },
          hasStripeCustomer: !!company.stripe_customer_id,
        });
      } catch (stripeError) {
        console.error('Erreur sync Stripe:', stripeError);
        // Retourner les données locales si Stripe échoue
      }
    }

    return NextResponse.json({
      subscription: subscription || null,
      hasStripeCustomer: !!company.stripe_customer_id,
    });
  } catch (error) {
    console.error('Erreur API customer/subscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour un abonnement
export async function POST(request: NextRequest) {
  try {
    const { email, frequency, items, deliveryAddress, nextDeliveryDate } = await request.json();

    if (!email || !frequency || !items || !deliveryAddress) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Trouver ou créer l'entreprise
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single() as { data: Company | null };

    let companyId: string;

    if (!existingCompany) {
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: 'Client',
          email: email.toLowerCase().trim(),
          address: deliveryAddress,
        } as never)
        .select('id')
        .single() as { data: Company | null; error: Error | null };

      if (createError || !newCompany) {
        console.error('Erreur création entreprise:', createError);
        return NextResponse.json(
          { error: 'Erreur serveur' },
          { status: 500 }
        );
      }

      companyId = newCompany.id;
    } else {
      companyId = existingCompany.id;
    }

    // Désactiver les anciens abonnements
    await supabase
      .from('subscriptions')
      .update({ is_active: false } as never)
      .eq('company_id', companyId);

    // Créer le nouvel abonnement
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        company_id: companyId,
        frequency,
        default_order_data: items,
        next_delivery_date: nextDeliveryDate,
        is_active: true,
      } as never)
      .select()
      .single() as { data: DBSubscription | null; error: Error | null };

    if (error) {
      console.error('Erreur création abonnement:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Erreur API customer/subscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Annuler un abonnement (via Stripe si disponible)
export async function DELETE(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Trouver l'entreprise
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single() as { data: Company | null };

    if (!company) {
      return NextResponse.json(
        { error: 'Aucun abonnement trouvé' },
        { status: 404 }
      );
    }

    // Trouver l'abonnement actif
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id')
      .eq('company_id', company.id)
      .eq('is_active', true)
      .single() as { data: { id: string; stripe_subscription_id: string | null } | null };

    if (!subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      );
    }

    // Si un abonnement Stripe existe, l'annuler via Stripe (cancel_at_period_end)
    if (subscription.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(subscription.stripe_subscription_id);

        // Mettre à jour localement
        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
            stripe_status: 'active', // Reste actif jusqu'à la fin de la période
          } as never)
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: 'Votre abonnement sera annulé à la fin de la période de facturation en cours.',
          cancelAtPeriodEnd: true,
        });
      } catch (stripeError) {
        console.error('Erreur annulation Stripe:', stripeError);
        return NextResponse.json(
          { error: 'Erreur lors de l\'annulation auprès de Stripe' },
          { status: 500 }
        );
      }
    }

    // Sinon, désactiver l'abonnement localement (ancienne méthode)
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false } as never)
      .eq('id', subscription.id);

    if (error) {
      console.error('Erreur annulation abonnement:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API customer/subscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
