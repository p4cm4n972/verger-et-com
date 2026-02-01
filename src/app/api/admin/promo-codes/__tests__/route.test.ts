import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock verifyToken
vi.mock('../../auth/route', () => ({
  verifyToken: vi.fn((token: string) => token === 'valid-token'),
}));

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { GET, POST, PATCH, DELETE } from '../route';
import { verifyToken } from '../../auth/route';

// Sample promo code data
const samplePromoCode = {
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
  created_at: '2026-01-01T00:00:00.000Z',
};

// Helper to create mock GET request
function createMockGetRequest(token?: string): NextRequest {
  return {
    headers: {
      get: (name: string) => name === 'authorization' ? (token ? `Bearer ${token}` : null) : null,
    },
  } as unknown as NextRequest;
}

// Helper to create mock POST/PATCH request
function createMockBodyRequest(body: object, token?: string): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: {
      get: (name: string) => name === 'authorization' ? (token ? `Bearer ${token}` : null) : null,
    },
  } as unknown as NextRequest;
}

// Helper to create mock DELETE request
function createMockDeleteRequest(id: string | null, token?: string): NextRequest {
  const url = id
    ? `https://example.com/api/admin/promo-codes?id=${id}`
    : 'https://example.com/api/admin/promo-codes';

  return {
    url,
    headers: {
      get: (name: string) => name === 'authorization' ? (token ? `Bearer ${token}` : null) : null,
    },
  } as unknown as NextRequest;
}

describe('Admin Promo Codes API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for from().select().order()
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [samplePromoCode],
          error: null,
        }),
      }),
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    // Default mock for insert
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: samplePromoCode,
          error: null,
        }),
      }),
    });

    // Default mock for update
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    // Default mock for delete
    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  describe('Authentication', () => {
    it('GET should return 401 without token', async () => {
      const request = createMockGetRequest();

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
    });

    it('GET should return 401 with invalid token', async () => {
      const request = createMockGetRequest('invalid-token');

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
      expect(verifyToken).toHaveBeenCalledWith('invalid-token');
    });

    it('POST should return 401 without token', async () => {
      const request = createMockBodyRequest({
        discount_type: 'percentage',
        discount_value: 10,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
    });

    it('PATCH should return 401 without token', async () => {
      const request = createMockBodyRequest({ id: 'promo-1', is_active: false });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
    });

    it('DELETE should return 401 without token', async () => {
      const request = createMockDeleteRequest('promo-1');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
    });
  });

  describe('GET - List Promo Codes', () => {
    it('should return list of promo codes with valid token', async () => {
      const request = createMockGetRequest('valid-token');

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.promoCodes).toHaveLength(1);
      expect(json.promoCodes[0].code).toBe('VERGER10');
    });

    it('should return empty array when no promo codes', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const request = createMockGetRequest('valid-token');

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.promoCodes).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      const request = createMockGetRequest('valid-token');

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Erreur serveur');
    });
  });

  describe('POST - Create Promo Code', () => {
    it('should create promo code with percentage discount', async () => {
      const request = createMockBodyRequest(
        {
          discount_type: 'percentage',
          discount_value: 15,
          description: 'Test promo',
        },
        'valid-token'
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.promoCode).toBeDefined();
    });

    it('should create promo code with custom code', async () => {
      const request = createMockBodyRequest(
        {
          code: 'CUSTOM20',
          discount_type: 'fixed',
          discount_value: 20,
        },
        'valid-token'
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should return 400 for invalid discount type', async () => {
      const request = createMockBodyRequest(
        {
          discount_type: 'invalid',
          discount_value: 10,
        },
        'valid-token'
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Type de réduction invalide');
    });

    it('should return 400 for invalid discount value', async () => {
      const request = createMockBodyRequest(
        {
          discount_type: 'percentage',
          discount_value: 0,
        },
        'valid-token'
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Valeur de réduction invalide');
    });

    it('should return 400 for percentage over 100', async () => {
      const request = createMockBodyRequest(
        {
          discount_type: 'percentage',
          discount_value: 150,
        },
        'valid-token'
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Le pourcentage ne peut pas dépasser 100%');
    });

    it('should return 400 for duplicate code', async () => {
      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505' },
            }),
          }),
        }),
      });

      const request = createMockBodyRequest(
        {
          code: 'EXISTING',
          discount_type: 'percentage',
          discount_value: 10,
        },
        'valid-token'
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Ce code existe déjà');
    });
  });

  describe('PATCH - Toggle Promo Code Status', () => {
    it('should deactivate promo code successfully', async () => {
      const request = createMockBodyRequest(
        { id: 'promo-1', is_active: false },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Code désactivé');
    });

    it('should activate promo code successfully', async () => {
      const request = createMockBodyRequest(
        { id: 'promo-1', is_active: true },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Code activé');
    });

    it('should return 400 when id is missing', async () => {
      const request = createMockBodyRequest(
        { is_active: false },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('ID requis');
    });
  });

  describe('DELETE - Remove Promo Code', () => {
    it('should delete promo code successfully', async () => {
      const request = createMockDeleteRequest('promo-1', 'valid-token');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Code supprimé');
    });

    it('should return 400 when id is missing', async () => {
      const request = createMockDeleteRequest(null, 'valid-token');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('ID requis');
    });

    it('should return 500 on database error', async () => {
      mockFrom.mockReturnValue({
        delete: mockDelete.mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        }),
      });

      const request = createMockDeleteRequest('promo-1', 'valid-token');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Erreur serveur');
    });
  });
});
