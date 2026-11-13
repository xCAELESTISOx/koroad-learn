import type { CSSProperties } from "react";
import { href, type Route } from "../lib/router";
import { ChartIcon, HomeIcon, TimerIcon, WordsIcon } from "./icons";

const TABS = [
  { id: "today", label: "Учёба", Icon: HomeIcon },
  { id: "words", label: "Слова", Icon: WordsIcon },
  { id: "exam", label: "Экзамен", Icon: TimerIcon },
  { id: "progress", label: "Прогресс", Icon: ChartIcon },
] as const;

const PARENT: Partial<Record<Route, Route>> = { wordlist: "words", bank: "today", mistakes: "today", source: "progress" };

export function TabBar({ route }: { route: Route }) {
  const active = PARENT[route] ?? route;
  const index = Math.max(
    TABS.findIndex((t) => t.id === active),
    0,
  );
  return (
    <nav className="tabbar" aria-label="Разделы">
      <div className="tabbar-inner" style={{ "--tabs": TABS.length, "--active": index } as CSSProperties}>
        <span className="tab-indicator" aria-hidden="true" />
        {TABS.map(({ id, label, Icon }) => (
          <a key={id} className="tab" href={href(id)} aria-current={active === id ? "page" : undefined}>
            <Icon />
            <span>{label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
