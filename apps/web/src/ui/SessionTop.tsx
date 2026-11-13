import type { ReactNode } from "react";
import { CloseIcon } from "./icons";

export function SessionTop({ done, total, onClose, children }: { done: number; total: number; onClose: () => void; children?: ReactNode }) {
  return (
    <div className="session-top">
      <button className="iconbtn" onClick={onClose} aria-label="Закрыть">
        <CloseIcon />
      </button>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      {children}
    </div>
  );
}
