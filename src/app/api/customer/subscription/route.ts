import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Company {
  id: string;
}

interface Subscription {
  id: string;
  company_id: string;
  frequency: string;
  default_order_data: unknown;
  next_delivery_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET - Récupérer l'abonnement actif par email
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
      .select('id')
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
      .single() as { data: Subscription | null; error: { code: string } | null };

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur récupération abonnement:', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: subscription || null });
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
      .single() as { data: Subscription | null; error: Error | null };

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

// DELETE - Annuler un abonnement
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

    // Désactiver l'abonnement
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false } as never)
      .eq('company_id', company.id)
      .eq('is_active', true);

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
