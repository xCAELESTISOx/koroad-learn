import { describe, expect, it } from "vitest";
import { drawExam, pick, points, score } from "./exam";
import type { ExamConfig, Kind, Question } from "./types";

const q = (n: number, kind: Kind, ans: number[]): Question => ({
  id: `q${n}`,
  no: n,
  kind,
  ko: { q: "", opts: ["a", "b", "c", "d"] },
  ru: { q: "", opts: ["a", "b", "c", "d"] },
  ans,
  src: {},
});
const cfg: ExamConfig = { count: 4, minutes: 40, pass: 5, mix: { text: 3, sign: 1 }, points: { text: 2, text2: 3, sign: 2 } };
const bank = [q(1, "text", [0]), q(2, "text", [1]), q(3, "text", [0, 1]), q(4, "text", [2]), q(5, "sign", [3]), q(6, "sign", [0])];

describe("drawExam", () => {
  it("draws the configured mix", () => {
    const e = drawExam(bank, cfg, 0);
    const kinds = e.ids.map((id) => bank.find((b) => b.id === id)!.kind);
    expect(kinds.filter((k) => k === "text")).toHaveLength(3);
    expect(kinds.filter((k) => k === "sign")).toHaveLength(1);
    expect(e.endsAt).toBe(40 * 60_000);
    expect(new Set(e.ids).size).toBe(4);
  });
});

describe("score", () => {
  it("counts points per kind, two-answer text worth more, partial answers wrong", () => {
    const byId = new Map(bank.map((b) => [b.id, b]));
    const e = { ids: ["q1", "q3", "q5", "q2"], order: {}, answers: { q1: [0], q3: [1, 0], q5: [3], q2: [1, 2] }, index: 0, endsAt: 0, done: false };
    const r = score(e, byId, cfg);
    expect(r.results).toEqual([true, true, true, false]);
    expect(r.score).toBe(2 + 3 + 2);
    expect(r.passed).toBe(true);
    expect(points(bank[2]!, cfg)).toBe(3);
  });
});

describe("pick", () => {
  it("replaces for one answer, toggles up to two", () => {
    expect(pick([1], 2, 1)).toEqual([2]);
    expect(pick([1], 2, 2)).toEqual([1, 2]);
    expect(pick([1, 2], 3, 2)).toEqual([1, 2]);
    expect(pick([1, 2], 1, 2)).toEqual([2]);
  });
});
