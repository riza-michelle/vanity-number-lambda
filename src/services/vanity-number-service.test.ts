import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { ICallerRecordRepository } from '../db/callers-repository';
import type { CallerRecord, VanityResult } from '../types/models';

const { mockConvertToVanity } = vi.hoisted(() => ({
  mockConvertToVanity: vi.fn(),
}));

vi.mock('../utils/vanity-converter', () => ({
  convertToVanity: mockConvertToVanity,
}));

const { VanityNumberService } = await import('./vanity-number-service');

const SAMPLE_RESULTS: VanityResult[] = [
  { display: '1-800-FLOWERS', spelled: ['FLOWERS'], score: 343 },
  { display: '1-800-FLOWER-7', spelled: ['FLOWER'], score: 230 },
  { display: '1-800-3-LOWERS', spelled: ['LOWERS'], score: 202 },
];

const SAMPLE_RECORD: CallerRecord = {
  phoneNumber: '+18003569377',
  topVanityNumbers: SAMPLE_RESULTS,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('VanityNumberService', () => {
  let mockRepo: ICallerRecordRepository;
  let mockSave: Mock;
  let mockFindByPhone: Mock;
  let mockFindRecent: Mock;
  let svc: InstanceType<typeof VanityNumberService>;

  beforeEach(() => {
    mockConvertToVanity.mockReturnValue(SAMPLE_RESULTS);
    mockSave = vi.fn().mockResolvedValue(undefined);
    mockFindByPhone = vi.fn().mockResolvedValue(SAMPLE_RECORD);
    mockFindRecent = vi.fn().mockResolvedValue([SAMPLE_RECORD]);

    mockRepo = {
      save: mockSave,
      findByPhone: mockFindByPhone,
      findRecent: mockFindRecent,
    };

    svc = new VanityNumberService(mockRepo);
  });

  describe('convert', () => {
    it('delegates to convertToVanity with phone and opts', () => {
      const opts = { top: 3 };
      const result = svc.convert('+18003569377', opts);
      expect(mockConvertToVanity).toHaveBeenCalledWith('+18003569377', opts);
      expect(result).toBe(SAMPLE_RESULTS);
    });

    it('passes undefined opts through', () => {
      svc.convert('+18003569377');
      expect(mockConvertToVanity).toHaveBeenCalledWith(
        '+18003569377',
        undefined,
      );
    });
  });

  describe('processAndSave', () => {
    it('generates results and saves them', async () => {
      await svc.processAndSave('+18003569377', { top: 5 });
      expect(mockConvertToVanity).toHaveBeenCalledWith('+18003569377', {
        top: 5,
      });
      expect(mockSave).toHaveBeenCalledWith('+18003569377', SAMPLE_RESULTS);
    });

    it('defaults top to 5 when opts is omitted', async () => {
      await svc.processAndSave('+18003569377');
      expect(mockConvertToVanity).toHaveBeenCalledWith('+18003569377', {
        top: 5,
      });
    });

    it('returns the generated results', async () => {
      const result = await svc.processAndSave('+18003569377', { top: 5 });
      expect(result).toBe(SAMPLE_RESULTS);
    });

    it('propagates repository save errors', async () => {
      mockSave.mockRejectedValueOnce(new Error('DynamoDB unavailable'));
      await expect(svc.processAndSave('+18003569377')).rejects.toThrow(
        'DynamoDB unavailable',
      );
    });
  });

  describe('findByPhone', () => {
    it('returns the caller record from the repository', async () => {
      const result = await svc.findByPhone('+18003569377');
      expect(mockFindByPhone).toHaveBeenCalledWith('+18003569377');
      expect(result).toBe(SAMPLE_RECORD);
    });

    it('returns null when no record exists', async () => {
      mockFindByPhone.mockResolvedValueOnce(null);
      const result = await svc.findByPhone('+10000000000');
      expect(result).toBeNull();
    });
  });

  describe('getRecentCallers', () => {
    it('delegates to repository.findRecent with the given limit', async () => {
      const result = await svc.getRecentCallers(10);
      expect(mockFindRecent).toHaveBeenCalledWith(10);
      expect(result).toEqual([SAMPLE_RECORD]);
    });

    it('returns an empty array when no callers exist', async () => {
      mockFindRecent.mockResolvedValueOnce([]);
      const result = await svc.getRecentCallers(5);
      expect(result).toEqual([]);
    });
  });
});
