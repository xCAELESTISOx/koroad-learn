import { QUESTION_IDS, QUESTION_BY_ID } from "./data";
import { buildQueue, shuffle, SESSION_SIZE } from "./queue";
import type { Progress } from "./store";
import type { Kind } from "./types";

/** Which questions a study session goes through, from the route's parameter. */
export function questionQueue(param: string | undefined, p: Progress, now = Date.now()): string[] {
  if (!param) return buildQueue(QUESTION_IDS, p.q, p.settings.newQuestions, p.fresh.q, now);
  if (param === "mistakes") {
    const wrong = QUESTION_IDS.filter((id) => p.q[id]?.wrong);
    return shuffle(wrong).slice(0, SESSION_SIZE);
  }
  if (param.startsWith("kind-")) {
    const kind = param.slice(5) as Kind;
    const pool = QUESTION_IDS.filter((id) => QUESTION_BY_ID.get(id)!.kind === kind);
    // Questions of this kind not seen yet first, in bank order; then the rest, shuffled.
    const unseen = pool.filter((id) => !p.q[id]);
    return [...unseen, ...shuffle(pool.filter((id) => p.q[id]))].slice(0, SESSION_SIZE);
  }
  if (param.startsWith("ids-")) return param.slice(4).split(",").filter((id) => QUESTION_BY_ID.has(id));
  if (QUESTION_BY_ID.has(param)) return [param];
  return [];
}
