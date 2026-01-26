import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Set up environment variables BEFORE any imports
// This must be hoisted to run before module loading
vi.hoisted(() => {
  process.env.STRIPE_PRICE_DISCOVERY = 'price_discovery_test';
  process.env.STRIPE_PRICE_TEAM = 'price_team_test';
  process.env.STRIPE_PRICE_ENTERPRISE = 'price_enterprise_test';
});

// Mock dependencies
vi.mock('@/lib/stripe/server', () => ({
  createCheckoutSession: vi.fn(() => Promise.resolve({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
  })),
  createSubscriptionCheckoutSession: vi.fn(() => Promise.resolve({
    id: 'cs_sub_test_123',
    url: 'https://checkout.stripe.com/sub_test',
  })),
  getOrCreateStripeCustomer: vi.fn(() => Promise.resolve('cus_test_123')),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

import { POST } from '../route';
import {
  createCheckoutSession,
  createSubscriptionCheckoutSession,
  getOrCreateStripeCustomer,
} from '@/lib/stripe/server';

// Helper to create mock NextRequest
function createMockRequest(body: object): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: {
      get: (name: string) => name === 'origin' ? 'https://verger-et-com.vercel.app' : null,
    },
  } as unknown as NextRequest;
}

// Sample items for testing
const sampleBasketItem = {
  type: 'basket' as const,
  productId: 'basket-5kg',
  name: 'Panier Découverte 5kg',
  description: 'Panier de fruits frais',
  price: 35,
  quantity: 1,
};

const sampleJuiceItem = {
  type: 'juice' as const,
  productId: 'juice-orange',
  name: 'Jus d\'orange 1L',
  price: 5,
  quantity: 2,
};

describe('Checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return 400 when items array is empty', async () => {
      const request = createMockRequest({ items: [] });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Aucun article dans le panier');
    });

    it('should return 400 when items is missing', async () => {
      const request = createMockRequest({});
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Aucun article dans le panier');
    });

    it('should return 400 when subscription without email', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        isSubscription: true,
        subscriptionPlan: 'discovery',
        // No customerEmail
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Email requis pour un abonnement');
    });
  });

  describe('One-time Payment', () => {
    it('should create a one-time checkout session', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.sessionId).toBe('cs_test_123');
      expect(json.url).toBe('https://checkout.stripe.com/test');
      expect(createCheckoutSession).toHaveBeenCalledTimes(1);
    });

    it('should pass correct line items to Stripe', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem, sampleJuiceItem],
      });
      
      await POST(request);
      
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              name: 'Panier Découverte 5kg',
              amount: 3500, // 35€ in cents
              quantity: 1,
            }),
            expect.objectContaining({
              name: "Jus d'orange 1L",
              amount: 500, // 5€ in cents
              quantity: 2,
            }),
          ]),
        })
      );
    });

    it('should include metadata with items', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerPhone: '0612345678',
        deliveryDay: 'monday',
        deliveryDate: '2026-02-02',
        deliveryAddress: '123 Rue Test',
      });
      
      await POST(request);
      
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            customerPhone: '0612345678',
            deliveryDay: 'monday',
            deliveryDate: '2026-02-02',
            deliveryAddress: '123 Rue Test',
          }),
        })
      );
    });

    it('should set correct success and cancel URLs', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
      });
      
      await POST(request);
      
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: 'https://verger-et-com.vercel.app/commander/succes?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: 'https://verger-et-com.vercel.app/commander?cancelled=true',
        })
      );
    });
  });

  describe('Subscription Checkout', () => {
    it('should create a subscription checkout session', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'discovery',
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.sessionId).toBe('cs_sub_test_123');
      expect(json.url).toBe('https://checkout.stripe.com/sub_test');
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledTimes(1);
    });

    it('should get or create Stripe customer for subscription', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'discovery',
      });
      
      await POST(request);
      
      expect(getOrCreateStripeCustomer).toHaveBeenCalledWith('test@example.com');
    });

    it('should map discovery plan to correct price ID', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'discovery',
      });
      
      await POST(request);
      
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_discovery_test',
        })
      );
    });

    it('should map team plan to correct price ID', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'team',
      });
      
      await POST(request);
      
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_team_test',
        })
      );
    });

    it('should map enterprise plan to correct price ID', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'enterprise',
      });
      
      await POST(request);
      
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          priceId: 'price_enterprise_test',
        })
      );
    });

    it('should always set subscriptionFrequency to weekly', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'discovery',
      });
      
      await POST(request);
      
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            subscriptionFrequency: 'weekly',
            isSubscription: 'true',
          }),
        })
      );
    });

    it('should pass customerId to subscription checkout', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'discovery',
      });
      
      await POST(request);
      
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cus_test_123',
          customerEmail: 'test@example.com',
        })
      );
    });

    it('should set subscription success URL with subscription flag', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'discovery',
      });
      
      await POST(request);
      
      expect(createSubscriptionCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: 'https://verger-et-com.vercel.app/commander/succes?session_id={CHECKOUT_SESSION_ID}&subscription=true',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Stripe session creation fails', async () => {
      vi.mocked(createCheckoutSession).mockRejectedValueOnce(
        new Error('Stripe API error')
      );
      
      const request = createMockRequest({
        items: [sampleBasketItem],
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toContain('Stripe API error');
    });

    it('should return 500 when subscription plan is invalid', async () => {
      const request = createMockRequest({
        items: [sampleBasketItem],
        customerEmail: 'test@example.com',
        isSubscription: true,
        subscriptionPlan: 'invalid_plan' as 'discovery', // Force invalid plan
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toContain('Prix non configuré');
    });
  });

  describe('Custom Basket Items', () => {
    it('should include custom basket data in metadata', async () => {
      const customItem = {
        ...sampleBasketItem,
        isCustom: true,
        customBasketData: {
          basketSizeId: 'size-5kg',
          items: [
            { fruitId: 'apple', quantity: 5 },
            { fruitId: 'orange', quantity: 3 },
          ],
        },
      };
      
      const request = createMockRequest({
        items: [customItem],
      });
      
      await POST(request);
      
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            items: expect.stringContaining('"isCustom":true'),
          }),
        })
      );
    });
  });
});
