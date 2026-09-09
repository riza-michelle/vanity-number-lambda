declare module 'popular-english-words' {
  interface Words {
    getAll(): string[];
    getMostPopular(n: number): string[];
    getWordRank(word: string): number;
    getWordCount(): number;
  }
  export const words: Words;
}
