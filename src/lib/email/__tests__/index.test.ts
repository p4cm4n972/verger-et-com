import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer
type SendMailArgs = { to: string; subject: string; html: string; from: string };
const mockSendMail = vi.fn<(args: SendMailArgs) => Promise<{ messageId: string }>>(() =>
  Promise.resolve({ messageId: 'test-message-id' })
);
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

// Set env variables
vi.hoisted(() => {
  process.env.BREVO_SMTP_USER = 'test-user';
  process.env.BREVO_SMTP_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'noreply@verger-et-com.fr';
  process.env.ADMIN_EMAIL = 'admin@verger-et-com.fr';
});

import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
  sendPaymentFailedEmail,
} from '../index';

describe('Email Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });
  });

  describe('sendOrderConfirmationEmail', () => {
    const sampleOrderData = {
      orderId: 'order-12345678-abcd',
      customerEmail: 'customer@example.com',
      customerName: 'Jean Dupont',
      total: 45,
      items: [
        { name: 'Panier Découverte', quantity: 1, price: 35 },
        { name: 'Jus Orange', quantity: 2, price: 5 },
      ],
      deliveryAddress: '123 Rue Test, 75001 Paris',
      deliveryDate: '2026-02-02',
    };

    it('should send email to customer', async () => {
      await sendOrderConfirmationEmail(sampleOrderData);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.any(String),
          html: expect.any(String),
        })
      );
    });

    it('should include order ID in email', async () => {
      await sendOrderConfirmationEmail(sampleOrderData);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs?.html).toContain('order-12');
    });

    it('should include items in email', async () => {
      await sendOrderConfirmationEmail(sampleOrderData);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs?.html).toContain('Panier Découverte');
      expect(callArgs?.html).toContain('Jus Orange');
    });

    it('should not throw on send failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      // Should not throw, function handles error internally
      await expect(sendOrderConfirmationEmail(sampleOrderData)).resolves.not.toThrow();
    });
  });

  describe('sendNewOrderNotificationEmail', () => {
    const sampleOrderData = {
      orderId: 'order-12345678-abcd',
      customerEmail: 'customer@example.com',
      total: 35,
      items: [{ name: 'Panier Découverte', quantity: 1, price: 35 }],
      deliveryAddress: '123 Rue Test',
      deliveryDate: '2026-02-02',
    };

    it('should send notification to admin', async () => {
      await sendNewOrderNotificationEmail(sampleOrderData);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@verger-et-com.fr',
          subject: expect.stringContaining('Nouvelle commande'),
        })
      );
    });

    it('should include customer email in notification', async () => {
      await sendNewOrderNotificationEmail(sampleOrderData);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs?.html).toContain('customer@example.com');
    });
  });

  describe('sendPaymentFailedEmail', () => {
    const sampleFailedData = {
      customerEmail: 'customer@example.com',
      invoiceId: 'in_test_12345678',
      amount: 35,
      nextAttempt: '5 février 2026',
    };

    it('should send payment failed email to customer', async () => {
      const result = await sendPaymentFailedEmail(sampleFailedData);

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('paiement'),
        })
      );
    });

    it('should include invoice ID in email', async () => {
      await sendPaymentFailedEmail(sampleFailedData);

      const callArgs = mockSendMail.mock.calls[0]?.[0];
      expect(callArgs?.html).toContain('in_test_12345678');
    });

    it('should handle null nextAttempt', async () => {
      const dataWithNullNextAttempt = {
        ...sampleFailedData,
        nextAttempt: null,
      };

      const result = await sendPaymentFailedEmail(dataWithNullNextAttempt);

      expect(result).toBe(true);
    });
  });
});
