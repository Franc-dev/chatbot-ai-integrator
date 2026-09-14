import { describe, expect, it } from "vitest";
import { customModelRef, modelsForCustomCredential, parseModelIds } from "@signal/contract";
import { modelIdFromRef, parseModelRef, routeChatProvider } from "./index";

describe("parseModelRef", () => {
  it("keeps known providers including custom", () => {
    expect(parseModelRef("custom/local-qwen-7b")).toEqual({
      provider: "custom",
      model: "local-qwen-7b",
    });
  });

  it("treats bare local ids as openai until a custom credential routes them", () => {
    expect(parseModelRef("local-qwen-7b")).toEqual({
      provider: "openai",
      model: "local-qwen-7b",
    });
  });
});

describe("routeChatProvider", () => {
  it("uses the custom key base-URL path for custom model refs", () => {
    expect(routeChatProvider("custom/local-gemma4")).toEqual({
      provider: "custom",
      model: "local-gemma4",
    });
  });

  it("lets a custom credential win even when modelRef has no custom/ prefix", () => {
    expect(routeChatProvider("local-qwen-7b", "custom")).toEqual({
      provider: "custom",
      model: "local-qwen-7b",
    });
  });

  it("does not treat a z.ai credential as the custom server", () => {
    expect(routeChatProvider("zai/glm-4.6", "zai")).toEqual({
      provider: "zai",
      model: "glm-4.6",
    });
  });
});

describe("modelIdFromRef", () => {
  it("strips only a known provider prefix", () => {
    expect(modelIdFromRef("custom/local-gemma4-12b")).toBe("local-gemma4-12b");
    expect(modelIdFromRef("openrouter/openai/gpt-4.1-mini")).toBe("openai/gpt-4.1-mini");
  });
});

describe("custom model ids", () => {
  it("splits comma lists and strips a custom/ prefix", () => {
    expect(parseModelIds("local-qwen-7b, custom/local-gemma4")).toEqual([
      "local-qwen-7b",
      "local-gemma4",
    ]);
  });

  it("fills empty credential lists with local Qwen/Gemma ids", () => {
    expect(modelsForCustomCredential([])).toEqual([
      "local-gemma4",
      "local-gemma4-12b",
      "local-qwen-7b",
      "local-qwen-3b",
    ]);
    expect(customModelRef("local-qwen-7b")).toBe("custom/local-qwen-7b");
  });
});
