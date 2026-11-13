import { useSyncExternalStore } from "react";

// One bottom sheet and one toast for the whole app, opened from anywhere.

type State = { word?: string; toast?: { text: string; action?: { label: string; run: () => void } } };
let state: State = {};
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const openWord = (id: string) => set({ ...state, word: id });
export const closeWord = () => set({ ...state, word: undefined });
export function toast(text: string, ms = 2400, action?: { label: string; run: () => void }) {
  clearTimeout(toastTimer);
  set({ ...state, toast: { text, action } });
  if (ms > 0) toastTimer = setTimeout(() => set({ ...state, toast: undefined }), ms);
}
export const useOverlay = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
