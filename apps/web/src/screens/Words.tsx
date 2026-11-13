import { useState } from "react";
import { WORD_BY_ID, WORD_IDS, WORDS } from "../lib/data";
import { counts } from "../lib/queue";
import { href } from "../lib/router";
import { level } from "../lib/srs";
import { useProgress } from "../lib/store";
import type { Word } from "../lib/types";
import { BackIcon } from "../ui/icons";
import { openWord } from "../ui/overlay";

export function WordRow({ w }: { w: Word }) {
  const p = useProgress();
  return (
    <button onClick={() => openWord(w.id)}>
      <span className={`lvl l${level(p.w[w.id])}`} aria-hidden="true" />
      <span className="k" lang="ko">
        {w.ko}
      </span>
      <span className="m">{w.ru}</span>
      <span className="faint small" aria-label={`в ${(w.n ?? w.qs.length)} вопросах`}>
        {(w.n ?? w.qs.length)}
      </span>
    </button>
  );
}

export function WordsScreen() {
  const p = useProgress();
  const wc = counts(WORD_IDS, p.w, p.settings.newWords, p.fresh.w);
  const top = WORD_IDS.slice(0, 30).map((id) => WORD_BY_ID.get(id)!);
  return (
    <main className="screen">
      <header className="topbar">
        <h1>Слова</h1>
      </header>
      <section className="card">
        <div className="stats">
          <div className="stat">
            <b>{wc.due}</b>
            <span>повторить</span>
          </div>
          <div className="stat">
            <b>{wc.seen}</b>
            <span>в изучении</span>
          </div>
          <div className="stat">
            <b>{wc.learned}</b>
            <span>выучено</span>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 12 }}>
          {WORDS.length} слов из текстов вопросов. Сначала самые частые: выучив первые 300, ты узнаешь большую часть слов в любом вопросе.
        </p>
      </section>
      <a className="btn primary" href={href("learn")} aria-disabled={!(wc.due + wc.fresh)}>
        Учить <span className="badge">{wc.due + wc.fresh}</span>
      </a>
      <p className="section-title">Самые частые</p>
      <div className="list">
        {top.map((w) => (
          <WordRow key={w.id} w={w} />
        ))}
      </div>
      <a className="btn ghost" href={href("wordlist")}>
        Все {WORDS.length} слов ›
      </a>
    </main>
  );
}

export function WordListScreen() {
  const [q, setQ] = useState("");
  const v = q.trim().toLowerCase();
  const list = WORD_IDS.map((id) => WORD_BY_ID.get(id)!).filter((w) => !v || w.ko.includes(v) || w.ru.toLowerCase().includes(v));
  return (
    <main className="screen">
      <header className="topbar">
        <a className="iconbtn" href={href("words")} aria-label="Назад">
          <BackIcon />
        </a>
        <h1 className="title-sm">Все слова</h1>
      </header>
      <input className="search" type="search" placeholder="Поиск: 교차로 или перекрёсток" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      <div className="list">
        {list.slice(0, 300).map((w) => (
          <WordRow key={w.id} w={w} />
        ))}
      </div>
      {list.length > 300 && <p className="faint small">Показаны первые 300. Уточни поиск.</p>}
    </main>
  );
}
