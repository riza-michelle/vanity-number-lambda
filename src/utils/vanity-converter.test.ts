import { describe, expect, it, vi } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => {
  const fixture = JSON.stringify({
    maxLen: 7,
    entries: [
      ['3569377', [{ word: 'flowers', score: 343 }]],
      ['356937', [{ word: 'flower', score: 230 }]],
      ['9377', [{ word: 'wess', score: 95 }]],
      ['356', [{ word: 'elm', score: 80 }]],
      ['937', [{ word: 'yes', score: 60 }]],
    ],
  });
  return { mockReadFileSync: vi.fn().mockReturnValue(fixture) };
});

vi.mock('fs', () => ({ readFileSync: mockReadFileSync }));

const { convertToVanity } = await import('./vanity-converter');

describe('convertToVanity', () => {
  describe('scoring and ordering', () => {
    it('returns FLOWERS as top result for 1-800-356-9377', () => {
      const [first] = convertToVanity('+18003569377', { top: 5 });
      expect(first.display).toContain('FLOWERS');
    });

    it('results are sorted by score descending', () => {
      const results = convertToVanity('+18003569377', { top: 5 });
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
    });

    it('every result contains at least one word segment', () => {
      const results = convertToVanity('+18003569377', { top: 5 });
      for (const r of results) {
        expect(r.spelled.length).toBeGreaterThan(0);
      }
    });

    it('each result has display, spelled[], and score', () => {
      const [first] = convertToVanity('+18003569377', { top: 1 });
      expect(first).toMatchObject({
        display: expect.any(String),
        spelled: expect.any(Array),
        score: expect.any(Number),
      });
    });
  });

  describe('top limit', () => {
    it('respects top: 1', () => {
      expect(convertToVanity('+18003569377', { top: 1 })).toHaveLength(1);
    });

    it('returns at most top: 3 results', () => {
      const results = convertToVanity('+18003569377', { top: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('defaults to top 10', () => {
      const results = convertToVanity('+18003569377');
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('phone number formats', () => {
    it('handles E.164 format (+18003569377)', () => {
      const results = convertToVanity('+18003569377');
      expect(results.length).toBeGreaterThan(0);
    });

    it('handles formatted string (1-800-356-9377)', () => {
      const results = convertToVanity('1-800-356-9377');
      expect(results.length).toBeGreaterThan(0);
    });

    it('handles 10-digit string without country code', () => {
      const results = convertToVanity('8003569377');
      expect(results.length).toBeGreaterThan(0);
    });

    it('display starts with country and area code for E.164', () => {
      const [first] = convertToVanity('+18003569377', { top: 1 });
      expect(first.display).toBe('1-800-FLOWERS');
    });
  });

  describe('edge cases', () => {
    it('throws for a non-numeric string that cannot be parsed', () => {
      expect(() => convertToVanity('not-a-number')).toThrow();
    });

    it('returns empty array when no words can be found', () => {
      const results = convertToVanity('0000000');
      expect(results).toEqual([]);
    });
  });

  describe('index loading', () => {
    it('does not re-read the file once the index is cached', () => {
      vi.clearAllMocks();
      convertToVanity('+18003569377', { top: 1 });
      convertToVanity('+18003569377', { top: 1 });
      expect(mockReadFileSync).not.toHaveBeenCalled();
    });
  });
});
