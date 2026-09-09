import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { words } from 'popular-english-words';

const KEYPAD: Record<string, string> = {
  a: '2', b: '2', c: '2',
  d: '3', e: '3', f: '3',
  g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5',
  m: '6', n: '6', o: '6',
  p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8',
  w: '9', x: '9', y: '9', z: '9',
};

function toDigits(word: string): string | null {
  let out = '';
  for (const ch of word) {
    const d = KEYPAD[ch];
    if (!d) return null;
    out += d;
  }
  return out;
}

const MIN_WORD = 3;
const MAX_WORD = 15;
const TOP_PER_KEY = 8;

const totalWords = words.getWordCount();
const allWords = words.getAll();

const map = new Map<string, { word: string; score: number }[]>();
let maxLen = 0;

for (const raw of allWords) {
  const word = raw.trim().toLowerCase();
  if (word.length < MIN_WORD || word.length > MAX_WORD) continue;

  const key = toDigits(word);
  if (!key) continue;

  const rank = words.getWordRank(word);
  // rank 0 = most popular; -1 = not found in popularity list
  const popularityFactor = rank === -1 ? 0.01 : (totalWords - rank) / totalWords;
  const score = Math.round(popularityFactor * word.length ** 2 * 1000);

  if (!map.has(key)) map.set(key, []);
  map.get(key)!.push({ word, score });
  if (key.length > maxLen) maxLen = key.length;
}

for (const [key, list] of map) {
  list.sort((a, b) => b.score - a.score);
  if (list.length > TOP_PER_KEY) map.set(key, list.slice(0, TOP_PER_KEY));
}

const output = { maxLen, entries: [...map.entries()] };

const outDir = resolve(process.cwd(), 'layers/vanity-index');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'vanity-index.json'), JSON.stringify(output));

console.log(`Built index: ${map.size} digit sequences, maxLen=${maxLen}, words processed=${allWords.length}`);
