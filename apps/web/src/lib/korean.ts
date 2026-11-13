import type { Word } from "./types";

// Finding vocabulary inside a question so every known word can be tapped for its translation.
// The vocabulary lists each word's spellings as they occur in the bank (content/scripts/vocab.py),
// so a text is scanned for the longest known spelling at each position. Compounds the analyzer
// split (녹색등화 → 녹색 + 등화) are then still found piece by piece.

export type Lexicon = { forms: Map<string, string>; maxLen: number };

const HANGUL = /[가-힣]/;

export function buildLexicon(words: Pick<Word, "id" | "ko" | "forms">[]): Lexicon {
  const forms = new Map<string, string>();
  let maxLen = 1;
  for (const w of words) {
    // A verb's dictionary form (정지하다) rarely occurs as is; its spellings (정지하, 정지한) do.
    for (const form of [...w.forms, w.ko]) {
      if (form.length < 2 || !HANGUL.test(form) || forms.has(form)) continue;
      forms.set(form, w.id);
      maxLen = Math.max(maxLen, form.length);
    }
  }
  return { forms, maxLen };
}

export interface Piece {
  text: string;
  word?: string;
}

/** Splits a text into pieces, tagging the known words. Joining the texts gives the input back. */
export function segment(lex: Lexicon, text: string): Piece[] {
  const out: Piece[] = [];
  let plain = "";
  let i = 0;
  while (i < text.length) {
    let hit: string | undefined;
    let len = 0;
    if (HANGUL.test(text[i]!)) {
      for (let n = Math.min(lex.maxLen, text.length - i); n >= 2; n--) {
        const id = lex.forms.get(text.slice(i, i + n));
        if (id) {
          hit = id;
          len = n;
          break;
        }
      }
    }
    if (hit) {
      if (plain) out.push({ text: plain });
      plain = "";
      out.push({ text: text.slice(i, i + len), word: hit });
      i += len;
    } else {
      plain += text[i];
      i++;
    }
  }
  if (plain) out.push({ text: plain });
  return out;
}

/** Splits a text around the spellings of one word, for highlighting it in an example. */
export function highlight(text: string, word: Pick<Word, "ko" | "forms">): Piece[] {
  const lex = buildLexicon([{ id: "hit", ko: word.ko, forms: word.forms }]);
  return segment(lex, text);
}
