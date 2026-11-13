import { META, QUESTION_IDS, QUESTIONS, WORD_IDS } from "../lib/data";
import { plural } from "../lib/plural";
import { counts } from "../lib/queue";
import { href } from "../lib/router";
import { streak, useProgress } from "../lib/store";
import { InstallCard } from "../ui/InstallCard";
import { Tile } from "../ui/Tile";

export function TodayScreen() {
  const p = useProgress();
  const qc = counts(QUESTION_IDS, p.q, p.settings.newQuestions, p.fresh.q);
  const wc = counts(WORD_IDS, p.w, p.settings.newWords, p.fresh.w);
  const days = streak(p.days);
  const pct = QUESTIONS.length ? Math.round((qc.learned / QUESTIONS.length) * 100) : 0;
  const toStudy = qc.due + qc.fresh;
  const mistakes = Object.values(p.q).filter((s) => s.wrong).length;
  if (!QUESTIONS.length) {
    return (
      <main className="screen">
        <div className="empty">
          <b>Банк вопросов ещё не загружен</b>
          Данные появятся после сборки контента.
        </div>
      </main>
    );
  }
  return (
    <main className="screen">
      <header className="topbar">
        <h1>Учёба</h1>
        {days > 0 && (
          <span className="chip" aria-label={`Серия: ${days} ${plural(days, "день", "дня", "дней")}`}>
            🔥 {days} {plural(days, "день", "дня", "дней")}
          </span>
        )}
      </header>
      <section className="card hero" aria-label="Прогресс">
        <div className="hero-top">
          <Ring pct={pct} />
          <div className="hero-text">
            <b>
              {qc.learned} из {QUESTIONS.length}
            </b>
            <span>вопросов выучено</span>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <b>{qc.due}</b>
            <span>повторить</span>
          </div>
          <div className="stat">
            <b>{qc.seen}</b>
            <span>пройдено</span>
          </div>
          <div className="stat">
            <b>{wc.seen}</b>
            <span>слов</span>
          </div>
        </div>
      </section>
      <div className="stack">
        <a className={`btn primary${toStudy ? "" : " disabled"}`} href={toStudy ? href("study") : undefined} aria-disabled={!toStudy}>
          {qc.due ? "Повторить вопросы" : "Новые вопросы"} <span className="badge">{qc.due || qc.fresh}</span>
        </a>
        <a className="btn" href={wc.due + wc.fresh ? href("learn") : undefined} aria-disabled={!(wc.due + wc.fresh)}>
          Учить слова <span className="badge">{wc.due + wc.fresh}</span>
        </a>
        {!toStudy && <p className="muted small" style={{ textAlign: "center" }}>На сегодня вопросы закончились. Лимит новых меняется во вкладке «Прогресс».</p>}
      </div>
      <InstallCard />
      <p className="section-title">Ещё режимы</p>
      <div className="stack">
        <Tile href={href("exam")} icon="⏱" title="Пробный экзамен" detail={`${META.exam.count} вопросов · ${META.exam.minutes} мин · проходной ${META.exam.pass}`} />
        <Tile href={href("mistakes")} icon="✗" title="Мои ошибки" detail={`${mistakes} ${plural(mistakes, "вопрос", "вопроса", "вопросов")}`} />
        <Tile href={href("bank")} icon="≡" title="Весь банк по типам" detail={`${QUESTIONS.length} вопросов: текст, знаки, фото, иллюстрации`} />
      </div>
    </main>
  );
}

const R = 45.5;
const C = 2 * Math.PI * R;

/** Share of the bank learned: an SVG ring with the number stacked over it in the same grid cell. */
function Ring({ pct }: { pct: number }) {
  return (
    <div className="ring" role="img" aria-label={`Выучено ${pct}% вопросов`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="track" cx="50" cy="50" r={R} />
        {pct > 0 && <circle className="bar" cx="50" cy="50" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />}
      </svg>
      <div className="lbl" aria-hidden="true">
        <b>{pct}%</b>
        <small>выучено</small>
      </div>
    </div>
  );
}
