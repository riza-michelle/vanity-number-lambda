import { readFileSync } from 'fs';
import { env } from '../config/env';
import type {
  ParsedNumber,
  VanityResult,
  WordEntry,
  WordIndex,
} from '../types/models';

interface Part {
  type: 'word' | 'digit';
  text: string;
}

interface Candidate {
  parts: Part[];
  score: number;
}

const MAX_WORDS_PER_SEGMENT = 30;

function segment(
  digits: string,
  index: WordIndex,
  { beam = MAX_WORDS_PER_SEGMENT } = {},
): Candidate[] {
  const n = digits.length;
  const best: Candidate[][] = new Array(n + 1);
  best[n] = [{ parts: [], score: 0 }];

  for (let i = n - 1; i >= 0; i--) {
    const cand: Candidate[] = [];
    const limit = Math.min(n, i + index.maxLen);

    for (let j = i + 3; j <= limit; j++) {
      const hits = index.map.get(digits.slice(i, j));
      if (!hits) continue;
      for (const { word, score } of hits) {
        for (const tail of best[j]) {
          cand.push({
            parts: [{ type: 'word', text: word.toUpperCase() }, ...tail.parts],
            score: score + tail.score,
          });
        }
      }
    }

    for (const tail of best[i + 1]) {
      cand.push({
        parts: [{ type: 'digit', text: digits[i] }, ...tail.parts],
        score: -1 + tail.score,
      });
    }

    cand.sort((a, b) => b.score - a.score);
    best[i] = cand.slice(0, beam);
  }

  return best[0];
}

function render(parts: Part[]): string {
  const merged: Part[] = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (p.type === 'digit' && last?.type === 'digit') last.text += p.text;
    else merged.push({ ...p });
  }
  return merged.map((p) => p.text).join('-');
}

function parseNumber(raw: string): ParsedNumber {
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') {
    return { country: '1', area: d.slice(1, 4), local: d.slice(4) };
  }
  if (d.length === 10) {
    return { country: '', area: d.slice(0, 3), local: d.slice(3) };
  }
  return { country: '', area: '', local: d };
}

let _index: WordIndex | null = null;

function getIndex(): WordIndex {
  if (_index) return _index;

  const path = env.VANITY_INDEX_PATH;
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as {
    maxLen: number;
    entries: [string, WordEntry[]][];
  };

  _index = { map: new Map(raw.entries), maxLen: raw.maxLen };
  return _index;
}

export function convertToVanity(
  phone: string,
  { top = 10, all = false }: { top?: number; all?: boolean } = {},
): VanityResult[] {
  const index = getIndex();
  const { country, area, local } = parseNumber(phone);
  if (!local) throw new Error(`Could not parse a phone number from "${phone}"`);

  const target = all ? area + local : local;
  const prefixParts = [country, all ? '' : area].filter(Boolean);

  return segment(target, index)
    .filter((r) => r.parts.some((p) => p.type === 'word'))
    .slice(0, top)
    .map((r) => ({
      display: [...prefixParts, render(r.parts)].join('-'),
      spelled: r.parts.filter((p) => p.type === 'word').map((p) => p.text),
      score: r.score,
    }));
}
