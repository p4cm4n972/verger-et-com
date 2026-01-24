// ==========================================
// VERGER & COM - API Driver Orders
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyDriverToken } from '../auth/route';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const driver = verifyDriverToken(token);
    if (!driver) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const supabase = await createClient();

    // Récupérer les commandes assignées au livreur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('assigned_driver_id', driver.id)
      .order('delivery_date', { ascending: true });

    if (error) {
      console.error('Erreur fetch orders:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Erreur API driver orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
