import { useMemo, useRef, useState } from "react";
import { META, QUESTION_BY_ID } from "../lib/data";
import { optionOrder, pick } from "../lib/exam";
import { buzz, HAPTIC } from "../lib/haptics";
import { requeue } from "../lib/queue";
import { go } from "../lib/router";
import { questionQueue } from "../lib/session";
import { autoGrade, review } from "../lib/srs";
import { getProgress, localDay, update } from "../lib/store";
import { Explanation, QuestionView, type Mark } from "../ui/QuestionView";
import { SessionTop } from "../ui/SessionTop";
import { Finished } from "../ui/Finished";

/** Correct but slower than this counts as "hard" for the scheduler. */
const SLOW_MS = 45_000;

export function StudyScreen({ param }: { param?: string }) {
  const [queue, setQueue] = useState(() => questionQueue(param, getProgress()));
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ right: 0, done: 0 });
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const shownAt = useRef(Date.now());
  const id = queue[index];
  const q = id ? QUESTION_BY_ID.get(id) : undefined;
  const order = useMemo(() => (q ? optionOrder(q) : []), [q, index]);

  if (!q) {
    const again = () => {
      setQueue(questionQueue(param, getProgress()));
      setIndex(0);
      setTally({ right: 0, done: 0 });
      shownAt.current = Date.now();
    };
    return <Finished right={tally.right} done={tally.done} onAgain={param && param !== "mistakes" && !param.startsWith("kind-") ? undefined : again} />;
  }

  const right = picked.length === q.ans.length && picked.every((k) => q.ans.includes(k));
  const check = (answer: number[]) => {
    const ok = answer.length === q.ans.length && answer.every((k) => q.ans.includes(k));
    setChecked(true);
    buzz(ok ? HAPTIC.right : HAPTIC.wrong);
    update((p) => {
      if (!p.q[q.id]) p.fresh.q++;
      p.q[q.id] = review(p.q[q.id], autoGrade(ok, Date.now() - shownAt.current, SLOW_MS));
      p.days[localDay()] = (p.days[localDay()] ?? 0) + 1;
    });
    setTally((t) => ({ right: t.right + (ok ? 1 : 0), done: t.done + 1 }));
    // A miss comes back a few questions later in the same session.
    if (!ok && queue.filter((x) => x === q.id).length < 2) setQueue(requeue(queue, index, q.id));
  };
  const next = () => {
    setIndex(index + 1);
    setPicked([]);
    setChecked(false);
    shownAt.current = Date.now();
    scrollTo({ top: 0 });
  };
  const marks: Record<number, Mark> | undefined = checked
    ? Object.fromEntries(
        order.map((k) => [k, q.ans.includes(k) ? (picked.includes(k) ? "right" : "missed") : picked.includes(k) ? "wrong" : undefined]),
      )
    : undefined;

  return (
    <main className="screen focus">
      <SessionTop done={index} total={queue.length} onClose={() => go("today")} />
      <QuestionView
        key={`${q.id}:${index}`}
        q={q}
        order={order}
        picked={picked}
        marks={marks}
        locked={checked}
        revealRu={checked}
        onPick={(k) => {
          if (checked) return;
          const next = pick(picked, k, q.ans.length);
          setPicked(next);
          buzz(HAPTIC.tap);
          if (q.ans.length === 1) check(next);
        }}
      />
      {checked && <Explanation q={q} right={right} order={order} />}
      <div className="actionbar">
        {checked ? (
          <button className="btn primary" onClick={next} autoFocus>
            {index + 1 < queue.length ? "Дальше" : "Готово"}
          </button>
        ) : (
          <button className="btn primary" disabled={picked.length !== q.ans.length} onClick={() => check(picked)}>
            {q.ans.length > 1 ? `Проверить (${picked.length}/2)` : "Выбери ответ"}
          </button>
        )}
      </div>
      <p className="faint small" style={{ textAlign: "center" }}>
        {META.source.short}
      </p>
    </main>
  );
}
