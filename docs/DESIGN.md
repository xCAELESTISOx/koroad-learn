# Interaction design: what the app follows and why

Research summary (sources at the end). Each rule names where it lives in the code.

## Touch and thumbs
- **Targets ≥ 48 px**, answer options are full-width rows ≥ 60 px with 12 px gaps, so a mis-tap
  doesn't commit a wrong answer (Apple HIG 44 pt, Material 48 dp, WCAG 2.2 SC 2.5.8). `theme.css` `--tap`, `.opt`.
- **Primary actions in the bottom third**: "Дальше", "Проверить", the rating buttons and exam
  navigation sit in a sticky action bar above the home indicator (`.actionbar`, safe-area insets).
  Reading content (question, picture) stays on top.
- **Bottom tab bar** for the four sections; hidden during a session or exam so nothing competes with the answers (`App.tsx`).
- Every swipe has a button: the sheet closes by swipe, backdrop, Escape or its controls.

## Feedback
- **Immediate**: right/wrong shows within one frame as colour + icon (✓/✗) + text, never colour alone (WCAG 1.4.1).
- Motion 120–280 ms, ease-out, transform/opacity only; a spring "pop" on a right answer, a short shake on a wrong one.
  All of it is off under `prefers-reduced-motion`.
- **Haptics** on Android (`navigator.vibrate`: 15 ms right, 30-50-30 wrong); iOS Safari has no Vibration API,
  so haptics are never the only signal. Toggle in Progress.
- **No auto-advance** after a wrong answer: the explanation (해설, Korean + Russian) stays until "Дальше".

## Learning
- **FSRS** scheduler (ts-fsrs, 90 % target retention, the Anki default).
- **Multiple choice is graded automatically** (wrong = Again, right but slow > 45 s = Hard, else Good); words that were
  answered right ask "Снова / Трудно / Знаю" with the next interval on each button.
- Sessions of **20 answers** (5–10 minutes); due reviews before new cards; daily limit for new cards (adjustable).
- Missed cards come back **in the same session** a few cards later, and again by schedule.
- Words are taught in **frequency order** from the bank's own texts, each shown inside a real exam question.
  Every known word in a question is underlined and opens its translation on tap.
- **Mock exam** as the real one: same mix of question kinds, 40-minute countdown, no feedback until the end,
  question palette, warnings at 5 and 1 minute, state saved on every answer (survives closing the app).
  Mistakes go to review.

## PWA
- Manifest with `standalone`, 192/512 icons and a maskable 512 icon, `apple-touch-icon` 180 px, light/dark `theme-color`,
  `viewport-fit=cover` with safe-area padding.
- **Install**: Android's `beforeinstallprompt` is kept and offered from our own button; iOS gets a "Поделиться → На экран
  «Домой»" hint. Both appear only after the first studied card, never on first load, and hide for 2 weeks when dismissed.
- **Offline**: the service worker precaches the whole app (the question bank is inside the script) and all pictures,
  versioned per build. A new version waits for "Обновить" in a toast, so a running exam is never reloaded.
  `navigator.storage.persist()` lowers the risk of the browser evicting progress.

## Type
- Pretendard (Hangul + Latin + Cyrillic in one family), system fonts as fallback; body 16–17 px, questions 19 px, line height 1.5–1.65.
- `word-break: keep-all` on Korean so lines break between words (어절), never inside one; `lang` set on every Korean and Russian block.

## Sources
- WCAG 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Apple HIG accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Android touch targets: https://support.google.com/accessibility/android/answer/7101858
- PWA install: https://web.dev/learn/pwa/installation-prompt, https://web.dev/customize-install
- Service worker updates: https://developer.chrome.com/docs/workbox/handling-service-worker-updates
- FSRS / Anki: https://docs.ankiweb.net/faqs/what-spaced-repetition-algorithm, https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-optimal-retention
- Vibration API support: https://caniuse.com/mdn-api_navigator_vibrate
- Animation durations: https://nngroup.com/articles/animation-duration
- Korean line breaking: https://drafts.csswg.org/css-text-4/
- Pretendard: https://github.com/orioncactus/pretendard
