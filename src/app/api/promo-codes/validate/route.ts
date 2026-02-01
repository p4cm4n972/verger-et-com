import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: number;
  expires_at: string | null;
  is_active: boolean;
}

// POST - Valider un code promo
export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal, customerEmail } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Code requis' }, { status: 400 });
    }

    const supabase = await createClient();

    // Récupérer le code promo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promoCode, error } = await (supabase as any)
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !promoCode) {
      return NextResponse.json({ valid: false, error: 'Code promo invalide' }, { status: 404 });
    }

    const promo = promoCode as PromoCode;

    // Vérifier si le code est actif
    if (!promo.is_active) {
      return NextResponse.json({ valid: false, error: 'Ce code promo n\'est plus actif' });
    }

    // Vérifier la date d'expiration
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a expiré' });
    }

    // Vérifier le nombre d'utilisations max
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a atteint sa limite d\'utilisation' });
    }

    // Vérifier le montant minimum de commande
    if (orderTotal && promo.min_order_amount > 0 && orderTotal < promo.min_order_amount) {
      return NextResponse.json({
        valid: false,
        error: `Montant minimum requis: ${promo.min_order_amount.toFixed(2)}€`
      });
    }

    // Vérifier si le client a déjà utilisé ce code (optionnel)
    if (customerEmail) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingUse } = await (supabase as any)
        .from('promo_code_uses')
        .select('id')
        .eq('promo_code_id', promo.id)
        .eq('customer_email', customerEmail.toLowerCase())
        .single();

      if (existingUse) {
        return NextResponse.json({ valid: false, error: 'Vous avez déjà utilisé ce code promo' });
      }
    }

    // Calculer la réduction
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = orderTotal ? (orderTotal * promo.discount_value / 100) : 0;
    } else {
      discountAmount = promo.discount_value;
    }

    // Retourner les infos du code valide
    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountAmount: Math.round(discountAmount * 100) / 100,
      description: promo.description,
      minOrderAmount: promo.min_order_amount,
    });

  } catch (error) {
    console.error('Erreur validation code promo:', error);
    return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
