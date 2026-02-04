import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Créer le transporter Brevo à la demande
function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
}

const FROM_EMAIL = process.env.BREVO_SENDER_EMAIL || 'contact@vergercom.fr';
const CONTACT_EMAIL = process.env.ADMIN_EMAIL || 'contact@vergercom.fr';

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

    const transporter = getTransporter();

    // Envoyer l'email à l'équipe Verger & Com
    try {
      await transporter.sendMail({
        from: `Verger & Com <${FROM_EMAIL}>`,
        to: CONTACT_EMAIL,
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
              Ce message a été envoyé via le formulaire de contact de vergercom.fr
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Erreur envoi email admin:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    // Envoyer un email de confirmation au client
    try {
      await transporter.sendMail({
        from: `Verger & Com <${FROM_EMAIL}>`,
        to: email,
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
              <a href="https://vergercom.fr" style="color: #22c55e;">vergercom.fr</a>
            </p>
          </div>
        `,
      });
    } catch (error) {
      // On ne bloque pas si l'email de confirmation échoue
      console.error('Erreur envoi email confirmation:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur contact:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
