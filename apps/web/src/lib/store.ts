import { useSyncExternalStore } from "react";
import type { Sched } from "./srs";

// Progress lives on the device only (localStorage): no account, no server. It can be saved to a
// file and loaded back on the Progress screen.

export interface Settings {
  /** Russian translation of a question: shown on tap, or always. */
  ru: "tap" | "always";
  haptics: boolean;
  newQuestions: number;
  newWords: number;
}

export interface ExamResult {
  at: number;
  score: number;
  right: number;
  total: number;
}

export interface Progress {
  q: Record<string, Sched>;
  w: Record<string, Sched>;
  /** Answers per local day, "2026-11-13": 12. */
  days: Record<string, number>;
  /** New cards introduced today, so the daily limit holds across sessions. */
  fresh: { day: string; q: number; w: number };
  exams: ExamResult[];
  settings: Settings;
  installHiddenAt?: number;
  /** Words to hand over to KQuiz (lib/kquiz.ts): waiting to be copied, and already sent. */
  kquiz: { list: string[]; sent: string[] };
}

export const KEY = "koroad-learn:v1";
const DEFAULTS: Settings = { ru: "tap", haptics: true, newQuestions: 15, newWords: 10 };

export function localDay(t = Date.now()): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function normalize(raw: unknown, now = Date.now()): Progress {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<Progress>;
  const day = localDay(now);
  return {
    q: p.q ?? {},
    w: p.w ?? {},
    days: p.days ?? {},
    fresh: p.fresh?.day === day ? p.fresh : { day, q: 0, w: 0 },
    exams: p.exams ?? [],
    settings: { ...DEFAULTS, ...p.settings },
    // Before the list existed, the words already studied here are the ones to send first.
    kquiz: p.kquiz ?? { list: Object.keys(p.w ?? {}), sent: [] },
    ...(p.installHiddenAt ? { installHiddenAt: p.installHiddenAt } : {}),
  };
}

function read(): Progress {
  try {
    return normalize(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return normalize(null);
  }
}

let state = read();
const listeners = new Set<() => void>();

export function getProgress(): Progress {
  return state;
}

export function update(fn: (p: Progress) => Progress | void) {
  const draft = structuredClone(state);
  if (draft.fresh.day !== localDay()) draft.fresh = { day: localDay(), q: 0, w: 0 };
  state = fn(draft) ?? draft;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): progress stays in memory for this visit.
  }
  listeners.forEach((l) => l());
}

export function replaceProgress(raw: unknown) {
  update(() => normalize(raw));
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

/** Days in a row with at least one answer, counting today only once something is done today. */
export function streak(days: Record<string, number>, now = Date.now()): number {
  let t = now;
  if (!days[localDay(t)]) t -= 86_400_000;
  let n = 0;
  while (days[localDay(t)]) {
    n++;
    t -= 86_400_000;
  }
  return n;
}
