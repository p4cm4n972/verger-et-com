import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationCodeEmail } from '@/lib/email';

// Générer un code à 6 chiffres
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST - Envoyer un code de vérification
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const supabase = await createClient();

    // Supprimer les anciens codes pour cet email
    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', normalizedEmail);

    // Créer le nouveau code
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: normalizedEmail,
        code,
        expires_at: expiresAt.toISOString(),
      } as never);

    if (insertError) {
      console.error('Erreur insertion code:', insertError);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Envoyer l'email via Brevo
    await sendVerificationCodeEmail(normalizedEmail, code);

    return NextResponse.json({
      success: true,
      message: 'Code envoyé par email'
    });
  } catch (error) {
    console.error('Erreur API verify:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Vérifier un code
export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = await createClient();

    // Récupérer le code
    const { data: verification, error } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('code', code)
      .single() as { data: { id: string; expires_at: string; attempts: number } | null; error: Error | null };

    if (error || !verification) {
      return NextResponse.json(
        { error: 'Code invalide' },
        { status: 400 }
      );
    }

    // Vérifier expiration
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code expiré' },
        { status: 400 }
      );
    }

    // Vérifier nombre de tentatives
    if (verification.attempts >= 5) {
      return NextResponse.json(
        { error: 'Trop de tentatives, demandez un nouveau code' },
        { status: 400 }
      );
    }

    // Marquer comme vérifié
    await supabase
      .from('email_verification_codes')
      .update({ verified_at: new Date().toISOString() } as never)
      .eq('id', verification.id);

    // Générer un token de session
    const sessionToken = Buffer.from(`${normalizedEmail}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      sessionToken,
      email: normalizedEmail
    });
  } catch (error) {
    console.error('Erreur API verify:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
