// Content types. The data is built by content/scripts/build.mjs from the official question bank
// (see docs/CONTENT.md); the app only reads it.

/** How a question is asked in the official bank. */
export type Kind = "text" | "sign" | "photo" | "illust" | "video";

export interface Localized {
  /** Question text. */
  q: string;
  /** Answer options, in the bank's order. */
  opts: string[];
  /** Situation notes printed next to a picture ("편도 2차로의 교차로"). */
  notes?: string[];
  /** Explanation (해설). */
  exp?: string;
}

export interface Question {
  /** Stable id, "q" + the bank number: "q0001". */
  id: string;
  /** Number in the official bank. */
  no: number;
  kind: Kind;
  /** Picture for sign, photo and illustration questions, relative to the app. */
  img?: string;
  /** Korean, verbatim from the bank. */
  ko: Localized;
  /** Russian translation, made and checked separately from the Korean. */
  ru: Localized;
  /** Indexes of the correct options (0-based). Two for 5지2답 / 4지2답 questions. */
  ans: number[];
  /** Where in the source document it is. */
  src: { page?: number };
  /** Set when the independent check found something to look at; the Korean text is authoritative. */
  flag?: string;
  /** About the source itself, e.g. two answers in the key though the question doesn't say "2가지". */
  srcNote?: string;
}

export interface Word {
  id: string;
  /** Dictionary form, Hangul. */
  ko: string;
  /** Russian meaning in the sense used by the exam. */
  ru: string;
  /** Revised romanization. */
  rr?: string;
  /** Hanja for Sino-Korean words. */
  hanja?: string;
  /** Part of speech: noun, verb, adj, adv, other. Distractors in quizzes share it. */
  pos?: string;
  /** Inflected forms exactly as they appear in the questions, used to find the word in a text. */
  forms: string[];
  /** Short usage note in Russian. */
  note?: string;
  /** How many questions of the bank use the word. */
  n?: number;
  /** Ids of questions the word appears in (up to 40). */
  qs: string[];
}

export interface ExamConfig {
  count: number;
  minutes: number;
  pass: number;
  /** How many questions of each kind an exam has. */
  mix: Partial<Record<Kind, number>>;
  /** Points per question; 2-answer text questions are worth more, hence the separate key. */
  points: Partial<Record<Kind | "text2", number>>;
  note?: string;
}

export interface Meta {
  version: string;
  source: {
    title: string;
    short: string;
    publisher: string;
    effective: string;
    url: string;
    method: string;
    flagged?: number;
    /** Questions left out (video questions need the video from the KoROAD site). */
    skipped?: string;
  };
  exam: ExamConfig;
  kinds: Record<Kind, string>;
}
