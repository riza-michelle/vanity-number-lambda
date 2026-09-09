import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { IVanityNumberService } from '../services/vanity-number-service';
import type { ILogger } from '../types/logger';
import type { CallerRecord, VanityResult } from '../types/models';
import { VanityNumberController } from './vanity-number-controller';

const SAMPLE_CALLERS: CallerRecord[] = [
  {
    phoneNumber: '+18003569377',
    topVanityNumbers: [{ display: '1-800-FLOWERS', spelled: ['FLOWERS'], score: 343 }] as VanityResult[],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    phoneNumber: '+18005550100',
    topVanityNumbers: [{ display: '1-800-555-ALLO', spelled: ['ALLO'], score: 120 }] as VanityResult[],
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('VanityNumberController', () => {
  let mockGetRecentCallers: Mock;
  let mockSvc: IVanityNumberService;
  let mockLogger: ILogger;
  let controller: VanityNumberController;

  beforeEach(() => {
    mockGetRecentCallers = vi.fn().mockResolvedValue(SAMPLE_CALLERS);
    mockSvc = {
      convert: vi.fn(),
      processAndSave: vi.fn(),
      findByPhone: vi.fn(),
      getRecentCallers: mockGetRecentCallers,
    };
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
    controller = new VanityNumberController(mockSvc, mockLogger);
  });

  describe('getRecent', () => {
    it('calls getRecentCallers with the given limit', async () => {
      await controller.getRecent(10);
      expect(mockGetRecentCallers).toHaveBeenCalledWith(10);
    });

    it('returns callers and count', async () => {
      const result = await controller.getRecent(5);
      expect(result.callers).toBe(SAMPLE_CALLERS);
      expect(result.count).toBe(2);
    });

    it('returns count 0 when no callers exist', async () => {
      mockGetRecentCallers.mockResolvedValueOnce([]);
      const result = await controller.getRecent(5);
      expect(result.callers).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('logs info before fetching', async () => {
      await controller.getRecent(7);
      expect(mockLogger.info).toHaveBeenCalledWith('Fetching recent callers', { limit: 7 });
    });

    it('propagates service errors', async () => {
      mockGetRecentCallers.mockRejectedValueOnce(new Error('DynamoDB down'));
      await expect(controller.getRecent(5)).rejects.toThrow('DynamoDB down');
    });
  });
});
