import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret === "keyguard-default-dev-key-change-in-prod") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY must be set to a strong random value in production");
    }
  }
  return scryptSync(secret || "keyguard-default-dev-key-change-in-prod", "keyguard-salt", KEY_LENGTH);
}

export function encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const key = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(encryptedHex: string, ivHex: string, tagHex: string): string {
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

// ponytail: client-side encryption via SubtleCrypto for browser; add when migrating to Supabase
