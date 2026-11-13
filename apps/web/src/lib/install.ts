import { useEffect, useState } from "react";

// Install: Android Chrome fires beforeinstallprompt, which we keep and offer from our own button.
// iOS has no such event; Safari users get a short "Share → Add to Home Screen" hint instead.

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return {
    canPrompt: !!deferred,
    ios: isIOS(),
    standalone: isStandalone(),
    async prompt() {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      listeners.forEach((l) => l());
    },
  };
}
