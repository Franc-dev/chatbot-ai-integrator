export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
};

export type ModelPrice = {
  inputPerMToken: number;
  outputPerMToken: number;
};

/** Cost in micro-USD (1e-6 USD). */
export function costMicros(usage: TokenUsage, price: ModelPrice): number {
  const billableInput = Math.max(0, usage.inputTokens - (usage.cachedTokens ?? 0) * 0.5);
  const input = (billableInput / 1_000_000) * price.inputPerMToken;
  const output = (usage.outputTokens / 1_000_000) * price.outputPerMToken;
  return Math.round((input + output) * 1_000_000);
}

export function formatUsd(micros: number): string {
  return `$${(micros / 1_000_000).toFixed(4)}`;
}

export const FALLBACK_PRICES: Record<string, ModelPrice> = {
  "openai/gpt-4.1-mini": { inputPerMToken: 400_000, outputPerMToken: 1_600_000 },
  "openai/gpt-4.1": { inputPerMToken: 2_000_000, outputPerMToken: 8_000_000 },
  "anthropic/claude-sonnet-4.6": { inputPerMToken: 3_000_000, outputPerMToken: 15_000_000 },
  default: { inputPerMToken: 1_000_000, outputPerMToken: 3_000_000 },
};

export function priceFor(modelRef: string): ModelPrice {
  return FALLBACK_PRICES[modelRef] ?? FALLBACK_PRICES.default!;
}
