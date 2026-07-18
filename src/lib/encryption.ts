import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret === "keyguard-default-dev-key-change-in-prod") {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_RUNTIME !== "edge") {
      throw new Error("ENCRYPTION_KEY must be set to a strong random value in production");
    }
  }
  return scryptSync(secret || "keyguard-default-dev-key-change-in-prod", "keyguard-salt", KEY_LENGTH);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param {string} plaintext - The plaintext string to encrypt.
 * @returns {{ encrypted: string; iv: string; tag: string }} An object containing the hex-encoded ciphertext, initialization vector (IV), and authentication tag.
 * @throws {Error} Throws an error if ENCRYPTION_KEY is insecure in production.
 */
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

/**
 * Decrypts a hex-encoded ciphertext back into its plaintext string.
 *
 * @param {string} encryptedHex - The hex-encoded encrypted string.
 * @param {string} ivHex - The hex-encoded initialization vector (IV) used during encryption.
 * @param {string} tagHex - The hex-encoded authentication tag used for verification.
 * @returns {string} The decrypted plaintext string.
 * @throws {Error} Throws an error if decryption or authentication fails, or if ENCRYPTION_KEY is insecure in production.
 */
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
