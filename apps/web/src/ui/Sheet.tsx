import { useEffect, useRef, type ReactNode } from "react";

/** Bottom sheet: closes on the backdrop, Escape, or a downward swipe on the panel. */
export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="sheet" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onTouchStart={(e) => {
          if ((panel.current?.scrollTop ?? 0) <= 0) startY.current = e.touches[0]!.clientY;
        }}
        onTouchMove={(e) => {
          if (startY.current == null || !panel.current) return;
          const dy = e.touches[0]!.clientY - startY.current;
          if (dy > 0) panel.current.style.transform = `translateY(${dy}px)`;
        }}
        onTouchEnd={(e) => {
          if (startY.current == null || !panel.current) return;
          const dy = e.changedTouches[0]!.clientY - startY.current;
          startY.current = null;
          panel.current.style.transform = "";
          if (dy > 80) onClose();
        }}
      >
        <div className="grab" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
