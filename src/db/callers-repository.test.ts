import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VanityResult } from '../types/models';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class {},
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
  PutCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
}));

const { CallerRecordDDBRepository } = await import('./callers-repository');

const SAMPLE_RESULTS: VanityResult[] = [
  { display: '1-800-FLOWERS', spelled: ['FLOWERS'], score: 343 },
];

function capturedItem() {
  const cmd = mockSend.mock.calls[0][0] as {
    input: { TableName: string; Item: Record<string, unknown> };
  };
  return cmd.input.Item;
}

describe('CallerRecordDDBRepository', () => {
  let repo: InstanceType<typeof CallerRecordDDBRepository>;

  beforeEach(() => {
    mockSend.mockResolvedValue({});
    vi.clearAllMocks();
    repo = new CallerRecordDDBRepository();
  });

  describe('save — DynamoDB PutCommand', () => {
    it('calls send exactly once', async () => {
      await repo.save('+18003569377', SAMPLE_RESULTS);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('stores the phone number as the partition key', async () => {
      await repo.save('+18003569377', SAMPLE_RESULTS);
      expect(capturedItem().phoneNumber).toBe('+18003569377');
    });

    it('stores recordType for the GSI partition key', async () => {
      await repo.save('+18003569377', SAMPLE_RESULTS);
      expect(capturedItem().recordType).toBe('CALLER');
    });

    it('stores the full results array as topVanityNumbers', async () => {
      await repo.save('+18003569377', SAMPLE_RESULTS);
      expect(capturedItem().topVanityNumbers).toEqual(SAMPLE_RESULTS);
    });

    it('sets createdAt as a valid ISO 8601 string', async () => {
      await repo.save('+18003569377', SAMPLE_RESULTS);
      const createdAt = capturedItem().createdAt as string;
      expect(new Date(createdAt).toISOString()).toBe(createdAt);
    });
  });

  describe('save — error propagation', () => {
    it('rejects when DynamoDB send rejects', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB unavailable'));
      await expect(repo.save('+18003569377', SAMPLE_RESULTS)).rejects.toThrow(
        'DynamoDB unavailable',
      );
    });
  });
});
