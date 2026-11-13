import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";

// FSRS (ts-fsrs) with 90 % target retention, as Anki does by default. Cards are stored as plain
// JSON with numeric dates, so they survive localStorage.

export interface Sched {
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: number;
  /** Times answered wrong, for the mistakes list. Not part of FSRS. */
  wrong?: number;
}

const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true, maximum_interval: 365 }));

export { Rating };
export type { Grade };

function toCard(s: Sched): Card {
  return { ...s, due: new Date(s.due), last_review: s.last_review ? new Date(s.last_review) : undefined };
}
function fromCard(c: Card, wrong?: number): Sched {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review?.getTime(),
    ...(wrong ? { wrong } : {}),
  };
}

export function review(s: Sched | undefined, grade: Grade, now = Date.now()): Sched {
  const card = s ? toCard(s) : createEmptyCard(new Date(now));
  const next = f.next(card, new Date(now), grade).card;
  return fromCard(next, (s?.wrong ?? 0) + (grade === Rating.Again ? 1 : 0));
}

/** When each grade would bring the card back: shown under the rating buttons. */
export function previewDue(s: Sched | undefined, now = Date.now()): Record<Grade, number> {
  const card = s ? toCard(s) : createEmptyCard(new Date(now));
  const r = f.repeat(card, new Date(now));
  return {
    [Rating.Again]: r[Rating.Again].card.due.getTime(),
    [Rating.Hard]: r[Rating.Hard].card.due.getTime(),
    [Rating.Good]: r[Rating.Good].card.due.getTime(),
    [Rating.Easy]: r[Rating.Easy].card.due.getTime(),
  } as Record<Grade, number>;
}

/** Multiple choice is graded by the app: wrong is Again, right but slow is Hard, otherwise Good. */
export function autoGrade(right: boolean, ms: number, slowMs: number): Grade {
  if (!right) return Rating.Again;
  return ms > slowMs ? Rating.Hard : Rating.Good;
}

export const isDue = (s: Sched | undefined, now = Date.now()) => !!s && s.due <= now;
/** 0 new, 1 learning, 2 young (< 21 days), 3 mature. */
export function level(s: Sched | undefined): 0 | 1 | 2 | 3 {
  if (!s) return 0;
  if (s.state === State.Learning || s.state === State.Relearning || s.state === State.New) return 1;
  return s.scheduled_days >= 21 ? 3 : 2;
}

export function formatIn(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${Math.max(1, min)} мин`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} дн`;
  const m = Math.round(d / 30);
  return m < 12 ? `${m} мес` : `${Math.round(d / 365)} г`;
}
