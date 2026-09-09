export interface WordEntry {
  word: string;
  score: number;
}

export interface WordIndex {
  map: Map<string, WordEntry[]>;
  maxLen: number;
}

export interface ParsedNumber {
  country: string;
  area: string;
  local: string;
}

export interface VanityResult {
  display: string;
  spelled: string[];
  score: number;
}

export interface CallerRecord {
  phoneNumber: string;
  topVanityNumbers: VanityResult[];
  createdAt: string;
}
