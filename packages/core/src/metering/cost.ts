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

/** Cost in micro-USD (1e-6 USD). Prices are micro-USD per million tokens. */
export function costMicros(usage: TokenUsage, price: ModelPrice): number {
  const billableInput = Math.max(0, usage.inputTokens - (usage.cachedTokens ?? 0) * 0.5);
  return Math.round(
    (billableInput * price.inputPerMToken + usage.outputTokens * price.outputPerMToken) / 1_000_000,
  );
}

export function formatUsd(micros: number): string {
  const usd = micros / 1_000_000;
  if (usd === 0) return "$0.0000";
  if (Math.abs(usd) < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

export const FALLBACK_PRICES: Record<string, ModelPrice> = {
  "openai/gpt-4.1-mini": { inputPerMToken: 400_000, outputPerMToken: 1_600_000 },
  "openai/gpt-4.1": { inputPerMToken: 2_000_000, outputPerMToken: 8_000_000 },
  "anthropic/claude-sonnet-4.6": { inputPerMToken: 3_000_000, outputPerMToken: 15_000_000 },
  "openrouter/openai/gpt-4.1-mini": { inputPerMToken: 400_000, outputPerMToken: 1_600_000 },
  "google/gemini-2.5-flash": { inputPerMToken: 300_000, outputPerMToken: 2_500_000 },
  "google/gemini-2.0-flash": { inputPerMToken: 100_000, outputPerMToken: 400_000 },
  default: { inputPerMToken: 400_000, outputPerMToken: 1_600_000 },
};

export function priceFor(modelRef: string): ModelPrice {
  return FALLBACK_PRICES[modelRef] ?? FALLBACK_PRICES.default!;
}
