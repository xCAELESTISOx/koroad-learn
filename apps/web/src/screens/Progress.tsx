import { META, QUESTION_IDS, WORD_IDS } from "../lib/data";
import { counts } from "../lib/queue";
import { href } from "../lib/router";
import { localDay, replaceProgress, streak, update, useProgress, type Settings } from "../lib/store";
import { BackIcon } from "../ui/icons";
import { toast } from "../ui/overlay";
import { Tile } from "../ui/Tile";
import { useState } from "react";

function Seg<T extends string | number | boolean>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="muted small" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div className="seg" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={String(v)} aria-pressed={value === v} onClick={() => onChange(v)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProgressScreen() {
  const p = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const qc = counts(QUESTION_IDS, p.q, p.settings.newQuestions, p.fresh.q);
  const wc = counts(WORD_IDS, p.w, p.settings.newWords, p.fresh.w);
  const days = Array.from({ length: 28 }, (_, i) => p.days[localDay(Date.now() - (27 - i) * 86_400_000)] ?? 0);
  const max = Math.max(1, ...days);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => update((d) => void (d.settings[k] = v));
  return (
    <main className="screen">
      <header className="topbar">
        <h1>Прогресс</h1>
      </header>
      <section className="card">
        <div className="bars" aria-label="Ответов по дням за 4 недели">
          {days.map((n, i) => (
            <i key={i} className={n ? "on" : ""} style={{ height: n ? 10 + (n / max) * 54 : 6 }} title={`${n}`} />
          ))}
        </div>
        <div className="row small faint" style={{ justifyContent: "space-between", marginTop: 6 }}>
          <span>4 недели назад</span>
          <span>сегодня</span>
        </div>
      </section>
      <section className="card stats">
        <div className="stat">
          <b>{qc.learned}</b>
          <span>вопросов выучено</span>
        </div>
        <div className="stat">
          <b>{wc.learned}</b>
          <span>слов выучено</span>
        </div>
        <div className="stat">
          <b>{streak(p.days)}</b>
          <span>дней подряд</span>
        </div>
      </section>
      <p className="section-title">Настройки</p>
      <section className="card stack" style={{ gap: 16 }}>
        <Seg label="Русский перевод вопроса" value={p.settings.ru} options={[["tap", "По кнопке"], ["always", "Всегда"]]} onChange={(v) => set("ru", v)} />
        <Seg label="Новых вопросов в день" value={p.settings.newQuestions} options={[5, 10, 15, 25, 40].map((n) => [n, String(n)])} onChange={(v) => set("newQuestions", v)} />
        <Seg label="Новых слов в день" value={p.settings.newWords} options={[5, 10, 15, 20, 30].map((n) => [n, String(n)])} onChange={(v) => set("newWords", v)} />
        <Seg label="Вибрация (на Android)" value={p.settings.haptics} options={[[true, "Вкл"], [false, "Выкл"]]} onChange={(v) => set("haptics", v)} />
      </section>
      <p className="section-title">Данные</p>
      <div className="stack">
        <Tile href={href("source")} icon="i" title="Источник и проверка" detail={META.source.short} />
        <button
          className="btn ghost"
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([JSON.stringify(p)], { type: "application/json" }));
            a.download = `koroad-progress-${localDay()}.json`;
            a.click();
          }}
        >
          Сохранить прогресс в файл
        </button>
        <label className="btn ghost" style={{ cursor: "pointer" }}>
          Загрузить прогресс из файла
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              try {
                const data = JSON.parse(await e.target.files![0]!.text());
                if (!data.q || !data.w) throw new Error();
                replaceProgress(data);
                toast("Прогресс загружен");
              } catch {
                toast("Это не файл прогресса");
              }
            }}
          />
        </label>
        <button className="btn ghost danger" onClick={() => (confirmReset ? (replaceProgress(null), setConfirmReset(false), toast("Прогресс сброшен")) : setConfirmReset(true))}>
          {confirmReset ? "Точно удалить весь прогресс? Нажми ещё раз" : "Сбросить весь прогресс"}
        </button>
      </div>
      <p className="faint small" style={{ textAlign: "center" }}>
        Данные: {META.version}
      </p>
    </main>
  );
}

export function SourceScreen() {
  const s = META.source;
  return (
    <main className="screen">
      <header className="topbar">
        <a className="iconbtn" href={href("progress")} aria-label="Назад">
          <BackIcon />
        </a>
        <h1 className="title-sm">Источник</h1>
      </header>
      <section className="card prose">
        <p lang="ko">
          <b>{s.title}</b>
        </p>
        <p>
          {s.publisher}. {s.effective}
        </p>
        <p>
          <a href={s.url} target="_blank" rel="noopener">
            {s.url}
          </a>
        </p>
      </section>
      <section className="card prose">
        <p>
          <b>Как сделан контент</b>
        </p>
        {s.method.split("\n").map((line, i) => (
          <p key={i} className="small">
            {line}
          </p>
        ))}
        {s.skipped && <p className="small muted">{s.skipped}</p>}
      </section>
    </main>
  );
}
