import { useEffect, useMemo, useState } from "react";
import { META, QUESTION_BY_ID, QUESTIONS } from "../lib/data";
import { drawExam, pick, score, type ExamState } from "../lib/exam";
import { buzz, HAPTIC } from "../lib/haptics";
import { go, href } from "../lib/router";
import { review, Rating } from "../lib/srs";
import { localDay, update, useProgress } from "../lib/store";
import { GridIcon } from "../ui/icons";
import { toast } from "../ui/overlay";
import { QuestionView } from "../ui/QuestionView";
import { SessionTop } from "../ui/SessionTop";
import { Sheet } from "../ui/Sheet";

const KEY = "koroad-learn:exam";
function loadExam(): ExamState | null {
  try {
    const e = JSON.parse(localStorage.getItem(KEY) ?? "null") as ExamState | null;
    return e && !e.done && e.endsAt > Date.now() ? e : null;
  } catch {
    return null;
  }
}
const saveExam = (e: ExamState | null) => {
  try {
    if (e) localStorage.setItem(KEY, JSON.stringify(e));
    else localStorage.removeItem(KEY);
  } catch {
    // Private mode: the exam just isn't resumable.
  }
};

export function ExamScreen() {
  const p = useProgress();
  const saved = loadExam();
  const E = META.exam;
  return (
    <main className="screen">
      <header className="topbar">
        <h1>Пробный экзамен</h1>
      </header>
      <section className="card prose">
        <p>
          <b>
            {E.count} вопросов, {E.minutes} минут.
          </b>{" "}
          Для 2종 보통 нужно {E.pass} баллов из 100. Ответы и разбор — только в конце, как на настоящем экзамене.
        </p>
        {E.note && <p className="muted small">{E.note}</p>}
      </section>
      <div className="stack">
        {saved && (
          <a className="btn primary" href={href("examrun")}>
            Продолжить · {saved.index + 1}/{saved.ids.length}
          </a>
        )}
        <a
          className={`btn${saved ? "" : " primary"}`}
          href={href("examrun")}
          onClick={() => saveExam(drawExam(QUESTIONS.filter((q) => q.kind !== "video"), E))}
        >
          Начать новый
        </a>
      </div>
      {p.exams.length > 0 && (
        <>
          <p className="section-title">Последние попытки</p>
          <div className="list">
            {p.exams
              .slice(-8)
              .reverse()
              .map((x) => (
                <button key={x.at} disabled style={{ opacity: 1 }}>
                  <span className={`lvl ${x.score >= E.pass ? "l3" : "l1"}`} aria-hidden="true" />
                  <span className="k">{x.score}</span>
                  <span className="m">
                    {new Date(x.at).toLocaleDateString("ru")} · {x.score >= E.pass ? "сдал бы" : "не сдал бы"} · {x.right}/{x.total}
                  </span>
                </button>
              ))}
          </div>
        </>
      )}
    </main>
  );
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ExamRunScreen() {
  const [exam, setExam] = useState<ExamState>(() => loadExam() ?? drawExam(QUESTIONS.filter((q) => q.kind !== "video"), META.exam));
  const [now, setNow] = useState(Date.now());
  const [palette, setPalette] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof score> | null>(null);
  const left = exam.endsAt - now;

  const change = (e: ExamState) => {
    setExam(e);
    saveExam(e);
  };
  const submit = () => {
    const r = score(exam, QUESTION_BY_ID, META.exam);
    setResult(r);
    setPalette(false);
    saveExam(null);
    buzz(r.passed ? HAPTIC.done : HAPTIC.wrong);
    update((p) => {
      p.exams.push({ at: Date.now(), score: r.score, right: r.right, total: exam.ids.length });
      p.days[localDay()] = (p.days[localDay()] ?? 0) + exam.ids.length;
      // Mistakes go into the review queue as forgotten.
      exam.ids.forEach((id, i) => {
        if (!r.results[i]) p.q[id] = review(p.q[id], Rating.Again);
      });
    });
    scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [result]);
  useEffect(() => {
    if (result) return;
    if (left <= 0) {
      toast("Время вышло");
      submit();
    } else if (Math.abs(left - 5 * 60_000) < 1000) toast("Осталось 5 минут");
    else if (Math.abs(left - 60_000) < 1000) toast("Осталась 1 минута");
  }, [Math.floor(left / 1000)]);

  const q = QUESTION_BY_ID.get(exam.ids[exam.index]!)!;
  const unanswered = useMemo(() => exam.ids.filter((id) => (exam.answers[id]?.length ?? 0) !== QUESTION_BY_ID.get(id)!.ans.length).length, [exam]);

  if (result) {
    const wrong = exam.ids.filter((_, i) => !result.results[i]);
    return (
      <main className="screen focus">
        <section className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <div className="score pop" style={{ color: result.passed ? "var(--ok)" : "var(--wrong)" }}>
            {result.score}
          </div>
          <p style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>
            {result.passed ? "Сдал бы" : "Пока не сдал бы"} · нужно {META.exam.pass}
          </p>
          <p className="muted small">
            Верно {result.right} из {exam.ids.length}. Ошибки добавлены в повторение.
          </p>
        </section>
        <p className="section-title">Разбор: нажми на номер</p>
        <div className="grid-nums">
          {exam.ids.map((id, i) => (
            <a key={id} href={href("study", id)} className={result.results[i] ? "ok" : "bad"} style={{ display: "grid", placeItems: "center", textDecoration: "none", height: 44, borderRadius: 10 }}>
              {i + 1}
            </a>
          ))}
        </div>
        <div className="actionbar stack">
          {wrong.length > 0 && (
            <a className="btn primary" href={href("study", `ids-${wrong.join(",")}`)}>
              Разобрать ошибки ({wrong.length})
            </a>
          )}
          <a className="btn" href={href("exam")}>
            Готово
          </a>
        </div>
      </main>
    );
  }

  const picked = exam.answers[q.id] ?? [];
  return (
    <main className="screen focus">
      <SessionTop done={exam.index} total={exam.ids.length} onClose={() => go("exam")}>
        <span className={`timer${left < 5 * 60_000 ? " low" : ""}`} role="timer" aria-label="Осталось времени">
          {fmt(left)}
        </span>
        <button className="iconbtn" onClick={() => setPalette(true)} aria-label="Все вопросы">
          <GridIcon />
        </button>
      </SessionTop>
      <QuestionView
        key={q.id}
        q={q}
        order={exam.order[q.id]!}
        picked={picked}
        onPick={(k) => {
          buzz(HAPTIC.tap);
          change({ ...exam, answers: { ...exam.answers, [q.id]: pick(picked, k, q.ans.length) } });
        }}
      />
      <div className="actionbar">
        <div className="row">
          <button className="btn" style={{ flex: "0 0 32%" }} disabled={exam.index === 0} onClick={() => change({ ...exam, index: exam.index - 1 })}>
            Назад
          </button>
          {exam.index + 1 < exam.ids.length ? (
            <button className="btn primary grow" onClick={() => (change({ ...exam, index: exam.index + 1 }), scrollTo({ top: 0 }))}>
              Дальше
            </button>
          ) : (
            <button className="btn primary grow" onClick={() => setPalette(true)}>
              Завершить
            </button>
          )}
        </div>
      </div>
      {palette && (
        <Sheet onClose={() => setPalette(false)} label="Вопросы экзамена">
          <h2 style={{ fontSize: 21 }}>Вопросы</h2>
          <p className="muted small" style={{ margin: "4px 0 12px" }}>
            {unanswered ? `Без ответа: ${unanswered}` : "На все вопросы есть ответ"}
          </p>
          <div className="grid-nums">
            {exam.ids.map((id, i) => (
              <button
                key={id}
                className={`${exam.answers[id]?.length ? "ok" : ""}${i === exam.index ? " cur" : ""}`}
                onClick={() => {
                  change({ ...exam, index: i });
                  setPalette(false);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <SubmitButton unanswered={unanswered} onSubmit={submit} />
          </div>
        </Sheet>
      )}
    </main>
  );
}

/** Submitting with questions left asks once more, inline, instead of a browser dialog. */
function SubmitButton({ unanswered, onSubmit }: { unanswered: number; onSubmit: () => void }) {
  const [sure, setSure] = useState(false);
  if (unanswered && !sure)
    return (
      <button className="btn" onClick={() => setSure(true)}>
        Сдать экзамен
      </button>
    );
  return (
    <button className="btn primary" onClick={onSubmit}>
      {unanswered ? `Сдать с ${unanswered} без ответа` : "Сдать экзамен"}
    </button>
  );
}

