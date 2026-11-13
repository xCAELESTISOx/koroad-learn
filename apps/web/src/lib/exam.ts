import { shuffle } from "./queue";
import type { ExamConfig, Question } from "./types";

// A mock exam drawn like the real one: so many questions of each kind, the real time limit and
// pass mark, no feedback until the end. Its state is saved on every answer so it survives the
// app being closed.

export interface ExamState {
  ids: string[];
  /** Option order per question, so going back shows the same layout. */
  order: Record<string, number[]>;
  answers: Record<string, number[]>;
  index: number;
  endsAt: number;
  done: boolean;
}

/** Options keep the bank's order for picture questions, whose texts refer to "①"; text options are shuffled. */
export function optionOrder(q: Question, random = Math.random): number[] {
  const idx = q.ko.opts.map((_, i) => i);
  return q.kind === "text" || q.kind === "sign" ? shuffle(idx, random) : idx;
}

export function drawExam(questions: Question[], cfg: ExamConfig, now = Date.now(), random = Math.random): ExamState {
  const ids: string[] = [];
  for (const [kind, n] of Object.entries(cfg.mix)) {
    const pool = questions.filter((q) => q.kind === kind);
    if (kind === "text") {
      // The real exam has a fixed share of two-answer text questions (worth more points).
      const twos = shuffle(pool.filter((q) => q.ans.length > 1), random).slice(0, cfg.points.text2 ? Math.min(TEXT2_COUNT, n ?? 0) : 0);
      ids.push(...twos.map((q) => q.id));
      ids.push(...shuffle(pool.filter((q) => q.ans.length === 1), random).slice(0, (n ?? 0) - twos.length).map((q) => q.id));
    } else {
      ids.push(...shuffle(pool, random).slice(0, n ?? 0).map((q) => q.id));
    }
  }
  const byId = new Map(questions.map((q) => [q.id, q]));
  const order = Object.fromEntries(ids.map((id) => [id, optionOrder(byId.get(id)!, random)]));
  return { ids, order, answers: {}, index: 0, endsAt: now + cfg.minutes * 60_000, done: false };
}

/** Two-answer text questions per exam (4지2답). */
export const TEXT2_COUNT = 4;

export const isRight = (q: Question, picked: number[] | undefined) =>
  !!picked && picked.length === q.ans.length && picked.every((k) => q.ans.includes(k));

export function points(q: Question, cfg: ExamConfig): number {
  if (q.kind === "text" && q.ans.length > 1) return cfg.points.text2 ?? cfg.points.text ?? 0;
  return cfg.points[q.kind] ?? 0;
}

export function score(state: ExamState, byId: Map<string, Question>, cfg: ExamConfig) {
  let total = 0,
    right = 0;
  const results = state.ids.map((id) => {
    const q = byId.get(id)!;
    const ok = isRight(q, state.answers[id]);
    if (ok) {
      total += points(q, cfg);
      right++;
    }
    return ok;
  });
  return { score: total, right, results, passed: total >= cfg.pass };
}

/** Toggles an option: single-answer questions replace the pick, two-answer ones hold at most two. */
export function pick(current: number[], option: number, need: number): number[] {
  if (need === 1) return [option];
  if (current.includes(option)) return current.filter((k) => k !== option);
  return current.length < need ? [...current, option] : current;
}
