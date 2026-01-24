// ==========================================
// VERGER & COM - API Mark Order Delivered
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyDriverToken } from '../../../auth/route';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

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

    // Vérifier que la commande appartient au livreur
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: fetchError } = await (supabase as any)
      .from('orders')
      .select('id, assigned_driver_id, customer_email, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    if (order.assigned_driver_id !== driver.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (order.status === 'delivered') {
      return NextResponse.json({ error: 'Commande déjà livrée' }, { status: 400 });
    }

    // Marquer comme livrée
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Erreur update order:', updateError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Envoyer email au client
    if (order.customer_email) {
      await sendOrderStatusUpdateEmail(order.customer_email, orderId, 'delivered');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API deliver:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
