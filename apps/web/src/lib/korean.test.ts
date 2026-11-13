import { describe, expect, it } from "vitest";
import { buildLexicon, highlight, segment } from "./korean";

const lex = buildLexicon([
  { id: "w1", ko: "교차로", forms: ["교차로"] },
  { id: "w2", ko: "좌회전하다", forms: ["좌회전하", "좌회전한"] },
  { id: "w3", ko: "좌회전", forms: ["좌회전"] },
  { id: "w4", ko: "녹색", forms: ["녹색"] },
  { id: "w5", ko: "등화", forms: ["등화"] },
]);

describe("segment", () => {
  it("finds words with particles and endings attached", () => {
    const pieces = segment(lex, "교차로에서 좌회전하려는 경우");
    expect(pieces.filter((p) => p.word).map((p) => [p.text, p.word])).toEqual([
      ["교차로", "w1"],
      ["좌회전하", "w2"],
    ]);
  });
  it("prefers the longest spelling", () => {
    expect(segment(lex, "좌회전한다").find((p) => p.word)?.word).toBe("w2");
    expect(segment(lex, "좌회전 신호").find((p) => p.word)?.word).toBe("w3");
  });
  it("finds the parts of a compound", () => {
    expect(segment(lex, "녹색등화에").filter((p) => p.word).map((p) => p.word)).toEqual(["w4", "w5"]);
  });
  it("gives the text back unchanged", () => {
    const text = "① 교차로 직전에서, 녹색등화에 (   ) 진행한다.";
    expect(segment(lex, text).map((p) => p.text).join("")).toBe(text);
  });
});

describe("highlight", () => {
  it("marks every spelling of one word", () => {
    const hits = highlight("좌회전한 뒤 다시 좌회전하려면", { ko: "좌회전하다", forms: ["좌회전하", "좌회전한"] }).filter((p) => p.word);
    expect(hits.map((p) => p.text)).toEqual(["좌회전한", "좌회전하"]);
  });
});
