import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock verifyToken
vi.mock('../../auth/route', () => ({
  verifyToken: vi.fn((token: string) => token === 'valid-token'),
}));

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    })),
  })),
}));

import { GET, PATCH, DELETE } from '../route';
import { verifyToken } from '../../auth/route';

// Sample driver data
const sampleDriver = {
  id: 'driver-1',
  email: 'driver@example.com',
  name: 'Jean Livreur',
  phone: '+33612345678',
  telegram_chat_id: '123456789',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  drivers: [{
    telegram_username: '@jeanlivreur',
    available_monday: true,
    available_tuesday: true,
    max_deliveries_per_day: 10,
    current_zone: 'Paris 15e',
  }],
};

// Helper to create mock GET request
function createMockGetRequest(token?: string): NextRequest {
  return {
    headers: {
      get: (name: string) => name === 'authorization' ? (token ? `Bearer ${token}` : null) : null,
    },
  } as unknown as NextRequest;
}

// Helper to create mock PATCH request
function createMockPatchRequest(body: object, token?: string): NextRequest {
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
    ? `https://example.com/api/admin/drivers?id=${id}`
    : 'https://example.com/api/admin/drivers';

  return {
    url,
    headers: {
      get: (name: string) => name === 'authorization' ? (token ? `Bearer ${token}` : null) : null,
    },
  } as unknown as NextRequest;
}

describe('Admin Drivers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock chain for GET
    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockResolvedValue({
          data: [sampleDriver],
          error: null,
        }),
      }),
    });

    // Default mock chain for PATCH
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    // Default mock chain for DELETE
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
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

    it('PATCH should return 401 without token', async () => {
      const request = createMockPatchRequest({ id: 'driver-1', is_active: false });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
    });

    it('DELETE should return 401 without token', async () => {
      const request = createMockDeleteRequest('driver-1');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Non autorisé');
    });
  });

  describe('GET - List Drivers', () => {
    it('should return list of drivers with valid token', async () => {
      const request = createMockGetRequest('valid-token');

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.drivers).toHaveLength(1);
      expect(json.drivers[0]).toMatchObject({
        id: 'driver-1',
        email: 'driver@example.com',
        name: 'Jean Livreur',
        isActive: true,
        telegramUsername: '@jeanlivreur',
        currentZone: 'Paris 15e',
      });
    });

    it('should format driver data correctly', async () => {
      const request = createMockGetRequest('valid-token');

      const response = await GET(request);
      const json = await response.json();

      const driver = json.drivers[0];
      expect(driver.telegramChatId).toBe('123456789');
      expect(driver.availableMonday).toBe(true);
      expect(driver.availableTuesday).toBe(true);
    });

    it('should return empty array when no drivers', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const request = createMockGetRequest('valid-token');

      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.drivers).toHaveLength(0);
    });

    it('should return 500 on database error', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockResolvedValue({
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

  describe('PATCH - Suspend/Reactivate Driver', () => {
    it('should suspend driver successfully', async () => {
      const request = createMockPatchRequest(
        { id: 'driver-1', is_active: false },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Livreur suspendu');
    });

    it('should reactivate driver successfully', async () => {
      const request = createMockPatchRequest(
        { id: 'driver-1', is_active: true },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Livreur réactivé');
    });

    it('should return 400 when id is missing', async () => {
      const request = createMockPatchRequest(
        { is_active: false },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('ID requis');
    });

    it('should return 500 on database error', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
        }),
      });

      const request = createMockPatchRequest(
        { id: 'driver-1', is_active: false },
        'valid-token'
      );

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Erreur serveur');
    });
  });

  describe('DELETE - Remove Driver', () => {
    it('should delete driver successfully', async () => {
      const request = createMockDeleteRequest('driver-1', 'valid-token');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toBe('Livreur supprimé');
    });

    it('should return 400 when id is missing', async () => {
      const request = createMockDeleteRequest(null, 'valid-token');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('ID requis');
    });

    it('should return 500 on database error', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        }),
      });

      const request = createMockDeleteRequest('driver-1', 'valid-token');

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Erreur serveur');
    });
  });
});
