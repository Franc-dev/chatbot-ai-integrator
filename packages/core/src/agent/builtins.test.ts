import { describe, expect, it } from "vitest";
import { DEFAULT_BUILTIN_TOOLS, resolveBuiltinTools } from "./builtins";

describe("resolveBuiltinTools", () => {
  it("defaults every built-in on", () => {
    expect(resolveBuiltinTools(null)).toEqual(DEFAULT_BUILTIN_TOOLS);
  });

  it("treats only explicit false as off", () => {
    expect(resolveBuiltinTools({ searchKnowledge: false, collectLead: true })).toMatchObject({
      searchKnowledge: false,
      collectLead: true,
      handoffToHuman: true,
      getConversationContext: true,
    });
  });
});
