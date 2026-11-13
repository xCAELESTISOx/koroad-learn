import type { ReactNode } from "react";

export function Tile({ href, icon, title, detail }: { href: string; icon: ReactNode; title: ReactNode; detail?: ReactNode }) {
  return (
    <a className="tile" href={href}>
      <span className="ic" aria-hidden="true">
        {icon}
      </span>
      <span className="grow">
        <div className="t">{title}</div>
        {detail && <div className="d">{detail}</div>}
      </span>
      <span className="chev" aria-hidden="true">
        ›
      </span>
    </a>
  );
}
