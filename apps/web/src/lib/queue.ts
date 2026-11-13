import { isDue, type Sched } from "./srs";

// What a study session goes through: due reviews first (most overdue first), then new cards up
// to the day's limit, never more than a session's worth (about 20 answers, 5–10 minutes).

export const SESSION_SIZE = 20;

export interface Counts {
  due: number;
  seen: number;
  learned: number;
  total: number;
  /** New cards still allowed today. */
  fresh: number;
}

export function counts(ids: string[], store: Record<string, Sched>, limit: number, usedToday: number, now = Date.now()): Counts {
  let due = 0,
    seen = 0,
    learned = 0;
  for (const id of ids) {
    const s = store[id];
    if (!s) continue;
    seen++;
    if (isDue(s, now)) due++;
    if (s.scheduled_days >= 21) learned++;
  }
  const fresh = Math.max(0, Math.min(limit - usedToday, ids.length - seen));
  return { due, seen, learned, total: ids.length, fresh };
}

export function buildQueue(
  ids: string[],
  store: Record<string, Sched>,
  limit: number,
  usedToday: number,
  now = Date.now(),
  size = SESSION_SIZE,
): string[] {
  const due = ids.filter((id) => isDue(store[id], now)).sort((a, b) => store[a]!.due - store[b]!.due);
  const fresh = ids.filter((id) => !store[id]).slice(0, Math.max(0, limit - usedToday));
  return [...due, ...fresh].slice(0, size);
}

/** Puts a missed card back a few places later, so it comes round again in the same session. */
export function requeue(queue: string[], index: number, id: string, gap = 5): string[] {
  const next = queue.slice();
  next.splice(Math.min(index + 1 + gap, next.length), 0, id);
  return next;
}

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
