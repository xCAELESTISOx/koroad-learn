import type { Progress } from "./store";
import type { Word } from "./types";

// Words go to KQuiz through Claude: the app copies the list with a short brief, and Claude, with the
// KQuiz connector, checks what is already in the deck, writes examples and links similar words.

/** Puts a word on the list unless it is there already or was sent before. */
export function addToList(p: Progress, id: string) {
  if (!p.kquiz.list.includes(id) && !p.kquiz.sent.includes(id)) p.kquiz.list.push(id);
}

export function removeFromList(p: Progress, id: string) {
  p.kquiz.list = p.kquiz.list.filter((x) => x !== id);
}

/** After pasting into Claude: the words leave the list and are not offered again. */
export function markSent(p: Progress) {
  p.kquiz.sent.push(...p.kquiz.list.filter((id) => !p.kquiz.sent.includes(id)));
  p.kquiz.list = [];
}

export function wordLine(w: Word): string {
  return `${w.ko} — ${w.ru}${w.hanja ? ` (${w.hanja})` : ""}`;
}

/** The text to paste into Claude: the brief, then one word per line. */
export function claudePrompt(words: Word[]): string {
  return [
    "Добавь в KQuiz слова из подготовки к теории на корейские права (2종 보통, банк вопросов 도로교통공단).",
    "",
    "- Сначала найди через find_cards, какие из них уже есть в колоде, и их не добавляй.",
    "- К каждому новому слову: 3 примера на тему вождения и правил дорожного движения, корни-ханча, заметки.",
    "- Свяжи похожие и легко путаемые слова (link_similar), в том числе с уже имеющимися в колоде.",
    "- Тег «права» и тема слова (знаки, перекрёсток, штрафы и т. п.).",
    "- Перевод после тире дан в смысле экзамена; если у слова есть более частое значение, укажи и его.",
    "",
    `Слова (${words.length}):`,
    ...words.map(wordLine),
  ].join("\n");
}

/** Clipboard with a fallback for browsers that refuse the async API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
