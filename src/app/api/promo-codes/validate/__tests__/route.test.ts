import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { POST } from '../route';

// Sample active promo code
const activePromoCode = {
  id: 'promo-1',
  code: 'VERGER10',
  discount_type: 'percentage',
  discount_value: 10,
  description: 'Réduction de bienvenue',
  max_uses: 100,
  current_uses: 5,
  min_order_amount: 0,
  expires_at: null,
  is_active: true,
};

// Helper to create mock POST request
function createMockRequest(body: object): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

describe('Promo Codes Validate API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: promo code found and active
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockResolvedValue({
            data: activePromoCode,
            error: null,
          }),
        }),
      }),
    });
  });

  describe('Validation - Basic', () => {
    it('should return 400 when code is missing', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.valid).toBe(false);
      expect(json.error).toBe('Code requis');
    });

    it('should return 404 when code does not exist', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const request = createMockRequest({ code: 'INVALID' });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.valid).toBe(false);
      expect(json.error).toBe('Code promo invalide');
    });

    it('should validate a valid percentage promo code', async () => {
      const request = createMockRequest({
        code: 'VERGER10',
        orderTotal: 50,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(true);
      expect(json.code).toBe('VERGER10');
      expect(json.discountType).toBe('percentage');
      expect(json.discountValue).toBe(10);
      expect(json.discountAmount).toBe(5); // 10% of 50
    });

    it('should validate a valid fixed amount promo code', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                discount_type: 'fixed',
                discount_value: 15,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({
        code: 'VERGER15',
        orderTotal: 50,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(true);
      expect(json.discountType).toBe('fixed');
      expect(json.discountValue).toBe(15);
      expect(json.discountAmount).toBe(15);
    });
  });

  describe('Validation - Inactive Code', () => {
    it('should reject inactive promo code', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: { ...activePromoCode, is_active: false },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({ code: 'VERGER10' });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.error).toBe("Ce code promo n'est plus actif");
    });
  });

  describe('Validation - Expiration', () => {
    it('should reject expired promo code', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                expires_at: pastDate.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({ code: 'VERGER10' });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.error).toBe('Ce code promo a expiré');
    });

    it('should accept promo code with future expiration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                expires_at: futureDate.toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({
        code: 'VERGER10',
        orderTotal: 50,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(true);
    });
  });

  describe('Validation - Max Uses', () => {
    it('should reject promo code that reached max uses', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                max_uses: 10,
                current_uses: 10,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({ code: 'VERGER10' });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.error).toBe("Ce code promo a atteint sa limite d'utilisation");
    });

    it('should accept promo code with remaining uses', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                max_uses: 10,
                current_uses: 5,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({
        code: 'VERGER10',
        orderTotal: 50,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(true);
    });
  });

  describe('Validation - Minimum Order Amount', () => {
    it('should reject when order total is below minimum', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                min_order_amount: 50,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({
        code: 'VERGER10',
        orderTotal: 30,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.error).toBe('Montant minimum requis: 50.00€');
    });

    it('should accept when order total meets minimum', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                ...activePromoCode,
                min_order_amount: 50,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = createMockRequest({
        code: 'VERGER10',
        orderTotal: 60,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(true);
    });
  });

  describe('Validation - Customer Already Used', () => {
    it('should reject when customer already used the code', async () => {
      // First call: get promo code
      // Second call: check promo_code_uses
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'promo_codes') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: activePromoCode,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'promo_code_uses') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({
                    data: { id: 'use-1' }, // Already used
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return { select: mockSelect };
      });

      const request = createMockRequest({
        code: 'VERGER10',
        orderTotal: 50,
        customerEmail: 'test@example.com',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.valid).toBe(false);
      expect(json.error).toBe('Vous avez déjà utilisé ce code promo');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on server error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createMockRequest({ code: 'VERGER10' });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.valid).toBe(false);
      expect(json.error).toBe('Erreur serveur');
    });
  });
});
