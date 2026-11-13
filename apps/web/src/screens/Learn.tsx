import { useMemo, useRef, useState } from "react";
import { distractors } from "../lib/choice";
import { QUESTION_BY_ID, WORD_BY_ID, WORD_IDS, WORDS } from "../lib/data";
import { buzz, HAPTIC } from "../lib/haptics";
import { highlight } from "../lib/korean";
import { buildQueue, requeue, shuffle } from "../lib/queue";
import { go } from "../lib/router";
import { formatIn, previewDue, Rating, review, type Grade } from "../lib/srs";
import { getProgress, localDay, update } from "../lib/store";
import type { Word } from "../lib/types";
import { Finished } from "../ui/Finished";
import { SessionTop } from "../ui/SessionTop";

const queueNow = () => {
  const p = getProgress();
  return buildQueue(WORD_IDS, p.w, p.settings.newWords, p.fresh.w);
};

/** The word inside a real question of the bank, so it is learned in the exam's own context. */
function Context({ w }: { w: Word }) {
  const q = w.qs.map((id) => QUESTION_BY_ID.get(id)).find(Boolean);
  if (!q) return null;
  const text = [q.ko.q, ...q.ko.opts].find((t) => highlight(t, w).some((p) => p.word)) ?? q.ko.q;
  return (
    <div className="ctx">
      <p lang="ko">{highlight(text, w).map((p, i) => (p.word ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>))}</p>
      <p className="faint small" style={{ marginTop: 4 }}>
        Вопрос № {q.no}
      </p>
    </div>
  );
}

export function LearnScreen() {
  const [queue, setQueue] = useState(queueNow);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ right: 0, done: 0 });
  const [introDone, setIntroDone] = useState(false);
  const [answer, setAnswer] = useState<string>();
  const shownAt = useRef(Date.now());
  const w = queue[index] ? WORD_BY_ID.get(queue[index]!) : undefined;
  const sched = w ? getProgress().w[w.id] : undefined;
  const fresh = !!w && !sched;
  const currentStage = fresh && !introDone ? "intro" : "quiz";
  const dir = useMemo(() => (fresh || Math.random() < 0.6 ? "ko" : "ru"), [w?.id, index]);
  const options = useMemo(() => (w ? shuffle([w, ...distractors(w, WORDS)]) : []), [w?.id, index]);

  if (!w) {
    const again = () => {
      setQueue(queueNow());
      setIndex(0);
      setTally({ right: 0, done: 0 });
    };
    return <Finished right={tally.right} done={tally.done} onAgain={again} />;
  }

  const commit = (grade: Grade) => {
    update((p) => {
      if (!p.w[w.id]) p.fresh.w++;
      p.w[w.id] = review(p.w[w.id], grade);
    });
    if (grade === Rating.Again && queue.filter((x) => x === w.id).length < 2) setQueue(requeue(queue, index, w.id, 4));
    setIndex(index + 1);
    setIntroDone(false);
    setAnswer(undefined);
    shownAt.current = Date.now();
  };
  const choose = (id: string) => {
    if (answer) return;
    const ok = id === w.id;
    setAnswer(id);
    buzz(ok ? HAPTIC.right : HAPTIC.wrong);
    update((p) => void (p.days[localDay()] = (p.days[localDay()] ?? 0) + 1));
    setTally((t) => ({ right: t.right + (ok ? 1 : 0), done: t.done + 1 }));
  };
  const right = answer === w.id;
  const preview = previewDue(sched);
  const fast = Date.now() - shownAt.current < 6000;

  return (
    <main className="screen focus">
      <SessionTop done={index} total={queue.length} onClose={() => go("words")} />
      {currentStage === "intro" ? (
        <>
          <section className="card wordcard" aria-live="polite">
            <span className="newtag">Новое слово</span>
            <div className="big" lang="ko">
              {w.ko}
            </div>
            {(w.rr || w.hanja) && (
              <div className="rr">
                {w.rr}
                {w.hanja ? ` · ${w.hanja}` : ""}
              </div>
            )}
            <div className="mean">{w.ru}</div>
            {w.note && <p className="muted small">{w.note}</p>}
            <Context w={w} />
          </section>
          <div className="actionbar">
            <button className="btn primary" onClick={() => setIntroDone(true)} autoFocus>
              Запомнил, проверь меня
            </button>
          </div>
        </>
      ) : (
        <>
          <section className="card wordcard">
            <div className={dir === "ko" ? "big" : "mean"} lang={dir === "ko" ? "ko" : "ru"}>
              {dir === "ko" ? w.ko : w.ru}
            </div>
            <div className="rr">{dir === "ko" ? "Что это значит?" : "Как это по-корейски?"}</div>
          </section>
          <div className={`opts${answer ? " locked" : ""}`} role="group" aria-label="Варианты">
            {options.map((o, n) => (
              <button
                key={o.id}
                className={`opt${answer && o.id === w.id ? " right" : ""}${answer === o.id && o.id !== w.id ? " wrong" : ""}`}
                onClick={() => choose(o.id)}
              >
                <span className="num">{answer && o.id === w.id ? "✓" : answer === o.id ? "✗" : n + 1}</span>
                <span className="txt">
                  <div className={dir === "ko" ? "" : "ko"} lang={dir === "ko" ? "ru" : "ko"} style={{ fontSize: 17 }}>
                    {dir === "ko" ? o.ru : o.ko}
                  </div>
                </span>
              </button>
            ))}
          </div>
          {answer && (
            <div className={`feedback ${right ? "ok" : "bad"}`} role="status">
              <h3>
                {right ? "✓ Верно" : "✗ Нет"}: <span lang="ko">{w.ko}</span> — {w.ru}
              </h3>
              {w.rr && <p className="faint small">{w.rr}</p>}
              <Context w={w} />
            </div>
          )}
          <div className="actionbar">
            {answer &&
              (right ? (
                <div className="rate">
                  <button className="btn again" onClick={() => commit(Rating.Again)}>
                    Снова<small>{formatIn(preview[Rating.Again] - Date.now())}</small>
                  </button>
                  <button className="btn hard" onClick={() => commit(Rating.Hard)}>
                    Трудно<small>{formatIn(preview[Rating.Hard] - Date.now())}</small>
                  </button>
                  <button className={`btn good${fast ? " pop" : ""}`} onClick={() => commit(Rating.Good)} autoFocus>
                    Знаю<small>{formatIn(preview[Rating.Good] - Date.now())}</small>
                  </button>
                </div>
              ) : (
                <button className="btn primary" onClick={() => commit(Rating.Again)} autoFocus>
                  Дальше
                </button>
              ))}
          </div>
        </>
      )}
    </main>
  );
}
