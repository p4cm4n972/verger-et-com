import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Générer un token simple basé sur le timestamp et un secret
function generateToken(): string {
  const secret = process.env.ADMIN_SECRET || 'default-secret';
  const timestamp = Date.now().toString();
  const hash = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${hash}`;
}

// Vérifier un token
export function verifyToken(token: string): boolean {
  try {
    const [timestamp, hash] = token.split('.');
    const secret = process.env.ADMIN_SECRET || 'default-secret';
    const expectedHash = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');

    // Vérifier le hash
    if (hash !== expectedHash) return false;

    // Vérifier que le token n'est pas expiré (24h)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures

    return now - tokenTime < maxAge;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD non configuré');
      return NextResponse.json(
        { error: 'Configuration serveur incorrecte' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    const token = generateToken();

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Erreur auth admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Endpoint pour vérifier le token
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  return NextResponse.json({ valid: true });
}
