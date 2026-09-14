export function formatUsd(micros: number): string {
  const usd = Number(micros) / 1_000_000;
  if (!Number.isFinite(usd) || usd === 0) return "$0.0000";
  if (Math.abs(usd) < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}
