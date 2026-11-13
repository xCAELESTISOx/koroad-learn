import { describe, expect, it } from "vitest";
import { distractors } from "./choice";
import type { Word } from "./types";

const w = (id: string, pos: string, qs: string[], ru = id): Word => ({ id, ko: id, ru, pos, qs, forms: [] });

describe("distractors", () => {
  const all = [w("a", "noun", ["q1"]), w("b", "noun", ["q1"]), w("c", "noun", ["q2"]), w("d", "verb", ["q1"]), w("e", "noun", ["q3"]), w("f", "noun", ["q1"], "a")];
  it("gives three, never the word itself or a synonym in translation", () => {
    const d = distractors(all[0]!, all);
    expect(d).toHaveLength(3);
    expect(d.map((x) => x.id)).not.toContain("a");
    expect(d.map((x) => x.id)).not.toContain("f");
  });
  it("prefers the same part of speech", () => {
    expect(distractors(all[0]!, all).every((x) => x.pos === "noun")).toBe(true);
  });
});
