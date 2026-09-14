import { describe, expect, it } from "vitest";
import { costMicros, formatUsd } from "./cost";

describe("costMicros", () => {
  it("computes micro-USD from per-million micro prices", () => {
    const micros = costMicros(
      { inputTokens: 1_000_000, outputTokens: 500_000 },
      { inputPerMToken: 1_000_000, outputPerMToken: 2_000_000 },
    );
    expect(micros).toBe(2_000_000);
    expect(formatUsd(micros)).toBe("$2.0000");
  });

  it("keeps a short OpenRouter turn far under a dollar", () => {
    const micros = costMicros(
      { inputTokens: 189, outputTokens: 16 },
      { inputPerMToken: 400_000, outputPerMToken: 1_600_000 },
    );
    expect(micros).toBe(101);
    expect(formatUsd(micros)).toBe("$0.000101");
  });

  it("discounts cached input tokens by half", () => {
    const full = costMicros(
      { inputTokens: 1_000_000, outputTokens: 0 },
      { inputPerMToken: 2_000_000, outputPerMToken: 0 },
    );
    const cached = costMicros(
      { inputTokens: 1_000_000, outputTokens: 0, cachedTokens: 1_000_000 },
      { inputPerMToken: 2_000_000, outputPerMToken: 0 },
    );
    expect(cached).toBe(full / 2);
  });
});
