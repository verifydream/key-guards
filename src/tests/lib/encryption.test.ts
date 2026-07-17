import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '../../lib/encryption';

describe('encryption module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encrypt and decrypt', () => {
    it('encrypts and decrypts a string successfully', () => {
      process.env.ENCRYPTION_KEY = 'test-secret-key-that-is-long-enough';
      const plaintext = 'sensitive data';
      const { encrypted, iv, tag } = encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
      expect(typeof iv).toBe('string');
      expect(typeof tag).toBe('string');

      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe(plaintext);
    });

    it('returns different encrypted outputs for the same input (due to random IV)', () => {
      process.env.ENCRYPTION_KEY = 'test-secret';
      const plaintext = 'sensitive data';

      const result1 = encrypt(plaintext);
      const result2 = encrypt(plaintext);

      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('works with the default fallback key in development mode', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'development';

      const plaintext = 'dev data';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(plaintext);
    });

    it('throws an error in production if the default key is used', () => {
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'production';
      process.env.NEXT_RUNTIME = 'nodejs'; // not edge

      expect(() => encrypt('data')).toThrowError('ENCRYPTION_KEY must be set to a strong random value in production');
    });

    it('throws an error if decryption is tampered with (invalid tag)', () => {
      process.env.ENCRYPTION_KEY = 'test-secret';
      const plaintext = 'secret data';
      const { encrypted, iv, tag } = encrypt(plaintext);

      // Tamper with the tag (change the last character)
      const tamperedTag = tag.slice(0, -1) + (tag.endsWith('0') ? '1' : '0');

      expect(() => decrypt(encrypted, iv, tamperedTag)).toThrow();
    });
  });
});
