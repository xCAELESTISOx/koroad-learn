import questionsJson from "../data/questions.json";
import vocabJson from "../data/vocab.json";
import metaJson from "../data/meta.json";
import { buildLexicon } from "./korean";
import type { Meta, Question, Word } from "./types";

// The whole bank ships inside the bundle: it is small (text only, pictures load from /img), and
// being part of the build means the service worker caches it with the app, so it works offline.

export const QUESTIONS = questionsJson as unknown as Question[];
export const WORDS = vocabJson as unknown as Word[];
export const META = metaJson as unknown as Meta;

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
export const WORD_BY_ID = new Map(WORDS.map((w) => [w.id, w]));
export const QUESTION_IDS = QUESTIONS.map((q) => q.id);
/** Words in learning order: the ones that appear in the most questions first. */
export const WORD_IDS = WORDS.slice()
  .sort((a, b) => (b.n ?? b.qs.length) - (a.n ?? a.qs.length))
  .map((w) => w.id);
export const LEXICON = buildLexicon(WORDS);
