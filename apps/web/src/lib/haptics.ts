import { getProgress } from "./store";

// Vibration works on Android Chrome only; iOS Safari has no Vibration API. Haptics are never the
// only feedback: colour, icon and text always come with them.
export function buzz(pattern: number | readonly number[]) {
  if (!getProgress().settings.haptics || typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(typeof pattern === "number" ? pattern : [...pattern]);
  } catch {
    // Some browsers throw before a user gesture.
  }
}
export const HAPTIC = { tap: 8, right: 15, wrong: [30, 50, 30], done: [20, 40, 20] } as const;
