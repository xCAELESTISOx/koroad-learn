import { useState } from "react";
import { META } from "../lib/data";
import { useProgress } from "../lib/store";
import type { Question } from "../lib/types";
import { KoText } from "./KoText";

export type Mark = "right" | "wrong" | "missed" | undefined;

/**
 * A question as in the bank: picture, Korean text with tappable words, a Russian translation on
 * demand, and the options as big full-width buttons. `order` is the option order on screen.
 */
export function QuestionView({
  q,
  order,
  picked,
  marks,
  locked,
  onPick,
  revealRu,
}: {
  q: Question;
  order: number[];
  picked: number[];
  marks?: Record<number, Mark>;
  locked?: boolean;
  onPick: (option: number) => void;
  /** Show the translation (after answering). */
  revealRu?: boolean;
}) {
  const { settings } = useProgress();
  const [ru, setRu] = useState(settings.ru === "always");
  const showRu = ru || !!revealRu;
  const two = q.ans.length > 1;
  return (
    <>
      <div className="qmeta">
        <span className="chip">{META.kinds[q.kind]}</span>
        {two && <span className="chip warn">2 ответа</span>}
        <span>№ {q.no}</span>
        {q.srcNote && (
          <span className="chip" title={q.srcNote}>
            ⓘ особенность источника
          </span>
        )}
        {q.flag && (
          <span className="chip warn" title={q.flag}>
            ⚠ перевод под вопросом
          </span>
        )}
      </div>
      {q.img && <img className={q.kind === "sign" ? "qimg sign" : "qimg"} src={q.img} alt={`Иллюстрация к вопросу ${q.no}`} />}
      {q.ko.notes && (
        <ul className="notes" aria-label="Условия">
          {q.ko.notes.map((n, i) => (
            <li key={i}>
              <span lang="ko">
                <KoText text={n} />
              </span>
              {showRu && q.ru.notes?.[i] && (
                <span className="muted" lang="ru">
                  {" "}
                  — {q.ru.notes[i]}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="qtext" lang="ko">
        <KoText text={q.ko.q} />
      </p>
      {showRu && (
        <div className="qru" lang="ru">
          {q.ru.q}
        </div>
      )}
      <div className="row" style={{ gap: 10 }}>
        <button className="pill" aria-pressed={showRu} onClick={() => setRu(!ru)} disabled={revealRu}>
          Перевод
        </button>
        <span className="faint small">Нажми на подчёркнутое слово</span>
      </div>
      {two && <p className="hint-two">Выбери два правильных ответа</p>}
      <div className={`opts${locked ? " locked" : ""}`} role="group" aria-label="Варианты ответа">
        {order.map((k, n) => {
          const mark = marks?.[k];
          return (
            <button
              key={k}
              className={`opt${picked.includes(k) && !mark ? " sel" : ""}${mark ? ` ${mark}` : ""}`}
              aria-pressed={picked.includes(k)}
              onClick={() => onPick(k)}
            >
              <span className="num">{mark === "right" || mark === "missed" ? "✓" : mark === "wrong" ? "✗" : n + 1}</span>
              <span className="txt">
                <div className="ko" lang="ko">
                  {q.ko.opts[k]}
                </div>
                {showRu && (
                  <div className="ru" lang="ru">
                    {q.ru.opts[k]}
                  </div>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function Explanation({ q, right, order }: { q: Question; right: boolean; order: number[] }) {
  const answer = q.ans.map((k) => order.indexOf(k) + 1).join(" и ");
  return (
    <div className={`feedback ${right ? "ok pop" : "bad"}`} role="status">
      <h3>{right ? "✓ Верно" : `✗ Неверно. Правильно: ${answer}`}</h3>
      {q.ko.exp && (
        <p className="exp" lang="ko">
          <KoText text={q.ko.exp} />
        </p>
      )}
      {q.ru.exp && (
        <p className="exp" lang="ru">
          {q.ru.exp}
        </p>
      )}
      <p className="src">
        {META.source.short}, вопрос № {q.no}
        {q.src.page ? `, стр. ${q.src.page}` : ""}
      </p>
    </div>
  );
}
