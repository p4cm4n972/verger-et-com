import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderStatusUpdateEmail } from '@/lib/email';
import { verifyToken } from '../../auth/route';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier l'authentification
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, assigned_driver_id, driver_status } = body;

    const supabase = await createClient();

    // Récupérer la commande actuelle pour avoir l'email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: fetchError } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Construire l'objet de mise à jour
    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id;
    if (driver_status !== undefined) updateData.driver_status = driver_status;

    // Mettre à jour la commande
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Envoyer un email de notification uniquement à la livraison
    const customerEmail = order.customer_email;

    if (customerEmail && status === 'delivered') {
      await sendOrderStatusUpdateEmail(customerEmail, id, status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
