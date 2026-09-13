import { describe, expect, it } from "vitest";
import { costMicros, formatUsd } from "./cost";

describe("costMicros", () => {
  it("computes micro-USD from token prices", () => {
    const micros = costMicros(
      { inputTokens: 1_000_000, outputTokens: 500_000 },
      { inputPerMToken: 1, outputPerMToken: 2 },
    );
    expect(micros).toBe(2_000_000);
    expect(formatUsd(micros)).toBe("$2.0000");
  });

  it("discounts cached input tokens by half", () => {
    const full = costMicros(
      { inputTokens: 1_000_000, outputTokens: 0 },
      { inputPerMToken: 2, outputPerMToken: 0 },
    );
    const cached = costMicros(
      { inputTokens: 1_000_000, outputTokens: 0, cachedTokens: 1_000_000 },
      { inputPerMToken: 2, outputPerMToken: 0 },
    );
    expect(cached).toBe(full / 2);
  });
});
