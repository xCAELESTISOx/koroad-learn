import { describe, expect, it } from "vitest";
import { buildQueue, counts, requeue } from "./queue";
import { review, Rating } from "./srs";

describe("buildQueue", () => {
  const now = 1_000_000_000_000;
  const store = { a: { ...review(undefined, Rating.Good, now - 10 * 86_400_000) }, b: review(undefined, Rating.Good, now) };
  it("puts due cards first, then new ones up to the daily limit", () => {
    const q = buildQueue(["a", "b", "c", "d", "e"], store, 2, 1, now);
    expect(q).toEqual(["a", "c"]);
    expect(counts(["a", "b", "c", "d", "e"], store, 2, 1, now)).toMatchObject({ due: 1, seen: 2, fresh: 1 });
  });
  it("requeues a miss a few places later", () => {
    expect(requeue(["a", "b", "c", "d"], 0, "a", 2)).toEqual(["a", "b", "c", "a", "d"]);
  });
});
