import { describe, expect, it } from "vitest";
import { decodeMasterKey, openSecret, sealSecret } from "./vault";
import { randomBytes } from "node:crypto";

describe("vault", () => {
  const key = decodeMasterKey(randomBytes(32).toString("base64"));

  it("round-trips a secret", () => {
    const sealed = sealSecret("sk-live-secret-key-1234", key);
    expect(openSecret(sealed, key)).toBe("sk-live-secret-key-1234");
    expect(sealed.last4).toBe("1234");
    expect(sealed.fingerprint).toHaveLength(64);
  });

  it("rejects a short master key", () => {
    expect(() => decodeMasterKey(Buffer.from("too-short").toString("base64"))).toThrow(
      /32 bytes/,
    );
  });

  it("fails on a tampered tag", () => {
    const sealed = sealSecret("hello", key);
    sealed.tag[0] = (sealed.tag[0]! ^ 0xff) as number;
    expect(() => openSecret(sealed, key)).toThrow();
  });
});
