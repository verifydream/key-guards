import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt } from '../encryption';

describe('encryption', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('encrypts and decrypts a string successfully', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key-that-is-long-enough';

    const plaintext = 'This is a super secret message.';
    const { encrypted, iv, tag } = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(typeof encrypted).toBe('string');
    expect(typeof iv).toBe('string');
    expect(typeof tag).toBe('string');

    const decrypted = decrypt(encrypted, iv, tag);
    expect(decrypted).toBe(plaintext);
  });

  it('throws an error in production if the ENCRYPTION_KEY is default', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.ENCRYPTION_KEY = 'keyguard-default-dev-key-change-in-prod';

    expect(() => encrypt('test')).toThrowError('ENCRYPTION_KEY must be set to a strong random value in production');
  });

  it('throws an error in production if the ENCRYPTION_KEY is not set', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_RUNTIME = 'nodejs';
    delete process.env.ENCRYPTION_KEY;

    expect(() => encrypt('test')).toThrowError('ENCRYPTION_KEY must be set to a strong random value in production');
  });

  it('fails to decrypt if the ciphertext is tampered with', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key';
    const { encrypted, iv, tag } = encrypt('my secret');

    const tamperedEncrypted = encrypted.substring(0, encrypted.length - 2) + '00';

    expect(() => decrypt(tamperedEncrypted, iv, tag)).toThrow();
  });

  it('fails to decrypt if the tag is incorrect', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key';
    const { encrypted, iv, tag } = encrypt('my secret');

    const tamperedTag = tag.substring(0, tag.length - 2) + '00';

    expect(() => decrypt(encrypted, iv, tamperedTag)).toThrow();
  });

  it('fails to decrypt if the IV is incorrect', () => {
    process.env.ENCRYPTION_KEY = 'test-secret-key';
    const { encrypted, iv, tag } = encrypt('my secret');

    const tamperedIv = iv.substring(0, iv.length - 2) + '00';

    expect(() => decrypt(encrypted, tamperedIv, tag)).toThrow();
  });
});
