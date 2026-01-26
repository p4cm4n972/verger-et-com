import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateNextDeliveryFromCurrent,
  getPriceIdFromFrequency,
  isRenewalInvoice,
  parseSubscriptionItems,
  daysBetween,
} from '../subscription-utils';

describe('calculateNextDeliveryFromCurrent', () => {
  describe('weekly frequency', () => {
    it('should add 7 days for weekly subscription', () => {
      const result = calculateNextDeliveryFromCurrent('2026-01-26', 'weekly');
      expect(result).toBe('2026-02-02');
    });

    it('should handle month boundary correctly', () => {
      const result = calculateNextDeliveryFromCurrent('2026-01-31', 'weekly');
      expect(result).toBe('2026-02-07');
    });

    it('should handle year boundary correctly', () => {
      const result = calculateNextDeliveryFromCurrent('2025-12-28', 'weekly');
      expect(result).toBe('2026-01-04');
    });
  });

  describe('biweekly frequency', () => {
    it('should add 14 days for biweekly subscription', () => {
      const result = calculateNextDeliveryFromCurrent('2026-01-26', 'biweekly');
      expect(result).toBe('2026-02-09');
    });

    it('should handle month boundary correctly', () => {
      const result = calculateNextDeliveryFromCurrent('2026-01-20', 'biweekly');
      expect(result).toBe('2026-02-03');
    });
  });

  describe('monthly frequency', () => {
    it('should add 1 month for monthly subscription', () => {
      const result = calculateNextDeliveryFromCurrent('2026-01-15', 'monthly');
      expect(result).toBe('2026-02-15');
    });

    it('should handle February correctly (31 -> 28/29)', () => {
      const result = calculateNextDeliveryFromCurrent('2026-01-31', 'monthly');
      // JavaScript Date handles this by rolling over to March 3rd (28 days in Feb 2026)
      expect(result).toBe('2026-03-03');
    });

    it('should handle year boundary correctly', () => {
      const result = calculateNextDeliveryFromCurrent('2025-12-15', 'monthly');
      expect(result).toBe('2026-01-15');
    });

    it('should handle leap year February correctly', () => {
      const result = calculateNextDeliveryFromCurrent('2024-01-29', 'monthly');
      // 2024 is a leap year, so Feb has 29 days
      expect(result).toBe('2024-02-29');
    });
  });
});

describe('getPriceIdFromFrequency', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_PRICE_WEEKLY', 'price_weekly_test');
    vi.stubEnv('STRIPE_PRICE_BIWEEKLY', 'price_biweekly_test');
    vi.stubEnv('STRIPE_PRICE_MONTHLY', 'price_monthly_test');
  });

  it('should return weekly price ID', () => {
    const result = getPriceIdFromFrequency('weekly');
    expect(result).toBe('price_weekly_test');
  });

  it('should return biweekly price ID', () => {
    const result = getPriceIdFromFrequency('biweekly');
    expect(result).toBe('price_biweekly_test');
  });

  it('should return monthly price ID', () => {
    const result = getPriceIdFromFrequency('monthly');
    expect(result).toBe('price_monthly_test');
  });

  it('should return null for missing env variable', () => {
    vi.stubEnv('STRIPE_PRICE_WEEKLY', '');
    const result = getPriceIdFromFrequency('weekly');
    expect(result).toBeNull();
  });
});

describe('isRenewalInvoice', () => {
  it('should return true for subscription_cycle', () => {
    expect(isRenewalInvoice('subscription_cycle')).toBe(true);
  });

  it('should return false for subscription_create', () => {
    expect(isRenewalInvoice('subscription_create')).toBe(false);
  });

  it('should return false for manual', () => {
    expect(isRenewalInvoice('manual')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isRenewalInvoice(null)).toBe(false);
  });
});

describe('parseSubscriptionItems', () => {
  it('should parse valid JSON items', () => {
    const itemsJson = JSON.stringify([
      { productId: 'basket-5kg', quantity: 1 },
      { productId: 'juice-orange', quantity: 2 },
    ]);
    
    const result = parseSubscriptionItems(itemsJson);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ productId: 'basket-5kg', quantity: 1 });
    expect(result[1]).toEqual({ productId: 'juice-orange', quantity: 2 });
  });

  it('should return empty array for undefined', () => {
    const result = parseSubscriptionItems(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid JSON', () => {
    const result = parseSubscriptionItems('not valid json');
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const result = parseSubscriptionItems('');
    expect(result).toEqual([]);
  });
});

describe('daysBetween', () => {
  it('should calculate days between two dates', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-08');
    
    expect(daysBetween(start, end)).toBe(7);
  });

  it('should return 0 for same date', () => {
    const date = new Date('2026-01-15');
    
    expect(daysBetween(date, date)).toBe(0);
  });

  it('should handle dates in reverse order', () => {
    const start = new Date('2026-01-08');
    const end = new Date('2026-01-01');
    
    expect(daysBetween(start, end)).toBe(7);
  });

  it('should calculate days across months', () => {
    const start = new Date('2026-01-28');
    const end = new Date('2026-02-04');
    
    expect(daysBetween(start, end)).toBe(7);
  });
});
