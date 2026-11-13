import { describe, expect, it } from "vitest";
import { addToList, claudePrompt, markSent, removeFromList } from "./kquiz";
import { normalize } from "./store";
import type { Word } from "./types";

const w = (id: string, ko: string, ru: string, hanja?: string): Word => ({ id, ko, ru, forms: [ko], qs: [], ...(hanja ? { hanja } : {}) });

describe("KQuiz list", () => {
  it("seeds the list with words already studied", () => {
    expect(normalize({ w: { w1: {}, w2: {} } }).kquiz).toEqual({ list: ["w1", "w2"], sent: [] });
  });
  it("adds once and never re-adds a sent word", () => {
    const p = normalize(null);
    addToList(p, "w1");
    addToList(p, "w1");
    expect(p.kquiz.list).toEqual(["w1"]);
    markSent(p);
    addToList(p, "w1");
    expect(p.kquiz).toEqual({ list: [], sent: ["w1"] });
  });
  it("removes a word", () => {
    const p = normalize(null);
    addToList(p, "w1");
    addToList(p, "w2");
    removeFromList(p, "w1");
    expect(p.kquiz.list).toEqual(["w2"]);
  });
  it("writes the brief and one line per word", () => {
    const text = claudePrompt([w("w1", "도로", "дорога", "道路"), w("w2", "운전", "вождение")]);
    expect(text).toContain("find_cards");
    expect(text).toContain("link_similar");
    expect(text.split("\n").slice(-3)).toEqual(["Слова (2):", "도로 — дорога (道路)", "운전 — вождение"]);
  });
});
