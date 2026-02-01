import nodemailer from 'nodemailer';

// Créer le transporter à la demande (meilleur pour serverless)
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

const FROM_EMAIL = process.env.BREVO_SENDER_EMAIL || 'contact@itmade.fr';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@itmade.fr';

interface OrderEmailData {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress?: string;
  deliveryDate?: string;
}

// Fonction utilitaire pour envoyer un email
async function sendEmail(to: string, subject: string, html: string) {
  console.log('=== TENTATIVE ENVOI EMAIL ===');
  console.log('To:', to);
  console.log('From:', FROM_EMAIL);
  console.log('SMTP User:', process.env.BREVO_SMTP_USER);
  console.log('SMTP Key exists:', !!process.env.BREVO_SMTP_KEY);

  try {
    const transporter = getTransporter();
    const result = await transporter.sendMail({
      from: `Verger & Com <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log('Email envoyé avec succès:', result.messageId);
    return true;
  } catch (error) {
    console.error('=== ERREUR ENVOI EMAIL ===');
    console.error('Error:', error);
    return false;
  }
}

// Email de confirmation pour le client
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const { orderId, customerEmail, customerName, total, items, deliveryAddress, deliveryDate } = data;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.price}€</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #0a0a0a; padding: 30px 20px; text-align: center;">
        <img src="https://verger-et-com.vercel.app/logo-email.png" alt="Verger & Com" style="max-width: 200px; height: auto;" />
      </div>
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Commande Confirmée !</h1>
      </div>

      <div style="padding: 40px 20px;">
        <p style="font-size: 16px; color: #374151;">
          Bonjour${customerName ? ` ${customerName}` : ''},
        </p>
        <p style="font-size: 16px; color: #374151;">
          Merci pour votre commande ! Nous préparons vos fruits frais avec soin.
        </p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
          <h2 style="margin: 0 0 15px; color: #111827; font-size: 18px;">Récapitulatif</h2>
          <p style="margin: 5px 0; color: #6b7280;">
            <strong>Commande :</strong> #${orderId.slice(0, 8)}
          </p>
          ${deliveryDate ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Livraison prévue :</strong> ${new Date(deliveryDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>` : ''}
          ${deliveryAddress ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Adresse :</strong> ${deliveryAddress}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; color: #374151;">Article</th>
              <th style="padding: 12px; text-align: center; color: #374151;">Qté</th>
              <th style="padding: 12px; text-align: right; color: #374151;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px 12px; font-weight: bold; color: #111827;">Total</td>
              <td style="padding: 15px 12px; font-weight: bold; color: #22c55e; text-align: right; font-size: 20px;">${total}€</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            📦 Vous recevrez un email lorsque votre commande sera en cours de livraison.
          </p>
        </div>
      </div>

      <div style="background: #0a0a0a; padding: 30px 20px; text-align: center;">
        <img src="https://verger-et-com.vercel.app/logo-email.png" alt="Verger & Com" style="max-width: 120px; height: auto; margin-bottom: 15px;" />
        <p style="margin: 0 0 10px; color: #9ca3af; font-size: 14px;">
          Une question ? Contactez-nous à contact@verger-et-com.fr
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Verger & Com - Fruits frais pour entreprises
        </p>
      </div>
    </div>
  `;

  await sendEmail(customerEmail, `Commande confirmée #${orderId.slice(0, 8)} - Verger & Com`, html);
}

// Email de notification pour l'admin
export async function sendNewOrderNotificationEmail(data: OrderEmailData) {
  const { orderId, customerEmail, total, items, deliveryAddress, deliveryDate } = data;

  const itemsList = items.map(item => `• ${item.name} x${item.quantity} - ${item.price}€`).join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://verger-et-com.vercel.app/logo-email.png" alt="Verger & Com" style="max-width: 180px; height: auto; margin-bottom: 20px;" />
        <h1 style="color: #22c55e; margin: 0;">🆕 Nouvelle Commande !</h1>
      </div>

      <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px; color: #15803d;">Total: ${total}€</h2>
          <p style="margin: 0; color: #166534;">Commande #${orderId.slice(0, 8)}</p>
        </div>

        <h3 style="color: #374151; margin-bottom: 10px;">Client</h3>
        <p style="color: #6b7280; margin: 5px 0;">📧 ${customerEmail}</p>
        ${deliveryAddress ? `<p style="color: #6b7280; margin: 5px 0;">📍 ${deliveryAddress}</p>` : ''}
        ${deliveryDate ? `<p style="color: #6b7280; margin: 5px 0;">📅 Livraison: ${new Date(deliveryDate).toLocaleDateString('fr-FR')}</p>` : ''}

        <h3 style="color: #374151; margin: 20px 0 10px;">Articles</h3>
        <pre style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #374151; white-space: pre-wrap;">${itemsList}</pre>

        <div style="margin-top: 30px; text-align: center;">
          <a href="https://verger-et-com.vercel.app/admin" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Voir dans l'admin
          </a>
        </div>
      </div>
    </div>
  `;

  await sendEmail(ADMIN_EMAIL, `🆕 Nouvelle commande #${orderId.slice(0, 8)} - ${total}€`, html);
}

// Email de changement de statut
export async function sendOrderStatusUpdateEmail(
  customerEmail: string,
  orderId: string,
  newStatus: string,
  customerName?: string,
  deliveryProofUrl?: string
) {
  const statusMessages: Record<string, { emoji: string; title: string; message: string }> = {
    delivered: {
      emoji: '✅',
      title: 'Commande livrée',
      message: 'Votre commande a été livrée avec succès. Bon appétit et merci de votre confiance !',
    },
  };

  const status = statusMessages[newStatus];
  if (!status) return;

  // Section photo de preuve si disponible
  const photoSection = deliveryProofUrl ? `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px; text-align: center;">
        📸 <strong>Photo de livraison</strong>
      </p>
      <div style="text-align: center;">
        <img
          src="${deliveryProofUrl}"
          alt="Preuve de livraison"
          style="max-width: 100%; max-height: 400px; border-radius: 12px; border: 1px solid #e5e7eb;"
        />
      </div>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px; text-align: center;">
        Cette photo a été prise par notre livreur lors de la remise de votre commande.
      </p>
    </div>
  ` : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 25px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://verger-et-com.vercel.app/logo-email.png" alt="Verger & Com" style="max-width: 160px; height: auto;" />
      </div>
      <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px 20px; text-align: center;">
        <div style="font-size: 50px; margin-bottom: 10px;">${status.emoji}</div>
        <h1 style="color: #ffffff; margin: 0;">${status.title}</h1>
      </div>

      <div style="background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #374151;">
          Bonjour${customerName ? ` ${customerName}` : ''},
        </p>
        <p style="font-size: 16px; color: #374151;">
          ${status.message}
        </p>
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
          Commande #${orderId.slice(0, 8)}
        </p>
        ${photoSection}
      </div>

      <div style="text-align: center; padding: 20px;">
        <p style="color: #9ca3af; font-size: 12px;">
          Verger & Com - Fruits frais pour entreprises
        </p>
      </div>
    </div>
  `;

  await sendEmail(customerEmail, `${status.emoji} ${status.title} - Commande #${orderId.slice(0, 8)}`, html);
}

// Email de code de vérification
export async function sendVerificationCodeEmail(email: string, code: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://verger-et-com.vercel.app/logo-email.png" alt="Verger & Com" style="max-width: 180px; height: auto;" />
      </div>
      <div style="background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #374151;">Bonjour,</p>
        <p style="font-size: 16px; color: #374151;">Voici votre code de vérification :</p>
        <div style="background: #f3f4f6; padding: 25px; text-align: center; border-radius: 12px; margin: 25px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #22c55e;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Ce code expire dans <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #6b7280;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
      </div>
      <div style="background: #0a0a0a; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Verger & Com - Fruits frais pour entreprises
        </p>
      </div>
    </div>
  `;

  return sendEmail(email, 'Votre code de vérification - Verger & Com', html);
}

// Email d'échec de paiement
interface PaymentFailedData {
  customerEmail: string;
  invoiceId: string;
  amount: number;
  nextAttempt: string | null;
}

export async function sendPaymentFailedEmail(data: PaymentFailedData) {
  const { customerEmail, invoiceId, amount, nextAttempt } = data;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://verger-et-com.vercel.app/logo-email.png" alt="Verger & Com" style="max-width: 180px; height: auto;" />
      </div>
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center;">
        <div style="font-size: 50px; margin-bottom: 10px;">⚠️</div>
        <h1 style="color: #ffffff; margin: 0;">Échec de paiement</h1>
      </div>

      <div style="background: #ffffff; padding: 40px 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #374151;">Bonjour,</p>
        <p style="font-size: 16px; color: #374151;">
          Nous n'avons pas pu traiter le paiement de votre abonnement Verger & Com.
        </p>

        <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px; color: #991b1b; font-weight: bold;">
            Montant : ${amount}€
          </p>
          <p style="margin: 0; color: #991b1b; font-size: 14px;">
            Référence : ${invoiceId.slice(0, 20)}...
          </p>
        </div>

        ${nextAttempt ? `
        <p style="font-size: 16px; color: #374151;">
          <strong>Prochaine tentative :</strong> ${nextAttempt}
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Veuillez vous assurer que votre moyen de paiement est valide avant cette date.
        </p>
        ` : `
        <p style="font-size: 14px; color: #6b7280;">
          Veuillez mettre à jour votre moyen de paiement pour continuer à recevoir vos livraisons.
        </p>
        `}

        <div style="margin-top: 30px; text-align: center;">
          <a href="https://verger-et-com.vercel.app/mon-abonnement" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Mettre à jour mon paiement
          </a>
        </div>
      </div>

      <div style="background: #0a0a0a; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px;">
          Une question ? Contactez-nous à contact@verger-et-com.fr
        </p>
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          Verger & Com - Fruits frais pour entreprises
        </p>
      </div>
    </div>
  `;

  return sendEmail(customerEmail, '⚠️ Échec de paiement - Verger & Com', html);
}
