import { META, QUESTION_IDS, QUESTION_BY_ID } from "../lib/data";
import { href } from "../lib/router";
import { level } from "../lib/srs";
import { useProgress } from "../lib/store";
import type { Kind } from "../lib/types";
import { BackIcon } from "../ui/icons";
import { Tile } from "../ui/Tile";

const KINDS: { kind: Kind; icon: string; ko: string }[] = [
  { kind: "text", icon: "文", ko: "문장형" },
  { kind: "sign", icon: "△", ko: "안전표지형" },
  { kind: "photo", icon: "▣", ko: "사진형" },
  { kind: "illust", icon: "✎", ko: "일러스트형" },
];

export function BankScreen() {
  const p = useProgress();
  return (
    <main className="screen">
      <header className="topbar">
        <a className="iconbtn" href={href("today")} aria-label="Назад">
          <BackIcon />
        </a>
        <h1 className="title-sm">Банк вопросов</h1>
      </header>
      <p className="muted small">Тренировка по типу вопроса: сначала новые, потом уже виденные вперемешку.</p>
      <div className="stack">
        {KINDS.map(({ kind, icon, ko }) => {
          const ids = QUESTION_IDS.filter((id) => QUESTION_BY_ID.get(id)!.kind === kind);
          const seen = ids.filter((id) => p.q[id]).length;
          return (
            <Tile
              key={kind}
              href={href("study", `kind-${kind}`)}
              icon={icon}
              title={META.kinds[kind]}
              detail={
                <>
                  <span lang="ko">{ko}</span> · пройдено {seen} из {ids.length}
                </>
              }
            />
          );
        })}
      </div>
      {META.source.skipped && <p className="faint small">{META.source.skipped}</p>}
    </main>
  );
}

export function MistakesScreen() {
  const p = useProgress();
  const list = QUESTION_IDS.filter((id) => p.q[id]?.wrong).sort((a, b) => (p.q[b]!.wrong ?? 0) - (p.q[a]!.wrong ?? 0));
  return (
    <main className="screen">
      <header className="topbar">
        <a className="iconbtn" href={href("today")} aria-label="Назад">
          <BackIcon />
        </a>
        <h1 className="title-sm">Мои ошибки</h1>
      </header>
      {list.length ? (
        <>
          <a className="btn primary" href={href("study", "mistakes")}>
            Прогнать ошибки ({Math.min(20, list.length)})
          </a>
          <div className="list">
            {list.map((id) => {
              const q = QUESTION_BY_ID.get(id)!;
              return (
                <a key={id} href={href("study", id)}>
                  <span className={`lvl l${level(p.q[id])}`} aria-hidden="true" />
                  <span className="m" lang="ko">
                    {q.ko.q.length > 70 ? q.ko.q.slice(0, 70) + "…" : q.ko.q}
                  </span>
                  <span className="faint small">×{p.q[id]!.wrong}</span>
                </a>
              );
            })}
          </div>
        </>
      ) : (
        <div className="empty">
          <b>Ошибок нет</b>
          Здесь появятся вопросы, на которые ты ответил неверно.
        </div>
      )}
    </main>
  );
}
