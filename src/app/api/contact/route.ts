import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();
    const { name, email, company, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Nom, email et message sont requis' },
        { status: 400 }
      );
    }

    // Envoyer l'email à l'équipe Verger & Com
    const { error } = await resend.emails.send({
      from: 'Verger & Com <contact@vergercom.fr>',
      to: ['contact@vergercom.fr'],
      replyTo: email,
      subject: `Nouveau message de ${name}${company ? ` (${company})` : ''}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Nouveau message de contact</h2>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
            ${company ? `<p><strong>Entreprise :</strong> ${company}</p>` : ''}
          </div>

          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message :</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Ce message a été envoyé via le formulaire de contact de verger-et-com.vercel.app
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    // Envoyer un email de confirmation au client
    await resend.emails.send({
      from: 'Verger & Com <contact@vergercom.fr>',
      to: [email],
      subject: 'Nous avons bien reçu votre message - Verger & Com',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Merci pour votre message !</h2>

          <p>Bonjour ${name},</p>

          <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Récapitulatif de votre message :</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>À très bientôt,</p>
          <p><strong>L'équipe Verger & Com</strong></p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

          <p style="color: #6b7280; font-size: 12px;">
            Verger & Com - Fruits frais pour entreprises<br>
            <a href="https://verger-et-com.vercel.app" style="color: #22c55e;">verger-et-com.vercel.app</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur contact:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
