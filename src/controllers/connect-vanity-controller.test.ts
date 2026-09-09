import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { IVanityNumberService } from '../services/vanity-number-service';
import type { VanityResult } from '../types/models';
import { ConnectVanityController } from './connect-vanity-controller';

const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

const MOCK_RESULTS: VanityResult[] = [
  { display: '1-800-FLOWERS', spelled: ['FLOWERS'], score: 343 },
  { display: '1-800-FLOWER-7', spelled: ['FLOWER'], score: 230 },
  { display: '1-800-3-LOWERS', spelled: ['LOWERS'], score: 202 },
  { display: '1-800-FLOOR-77', spelled: ['FLOOR'], score: 189 },
  { display: '1-800-35-MOWERS', spelled: ['MOWERS'], score: 175 },
];

describe('ConnectVanityController', () => {
  let mockProcessAndSave: Mock;
  let mockSvc: IVanityNumberService;
  let controller: ConnectVanityController;

  beforeEach(() => {
    mockProcessAndSave = vi.fn().mockResolvedValue(MOCK_RESULTS);
    mockSvc = {
      convert: vi.fn(),
      processAndSave: mockProcessAndSave,
      findByPhone: vi.fn(),
    } as unknown as IVanityNumberService;
    controller = new ConnectVanityController(mockSvc, mockLogger as never);
  });

  it('calls processAndSave with top: 5', async () => {
    await controller.process('+18003569377');
    expect(mockProcessAndSave).toHaveBeenCalledWith('+18003569377', { top: 5 });
  });

  it('returns status: success with top-3 vanity numbers', async () => {
    const res = await controller.process('+18003569377');
    expect(res.status).toBe('success');
    expect(res.vanityNumbers).toEqual([
      '1-800-FLOWERS',
      '1-800-FLOWER-7',
      '1-800-3-LOWERS',
    ]);
  });

  it('message lists all three vanity numbers in order', async () => {
    const res = await controller.process('+18003569377');
    expect(res.message).toBe(
      'Hello! Here are your top vanity numbers. Option 1: 1-800-FLOWERS. Option 2: 1-800-FLOWER-7. Option 3: 1-800-3-LOWERS. Thank you for calling.',
    );
  });

  it('returns status: no_results with the correct message when service returns empty array', async () => {
    mockProcessAndSave.mockResolvedValueOnce([]);
    const res = await controller.process('+18003569377');
    expect(res.status).toBe('no_results');
    expect(res.vanityNumbers).toEqual([]);
    expect(res.message).toBe(
      'We could not find vanity numbers for your phone number. Thank you for calling.',
    );
  });

  it('returns status: error with the correct message when service throws', async () => {
    mockProcessAndSave.mockRejectedValueOnce(new Error('db failure'));
    const res = await controller.process('+18003569377');
    expect(res.status).toBe('error');
    expect(res.vanityNumbers).toEqual([]);
    expect(res.message).toBe(
      'We encountered an error processing your request. Thank you for calling.',
    );
  });

  it('result always has all five keys', async () => {
    const res = await controller.process('+18003569377');
    expect(Object.keys(res).sort()).toEqual(
      ['message', 'status', 'vanityNumbers'].sort(),
    );
  });
});
