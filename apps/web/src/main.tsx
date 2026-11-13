import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import { App } from "./App";
import { registerServiceWorker } from "./lib/serviceWorker";
import "./theme.css";
import { toast } from "./ui/overlay";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// A new version waits until the user agrees, so a running session or exam is never cut off.
registerServiceWorker((apply) => toast("Есть новая версия", 0, { label: "Обновить", run: apply }));
