import { useInstall } from "../lib/install";
import { update, useProgress } from "../lib/store";
import { CloseIcon } from "./icons";

const TWO_WEEKS = 14 * 86_400_000;

/** Offered on Today once something has been studied, never on first load; hidden for two weeks when dismissed. */
export function InstallCard() {
  const install = useInstall();
  const progress = useProgress();
  const studied = Object.keys(progress.q).length + Object.keys(progress.w).length > 0;
  if (install.standalone || !studied) return null;
  if (progress.installHiddenAt && Date.now() - progress.installHiddenAt < TWO_WEEKS) return null;
  if (!install.canPrompt && !install.ios) return null;
  return (
    <div className="tile" style={{ cursor: "default" }}>
      <span className="ic" aria-hidden="true">
        ＋
      </span>
      <span className="grow">
        <div className="t">Добавь на экран «Домой»</div>
        <div className="d">
          {install.ios ? "Safari: «Поделиться» → «На экран „Домой“». Работает без интернета." : "Откроется как приложение и будет работать без интернета."}
        </div>
      </span>
      {install.canPrompt && (
        <button className="pill" style={{ background: "var(--accent)", color: "var(--on-accent)" }} onClick={() => void install.prompt()}>
          Установить
        </button>
      )}
      <button className="iconbtn" aria-label="Скрыть" onClick={() => update((p) => void (p.installHiddenAt = Date.now()))}>
        <CloseIcon />
      </button>
    </div>
  );
}
