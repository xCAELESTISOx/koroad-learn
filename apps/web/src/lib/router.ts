import { useEffect, useState } from "react";

// A handful of screens doesn't justify a router dependency. Screens live in the hash, so the PWA
// works from any static host, GitHub Pages included.
export type Route =
  | "today"
  | "words"
  | "wordlist"
  | "exam"
  | "progress"
  | "source"
  | "study"
  | "learn"
  | "examrun"
  | "bank"
  | "mistakes";

export interface Location {
  route: Route;
  /** On "study": what to study ("mistakes", "kind-sign", "q0001"); none means the day's queue. */
  param?: string;
}

const ROUTES = new Set<Route>(["words", "wordlist", "exam", "progress", "source", "study", "learn", "examrun", "bank", "mistakes"]);

export function parseHash(hash: string): Location {
  const [head, param] = hash.replace(/^#\/?/, "").split("/");
  if (head && ROUTES.has(head as Route)) return { route: head as Route, ...(param ? { param: decodeURIComponent(param) } : {}) };
  return { route: "today" };
}

export const href = (route: Route, param?: string) => (route === "today" ? "#/" : `#/${route}${param ? `/${encodeURIComponent(param)}` : ""}`);

export function go(route: Route, param?: string) {
  location.hash = href(route, param);
}

export function useLocation(): Location {
  const [loc, setLoc] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setLoc(parseHash(location.hash));
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return loc;
}
