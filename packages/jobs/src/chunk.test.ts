import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns empty for blank input", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("overlaps consecutive windows", () => {
    const chunks = chunkText("abcdefghij", 4, 1);
    expect(chunks[0]).toBe("abcd");
    expect(chunks[1]?.startsWith("d")).toBe(true);
  });
});
