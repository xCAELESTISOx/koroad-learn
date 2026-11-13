import { WORD_BY_ID } from "../lib/data";
import { addToList, removeFromList } from "../lib/kquiz";
import { level } from "../lib/srs";
import { update, useProgress } from "../lib/store";
import { review, Rating } from "../lib/srs";
import { closeWord, toast, useOverlay } from "./overlay";
import { Sheet } from "./Sheet";

const LEVEL = ["", "учу", "повторяю", "выучено"];

export function Overlays() {
  const { word, toast: t } = useOverlay();
  const progress = useProgress();
  const w = word ? WORD_BY_ID.get(word) : undefined;
  const sched = w ? progress.w[w.id] : undefined;
  return (
    <>
      {w && (
        <Sheet onClose={closeWord} label={`Слово ${w.ko}`}>
          <h2 lang="ko">{w.ko}</h2>
          {(w.rr || w.hanja) && (
            <p className="faint">
              {w.rr}
              {w.hanja ? ` · ${w.hanja}` : ""}
            </p>
          )}
          <p className="mean">{w.ru}</p>
          {w.note && <p className="muted small">{w.note}</p>}
          <p className="muted small" style={{ margin: "8px 0 16px" }}>
            Встречается в вопросах банка: {(w.n ?? w.qs.length)}
          </p>
          <button
            className={`btn ${sched ? "" : "primary"}`}
            disabled={!!sched}
            onClick={() => {
              // Seen once, so the next session asks it back right away.
              update((p) => {
                p.w[w.id] = { ...review(undefined, Rating.Again), due: Date.now() };
                addToList(p, w.id);
              });
              toast("Слово добавлено в повторение");
              closeWord();
            }}
          >
            {sched ? `Уже в изучении · ${LEVEL[level(sched)]}` : "Учить это слово"}
          </button>
          {progress.kquiz.sent.includes(w.id) ? (
            <p className="muted small" style={{ textAlign: "center", marginTop: 12 }}>
              Уже отправлено в KQuiz
            </p>
          ) : (
            <button
              className="btn ghost"
              style={{ marginTop: 8 }}
              aria-pressed={progress.kquiz.list.includes(w.id)}
              onClick={() => update((p) => (p.kquiz.list.includes(w.id) ? removeFromList(p, w.id) : addToList(p, w.id)))}
            >
              {progress.kquiz.list.includes(w.id) ? "✓ В списке для KQuiz · убрать" : "В список для KQuiz"}
            </button>
          )}
        </Sheet>
      )}
      <div className={`toast${t ? " on" : ""}`} role="status" aria-live="polite">
        {t?.text}
        {t?.action && (
          <button style={{ marginLeft: 10, textDecoration: "underline", fontWeight: 700 }} onClick={t.action.run}>
            {t.action.label}
          </button>
        )}
      </div>
    </>
  );
}
