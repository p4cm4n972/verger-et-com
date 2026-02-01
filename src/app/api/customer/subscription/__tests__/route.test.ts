import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Stripe server
vi.mock('@/lib/stripe/server', () => ({
  getStripeSubscription: vi.fn(() => Promise.resolve({
    status: 'active',
    cancel_at_period_end: false,
    items: {
      data: [{ current_period_end: 1738454400 }],
    },
  })),
  cancelStripeSubscription: vi.fn(() => Promise.resolve()),
}));

// Mock Supabase with chainable methods
const createChainableMock = (finalResult: unknown) => {
  const mock: Record<string, unknown> = {};
  mock.select = vi.fn(() => mock);
  mock.eq = vi.fn(() => mock);
  mock.single = vi.fn(() => Promise.resolve(finalResult));
  mock.insert = vi.fn(() => mock);
  mock.update = vi.fn(() => mock);
  mock.then = vi.fn((resolve: (value: unknown) => void) => resolve(finalResult));
  return mock;
};

let mockCompanyResult: { data: { id: string; stripe_customer_id: string } | null; error: null } = { data: { id: 'company-123', stripe_customer_id: 'cus_test' }, error: null };
let mockSubscriptionResult = { 
  data: { 
    id: 'sub-123',
    company_id: 'company-123',
    frequency: 'weekly',
    is_active: true,
    stripe_subscription_id: 'sub_stripe_123',
    stripe_status: 'active',
    current_period_end: '2026-02-02T00:00:00Z',
    cancel_at_period_end: false,
  }, 
  error: null 
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'companies') {
        return createChainableMock(mockCompanyResult);
      }
      if (table === 'subscriptions') {
        return createChainableMock(mockSubscriptionResult);
      }
      return createChainableMock({ data: null, error: null });
    }),
  })),
}));

import { GET, POST, DELETE } from '../route';
import { cancelStripeSubscription } from '@/lib/stripe/server';

// Helper to create mock NextRequest for GET/DELETE
function createMockRequest(email: string | null): NextRequest {
  return {
    nextUrl: {
      searchParams: {
        get: (key: string) => key === 'email' ? email : null,
      },
    },
  } as unknown as NextRequest;
}

function createMockPostRequest(body: object): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('Customer Subscription API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompanyResult = { data: { id: 'company-123', stripe_customer_id: 'cus_test' }, error: null };
    mockSubscriptionResult = { 
      data: { 
        id: 'sub-123',
        company_id: 'company-123',
        frequency: 'weekly',
        is_active: true,
        stripe_subscription_id: 'sub_stripe_123',
        stripe_status: 'active',
        current_period_end: '2026-02-02T00:00:00Z',
        cancel_at_period_end: false,
      }, 
      error: null 
    };
  });

  describe('GET - Retrieve subscription', () => {
    it('should return 400 when email is missing', async () => {
      const request = createMockRequest(null);
      const response = await GET(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Email requis');
    });

    it('should return null subscription when company not found', async () => {
      mockCompanyResult = { data: null, error: null };
      const request = createMockRequest('unknown@example.com');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.subscription).toBeNull();
    });

    it('should return subscription data', async () => {
      const request = createMockRequest('test@example.com');
      
      const response = await GET(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.hasStripeCustomer).toBe(true);
    });
  });

  describe('POST - Create subscription', () => {
    it('should return 400 when required fields are missing', async () => {
      const request = createMockPostRequest({
        email: 'test@example.com',
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Données manquantes');
    });

    it('should create subscription with valid data', async () => {
      const request = createMockPostRequest({
        email: 'test@example.com',
        frequency: 'weekly',
        items: [{ productId: 'basket-5kg', quantity: 1 }],
        deliveryAddress: '123 Rue Test, Paris',
        nextDeliveryDate: '2026-02-02',
      });
      
      const response = await POST(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.subscription).toBeDefined();
    });
  });

  describe('DELETE - Cancel subscription', () => {
    it('should return 400 when email is missing', async () => {
      const request = createMockRequest(null);
      const response = await DELETE(request);
      const json = await response.json();
      
      expect(response.status).toBe(400);
      expect(json.error).toBe('Email requis');
    });

    it('should return 404 when company not found', async () => {
      mockCompanyResult = { data: null, error: null };
      const request = createMockRequest('unknown@example.com');
      
      const response = await DELETE(request);
      const json = await response.json();
      
      expect(response.status).toBe(404);
      expect(json.error).toBe('Aucun abonnement trouvé');
    });

    it('should call Stripe to cancel subscription', async () => {
      const request = createMockRequest('test@example.com');
      
      const response = await DELETE(request);
      const json = await response.json();
      
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.cancelAtPeriodEnd).toBe(true);
      expect(cancelStripeSubscription).toHaveBeenCalledWith('sub_stripe_123');
    });

    it('should include message about period end', async () => {
      const request = createMockRequest('test@example.com');
      
      const response = await DELETE(request);
      const json = await response.json();
      
      expect(json.message).toContain('fin de la période de facturation');
    });
  });
});
