import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyToken } from '../auth/route';

// Générer un code promo unique
function generatePromoCode(prefix: string = 'VERGER'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans O, 0, I, 1 pour éviter confusion
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - Lister tous les codes promo
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promoCodes, error } = await (supabase as any)
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ promoCodes: promoCodes || [] });
  } catch (error) {
    console.error('Erreur récupération codes promo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un nouveau code promo
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      code: customCode,
      discount_type,
      discount_value,
      description,
      max_uses,
      min_order_amount,
      expires_at,
    } = body;

    // Validation
    if (!discount_type || !['percentage', 'fixed'].includes(discount_type)) {
      return NextResponse.json({ error: 'Type de réduction invalide' }, { status: 400 });
    }

    if (!discount_value || discount_value <= 0) {
      return NextResponse.json({ error: 'Valeur de réduction invalide' }, { status: 400 });
    }

    if (discount_type === 'percentage' && discount_value > 100) {
      return NextResponse.json({ error: 'Le pourcentage ne peut pas dépasser 100%' }, { status: 400 });
    }

    // Générer ou utiliser le code personnalisé
    const code = customCode?.toUpperCase().replace(/\s/g, '') || generatePromoCode();

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('promo_codes')
      .insert({
        code,
        discount_type,
        discount_value,
        description: description || null,
        max_uses: max_uses || null,
        min_order_amount: min_order_amount || 0,
        expires_at: expires_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, promoCode: data });
  } catch (error) {
    console.error('Erreur création code promo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier un code promo (activer/désactiver)
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('promo_codes')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: is_active ? 'Code activé' : 'Code désactivé'
    });
  } catch (error) {
    console.error('Erreur modification code promo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un code promo
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Code supprimé' });
  } catch (error) {
    console.error('Erreur suppression code promo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
