import { describe, expect, it } from "vitest";
import { rrf } from "./rrf";

describe("reciprocal rank fusion", () => {
  it("promotes items that appear in both lists", () => {
    const a = [
      { id: "1", content: "a", sourceId: "s", score: 1 },
      { id: "2", content: "b", sourceId: "s", score: 0.5 },
    ];
    const b = [
      { id: "2", content: "b", sourceId: "s", score: 1 },
      { id: "3", content: "c", sourceId: "s", score: 0.4 },
    ];
    const fused = rrf([a, b]);
    expect(fused[0]?.id).toBe("2");
  });
});
