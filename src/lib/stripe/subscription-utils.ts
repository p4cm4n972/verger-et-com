/**
 * Subscription utility functions
 * Extracted for testability
 */

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly';

/**
 * Calculate the next delivery date based on current date and frequency
 * @param currentDate - Current delivery date in ISO format (YYYY-MM-DD)
 * @param frequency - Subscription frequency
 * @returns Next delivery date in ISO format (YYYY-MM-DD)
 */
export function calculateNextDeliveryFromCurrent(
  currentDate: string,
  frequency: SubscriptionFrequency
): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Get Stripe Price ID from subscription frequency
 * @param frequency - Subscription frequency
 * @returns Stripe Price ID or null if not configured
 */
export function getPriceIdFromFrequency(frequency: SubscriptionFrequency): string | null {
  const priceMap: Record<SubscriptionFrequency, string | undefined> = {
    weekly: process.env.STRIPE_PRICE_WEEKLY,
    biweekly: process.env.STRIPE_PRICE_BIWEEKLY,
    monthly: process.env.STRIPE_PRICE_MONTHLY,
  };

  return priceMap[frequency] || null;
}

/**
 * Validate that a billing reason indicates a subscription renewal
 * @param billingReason - Stripe invoice billing_reason
 * @returns true if this is a renewal invoice
 */
export function isRenewalInvoice(billingReason: string | null): boolean {
  return billingReason === 'subscription_cycle';
}

/**
 * Parse items from subscription metadata
 * @param itemsJson - JSON string of items from metadata
 * @returns Parsed items array or empty array
 */
export function parseSubscriptionItems(
  itemsJson: string | undefined
): Array<{ productId: string; quantity: number; type?: string }> {
  if (!itemsJson) return [];

  try {
    return JSON.parse(itemsJson);
  } catch {
    console.error('Failed to parse subscription items:', itemsJson);
    return [];
  }
}

/**
 * Calculate days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
