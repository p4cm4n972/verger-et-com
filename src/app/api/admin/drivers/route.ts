import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyToken } from '../auth/route';

// GET - Lister tous les livreurs
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: drivers, error } = await (supabase as any)
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        telegram_chat_id,
        is_active,
        created_at,
        drivers (
          telegram_username,
          available_monday,
          available_tuesday,
          max_deliveries_per_day,
          current_zone
        )
      `)
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Formater les données
    const formattedDrivers = drivers?.map((driver: {
      id: string;
      email: string;
      name: string;
      phone: string | null;
      telegram_chat_id: string | null;
      is_active: boolean;
      created_at: string;
      drivers: Array<{
        telegram_username: string | null;
        available_monday: boolean;
        available_tuesday: boolean;
        max_deliveries_per_day: number;
        current_zone: string | null;
      }> | null;
    }) => ({
      id: driver.id,
      email: driver.email,
      name: driver.name,
      phone: driver.phone,
      telegramChatId: driver.telegram_chat_id,
      isActive: driver.is_active,
      createdAt: driver.created_at,
      telegramUsername: driver.drivers?.[0]?.telegram_username || null,
      availableMonday: driver.drivers?.[0]?.available_monday ?? true,
      availableTuesday: driver.drivers?.[0]?.available_tuesday ?? true,
      currentZone: driver.drivers?.[0]?.current_zone || null,
    })) || [];

    return NextResponse.json({ drivers: formattedDrivers });
  } catch (error) {
    console.error('Erreur récupération livreurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier un livreur (suspendre/réactiver)
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
      .from('users')
      .update({ is_active })
      .eq('id', id)
      .eq('role', 'driver');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: is_active ? 'Livreur réactivé' : 'Livreur suspendu'
    });
  } catch (error) {
    console.error('Erreur modification livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un livreur
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

    // Supprimer le livreur (cascade supprime aussi la ligne dans drivers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'driver');

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Livreur supprimé' });
  } catch (error) {
    console.error('Erreur suppression livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
