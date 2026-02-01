import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set env variables before imports
vi.hoisted(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
});

import {
  sendTelegramMessage,
  sendNewOrderNotificationToDrivers,
  editMessageForOrderTaken,
  sendOrderAcceptedConfirmation,
} from '../index';

describe('Telegram Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ok: true, result: { message_id: 12345 } }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendTelegramMessage', () => {
    it('should send a message to Telegram API', async () => {
      const result = await sendTelegramMessage({
        chat_id: '123456789',
        text: 'Test message',
        parse_mode: 'HTML',
      });

      expect(result.ok).toBe(true);
      expect(result.result?.message_id).toBe(12345);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('123456789'),
        })
      );
    });

    it('should return ok: false when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error_code: 400 }),
      });

      const result = await sendTelegramMessage({
        chat_id: '123456789',
        text: 'Test message',
      });

      expect(result.ok).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendTelegramMessage({
        chat_id: '123456789',
        text: 'Test message',
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('sendNewOrderNotificationToDrivers', () => {
    const sampleOrderData = {
      orderId: 'order-12345678-abcd-efgh',
      customerEmail: 'customer@example.com',
      customerPhone: '0612345678',
      total: 45,
      deliveryDate: '2026-02-03',
      deliveryDay: 'monday' as const,
      deliveryAddress: '123 Rue Test, 75001 Paris',
      items: [
        { name: 'Panier Découverte', quantity: 1 },
        { name: 'Jus Orange', quantity: 2 },
      ],
    };

    it('should send notifications to multiple drivers', async () => {
      const driverChatIds = ['111', '222', '333'];

      const results = await sendNewOrderNotificationToDrivers(driverChatIds, sampleOrderData);

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return message_id for each successful notification', async () => {
      // Different message_id for each call
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ ok: true, result: { message_id: 100 } }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ ok: true, result: { message_id: 200 } }),
        });

      const driverChatIds = ['111', '222'];
      const results = await sendNewOrderNotificationToDrivers(driverChatIds, sampleOrderData);

      expect(results[0]).toEqual({ chatId: '111', messageId: 100, success: true });
      expect(results[1]).toEqual({ chatId: '222', messageId: 200, success: true });
    });

    it('should handle partial failures', async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ ok: true, result: { message_id: 100 } }),
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ ok: false }),
        });

      const driverChatIds = ['111', '222'];
      const results = await sendNewOrderNotificationToDrivers(driverChatIds, sampleOrderData);

      expect(results[0]).toEqual({ chatId: '111', messageId: 100, success: true });
      expect(results[1]).toEqual({ chatId: '222', messageId: null, success: false });
    });

    it('should include order details in message', async () => {
      const driverChatIds = ['111'];
      await sendNewOrderNotificationToDrivers(driverChatIds, sampleOrderData);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.text).toContain('order-12');
      expect(callBody.text).toContain('Panier Découverte');
      expect(callBody.text).toContain('45€');
      expect(callBody.text).toContain('Lundi');
    });

    it('should include accept/refuse buttons', async () => {
      const driverChatIds = ['111'];
      await sendNewOrderNotificationToDrivers(driverChatIds, sampleOrderData);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.reply_markup).toBeDefined();
      expect(callBody.reply_markup.inline_keyboard).toHaveLength(1);
      expect(callBody.reply_markup.inline_keyboard[0]).toHaveLength(2);
      expect(callBody.reply_markup.inline_keyboard[0][0].text).toBe('✅ Accepter');
      expect(callBody.reply_markup.inline_keyboard[0][1].text).toBe('❌ Refuser');
    });
  });

  describe('editMessageForOrderTaken', () => {
    it('should edit message to indicate order was taken', async () => {
      const result = await editMessageForOrderTaken(
        '123456789',
        12345,
        'order-abcd1234',
        'Jean Dupont'
      );

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/editMessageText',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should include driver name in edited message', async () => {
      await editMessageForOrderTaken('123456789', 12345, 'order-abcd1234', 'Jean Dupont');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.text).toContain('Jean Dupont');
      expect(callBody.text).toContain('COMMANDE DÉJÀ PRISE');
      expect(callBody.text).toContain('order-ab');
    });

    it('should remove buttons from edited message', async () => {
      await editMessageForOrderTaken('123456789', 12345, 'order-abcd1234', 'Jean Dupont');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      // reply_markup should be undefined (no buttons)
      expect(callBody.reply_markup).toBeUndefined();
    });

    it('should return false when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ ok: false, error_code: 400 }),
      });

      const result = await editMessageForOrderTaken(
        '123456789',
        12345,
        'order-abcd1234',
        'Jean Dupont'
      );

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await editMessageForOrderTaken(
        '123456789',
        12345,
        'order-abcd1234',
        'Jean Dupont'
      );

      expect(result).toBe(false);
    });
  });

  describe('sendOrderAcceptedConfirmation', () => {
    it('should send confirmation message with delivery button', async () => {
      await sendOrderAcceptedConfirmation('123456789', 'order-abcd1234', '2026-02-03');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.text).toContain('Commande acceptée');
      expect(callBody.reply_markup.inline_keyboard[0][0].text).toBe('📦 Valider la livraison');
    });
  });
});

describe('Telegram Module - No Token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Temporarily remove the token
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  afterEach(() => {
    // Restore the token
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
  });

  it('sendTelegramMessage should return ok: false without token', async () => {
    // Re-import to get fresh module without token
    vi.resetModules();
    const { sendTelegramMessage: sendMessageNoToken } = await import('../index');

    const result = await sendMessageNoToken({
      chat_id: '123456789',
      text: 'Test message',
    });

    expect(result.ok).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('editMessageForOrderTaken should return false without token', async () => {
    vi.resetModules();
    const { editMessageForOrderTaken: editMessageNoToken } = await import('../index');

    const result = await editMessageNoToken('123456789', 12345, 'order-abcd', 'Jean');

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
