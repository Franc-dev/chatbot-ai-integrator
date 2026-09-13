import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

export function decodeMasterKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  }
  return key;
}

export type SealedSecret = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
  keyVersion: number;
  last4: string;
  fingerprint: string;
};

export function sealSecret(plain: string, masterKey: Buffer, keyVersion = 1): SealedSecret {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext,
    iv,
    tag,
    keyVersion,
    last4: plain.slice(-4),
    fingerprint: createHash("sha256").update(plain).digest("hex"),
  };
}

export function openSecret(
  sealed: Pick<SealedSecret, "ciphertext" | "iv" | "tag">,
  masterKey: Buffer,
): string {
  const decipher = createDecipheriv(ALGO, masterKey, Buffer.from(sealed.iv));
  decipher.setAuthTag(Buffer.from(sealed.tag));
  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext)),
    decipher.final(),
  ]).toString("utf8");
}
