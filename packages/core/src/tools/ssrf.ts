import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata"]);

function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("::ffff:127.")) {
    return true;
  }
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const parts = v4.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid tool URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Tool URL must be http(s)");
  }
  if (url.username || url.password) {
    throw new Error("Tool URL must not include credentials");
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Tool URL host is not allowed");
  }
  if (isIP(host) && isPrivateIp(host)) {
    throw new Error("Tool URL resolves to a private address");
  }
  const records = await lookup(host, { all: true });
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error("Tool URL resolves to a private address");
    }
  }
  return url;
}

export async function fetchSafe(
  raw: string,
  init: RequestInit,
  opts: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<Response> {
  const url = await assertSafeUrl(raw);
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      redirect: "error",
      signal: controller.signal,
    });
    const maxBytes = opts.maxBytes ?? 256_000;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw new Error("Tool response exceeded size cap");
    }
    return new Response(buf, { status: res.status, headers: res.headers });
  } finally {
    clearTimeout(timer);
  }
}

export { isPrivateIp };
