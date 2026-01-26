import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type Stripe from 'stripe';

// Mock all external dependencies
vi.mock('@/lib/stripe/server', () => ({
  constructWebhookEvent: vi.fn(),
  stripe: {
    checkout: {
      sessions: {
        retrieve: vi.fn(() => Promise.resolve({
          id: 'cs_test',
          amount_total: 3500,
          customer_email: 'test@example.com',
          metadata: { items: '[]' },
        })),
        listLineItems: vi.fn(() => Promise.resolve({ data: [] })),
      },
    },
    subscriptions: {
      retrieve: vi.fn(() => Promise.resolve({
        id: 'sub_test',
        items: { data: [{ price: { id: 'price_test' } }] },
      })),
    },
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendNewOrderNotificationEmail: vi.fn(),
  sendPaymentFailedEmail: vi.fn(),
}));

vi.mock('@/lib/telegram', () => ({
  sendNewOrderNotificationToDrivers: vi.fn(),
}));

vi.mock('@/lib/stripe/subscription-utils', () => ({
  calculateNextDeliveryFromCurrent: vi.fn(() => '2026-02-02'),
}));

// Import after mocks are set up
import { POST } from '../route';
import { constructWebhookEvent } from '@/lib/stripe/server';

// Helper to create mock NextRequest
function createMockRequest(body: string, signature: string | null): NextRequest {
  const headers = new Headers();
  if (signature) {
    headers.set('stripe-signature', signature);
  }
  
  return {
    text: () => Promise.resolve(body),
    headers: {
      get: (name: string) => headers.get(name),
    },
  } as unknown as NextRequest;
}

// Helper to create mock Stripe events
function createMockStripeEvent(type: string, data: object): Stripe.Event {
  return {
    id: 'evt_test_123',
    object: 'event',
    api_version: '2023-10-16',
    created: 1706000000,
    type,
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as Stripe.Event;
}

describe('Stripe Webhook Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Signature Validation', () => {
    it('should return 400 when signature is missing', async () => {
      const request = createMockRequest('{}', null);
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Signature manquante');
    });

    it('should return 400 when signature is invalid', async () => {
      const request = createMockRequest('{}', 'invalid_signature');
      
      vi.mocked(constructWebhookEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Signature invalide');
    });

    it('should process event when signature is valid', async () => {
      const request = createMockRequest('{}', 'valid_signature');
      const mockEvent = createMockStripeEvent('payment_intent.succeeded', {
        id: 'pi_test',
      });
      
      vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
    });
  });

  describe('Event Routing', () => {
    describe('checkout.session.completed', () => {
      it('should route subscription mode to subscription handler', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockSession: Partial<Stripe.Checkout.Session> = {
          id: 'cs_test',
          mode: 'subscription',
          customer_email: 'test@example.com',
          metadata: {
            subscriptionFrequency: 'weekly',
            items: '[]',
          },
          customer: 'cus_test',
          subscription: 'sub_test',
        };
        
        const mockEvent = createMockStripeEvent('checkout.session.completed', mockSession);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        expect(constructWebhookEvent).toHaveBeenCalled();
      });

      it('should route payment mode to one-time handler', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockSession: Partial<Stripe.Checkout.Session> = {
          id: 'cs_test',
          mode: 'payment',
          customer_email: 'test@example.com',
          metadata: {
            items: '[]',
          },
        };
        
        const mockEvent = createMockStripeEvent('checkout.session.completed', mockSession);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
      });
    });

    describe('invoice.payment_succeeded', () => {
      it('should process renewal invoices (subscription_cycle)', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockInvoice: Partial<Stripe.Invoice> = {
          id: 'in_test',
          billing_reason: 'subscription_cycle',
          customer_email: 'test@example.com',
          amount_paid: 3500,
          parent: {
            subscription_details: {
              subscription: 'sub_test',
              metadata: {},
            },
          } as Stripe.Invoice.Parent,
        };
        
        const mockEvent = createMockStripeEvent('invoice.payment_succeeded', mockInvoice);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
      });

      it('should ignore creation invoices (subscription_create)', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockInvoice: Partial<Stripe.Invoice> = {
          id: 'in_test',
          billing_reason: 'subscription_create',
          customer_email: 'test@example.com',
        };
        
        const mockEvent = createMockStripeEvent('invoice.payment_succeeded', mockInvoice);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        // Should still return 200, just not process the renewal logic
        expect(response.status).toBe(200);
      });

      it('should ignore manual invoices', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockInvoice: Partial<Stripe.Invoice> = {
          id: 'in_test',
          billing_reason: 'manual',
        };
        
        const mockEvent = createMockStripeEvent('invoice.payment_succeeded', mockInvoice);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
      });
    });

    describe('invoice.payment_failed', () => {
      it('should process failed payment invoices', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockInvoice: Partial<Stripe.Invoice> = {
          id: 'in_test',
          customer_email: 'test@example.com',
          hosted_invoice_url: 'https://invoice.stripe.com/test',
          parent: {
            subscription_details: {
              subscription: 'sub_test',
              metadata: {},
            },
          } as Stripe.Invoice.Parent,
        };
        
        const mockEvent = createMockStripeEvent('invoice.payment_failed', mockInvoice);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
      });
    });

    describe('customer.subscription.updated', () => {
      it('should process subscription updates', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockSubscription: Partial<Stripe.Subscription> = {
          id: 'sub_test',
          status: 'active',
          cancel_at_period_end: false,
          items: {
            data: [{ current_period_end: 1738454400 }],
          } as Stripe.ApiList<Stripe.SubscriptionItem>,
        };
        
        const mockEvent = createMockStripeEvent('customer.subscription.updated', mockSubscription);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
      });
    });

    describe('customer.subscription.deleted', () => {
      it('should process subscription deletion', async () => {
        const request = createMockRequest('{}', 'valid_signature');
        const mockSubscription: Partial<Stripe.Subscription> = {
          id: 'sub_test',
          status: 'canceled',
        };
        
        const mockEvent = createMockStripeEvent('customer.subscription.deleted', mockSubscription);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
      });
    });

    describe('payment_intent events', () => {
      it('should log payment_intent.succeeded', async () => {
        const consoleSpy = vi.spyOn(console, 'log');
        const request = createMockRequest('{}', 'valid_signature');
        const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
          id: 'pi_test',
        };
        
        const mockEvent = createMockStripeEvent('payment_intent.succeeded', mockPaymentIntent);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Paiement réussi: pi_test');
      });

      it('should log payment_intent.payment_failed', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        const request = createMockRequest('{}', 'valid_signature');
        const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
          id: 'pi_test',
        };
        
        const mockEvent = createMockStripeEvent('payment_intent.payment_failed', mockPaymentIntent);
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Paiement échoué: pi_test');
      });
    });

    describe('Unknown events', () => {
      it('should log unknown event types and return 200', async () => {
        const consoleSpy = vi.spyOn(console, 'log');
        const request = createMockRequest('{}', 'valid_signature');
        
        const mockEvent = createMockStripeEvent('unknown.event.type', { id: 'test' });
        vi.mocked(constructWebhookEvent).mockReturnValue(mockEvent);
        
        const response = await POST(request);
        
        expect(response.status).toBe(200);
        expect(consoleSpy).toHaveBeenCalledWith('Événement non géré: unknown.event.type');
      });
    });
  });
});
