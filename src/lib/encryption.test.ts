import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from './encryption';

describe('Encryption Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should successfully encrypt and decrypt a string (roundtrip)', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key-12345';
    const plaintext = 'super-secret-api-key';

    const { encrypted, iv, tag } = encrypt(plaintext);

    expect(encrypted).toBeDefined();
    expect(iv).toBeDefined();
    expect(tag).toBeDefined();

    expect(encrypted).not.toBe(plaintext);

    const decrypted = decrypt(encrypted, iv, tag);
    expect(decrypted).toBe(plaintext);
  });

  it('should reject tampered ciphertext with a tag mismatch error', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key-12345';
    const plaintext = 'super-secret-api-key';
    const { encrypted, iv, tag } = encrypt(plaintext);

    // Tamper with the ciphertext (change the last character)
    const tamperedEncrypted = encrypted.slice(0, -1) + (encrypted.endsWith('0') ? '1' : '0');

    expect(() => decrypt(tamperedEncrypted, iv, tag)).toThrow();
  });

  it('should reject tampered auth tag', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key-12345';
    const plaintext = 'super-secret-api-key';
    const { encrypted, iv, tag } = encrypt(plaintext);

    // Tamper with the tag
    const tamperedTag = tag.slice(0, -1) + (tag.endsWith('0') ? '1' : '0');

    expect(() => decrypt(encrypted, iv, tamperedTag)).toThrow();
  });

  it('should throw an error in production if ENCRYPTION_KEY is not set or is default', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_RUNTIME = 'nodejs';

    // Case 1: No secret
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be set to a strong random value in production');

    // Case 2: Default secret
    process.env.ENCRYPTION_KEY = 'keyguard-default-dev-key-change-in-prod';
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be set to a strong random value in production');
  });

  it('should use default key in non-production environments when secret is not provided', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENCRYPTION_KEY;

    const plaintext = 'test-value';
    const { encrypted, iv, tag } = encrypt(plaintext);
    const decrypted = decrypt(encrypted, iv, tag);

    expect(decrypted).toBe(plaintext);
  });

  it('should not throw in production if NEXT_RUNTIME is edge (even if default/no key)', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_RUNTIME = 'edge';
    delete process.env.ENCRYPTION_KEY;

    const plaintext = 'test-edge-runtime';
    expect(() => {
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe(plaintext);
    }).not.toThrow();
  });
});
