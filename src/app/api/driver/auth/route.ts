// ==========================================
// VERGER & COM - API Driver Auth
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const DRIVER_SECRET = process.env.DRIVER_SECRET || 'driver-secret-key-change-in-production';

// Générer un token pour le livreur
function generateToken(driverId: string, email: string): string {
  const payload = {
    id: driverId,
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
  };
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', DRIVER_SECRET)
    .update(data)
    .digest('hex');
  return Buffer.from(`${data}.${signature}`).toString('base64');
}

// Vérifier un token
export function verifyDriverToken(token: string): { id: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [data, signature] = decoded.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', DRIVER_SECRET)
      .update(data)
      .digest('hex');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(data);
    if (payload.exp < Date.now()) {
      return null;
    }

    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Trouver le livreur par email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: driver, error } = await (supabase as any)
      .from('users')
      .select('id, name, email, role')
      .eq('email', email)
      .eq('role', 'driver')
      .eq('is_active', true)
      .single();

    if (error || !driver) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Pour simplifier, on utilise un mot de passe par défaut pour les livreurs
    // En production, utiliser Supabase Auth ou un système de hash
    const defaultDriverPassword = process.env.DRIVER_PASSWORD || 'livreur2024';
    if (password !== defaultDriverPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Générer le token
    const token = generateToken(driver.id, driver.email);

    return NextResponse.json({
      token,
      name: driver.name,
      email: driver.email,
    });
  } catch (error) {
    console.error('Erreur auth driver:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
