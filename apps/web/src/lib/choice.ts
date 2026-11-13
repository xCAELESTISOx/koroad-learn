import { shuffle } from "./queue";
import type { Word } from "./types";

/**
 * Three wrong options for a word quiz: same part of speech, and preferably words that occur in
 * the same questions (the confusable ones), never a word with the same translation.
 */
export function distractors(word: Word, all: Word[], random = Math.random): Word[] {
  const pool = all.filter((w) => w.id !== word.id && w.ru !== word.ru && w.ko !== word.ko);
  const samePos = pool.filter((w) => w.pos === word.pos);
  const qs = new Set(word.qs);
  const near = samePos.filter((w) => w.qs.some((id) => qs.has(id)));
  const picked: Word[] = [];
  for (const group of [shuffle(near, random), shuffle(samePos, random), shuffle(pool, random)]) {
    for (const w of group) {
      if (picked.length === 3) return picked;
      if (!picked.includes(w)) picked.push(w);
    }
  }
  return picked;
}
