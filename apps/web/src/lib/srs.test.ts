import { describe, expect, it } from "vitest";
import { autoGrade, formatIn, isDue, level, Rating, review } from "./srs";

describe("review", () => {
  it("brings a forgotten card back soon and a known one later", () => {
    const now = Date.UTC(2026, 10, 13);
    const again = review(undefined, Rating.Again, now);
    const good = review(undefined, Rating.Good, now);
    expect(again.due).toBeLessThan(good.due);
    expect(again.wrong).toBe(1);
    const later = review(good, Rating.Good, good.due);
    expect(later.due - good.due).toBeGreaterThan(good.due - now);
    expect(isDue(later, now)).toBe(false);
  });
  it("survives a JSON round trip", () => {
    const s = JSON.parse(JSON.stringify(review(undefined, Rating.Good, 0)));
    expect(() => review(s, Rating.Good, s.due)).not.toThrow();
  });
});

describe("autoGrade", () => {
  it("grades multiple choice", () => {
    expect(autoGrade(false, 1, 10)).toBe(Rating.Again);
    expect(autoGrade(true, 20, 10)).toBe(Rating.Hard);
    expect(autoGrade(true, 5, 10)).toBe(Rating.Good);
  });
});

describe("helpers", () => {
  it("formats intervals in Russian", () => {
    expect(formatIn(5 * 60_000)).toBe("5 мин");
    expect(formatIn(3 * 86_400_000)).toBe("3 дн");
  });
  it("levels", () => expect(level(undefined)).toBe(0));
});
