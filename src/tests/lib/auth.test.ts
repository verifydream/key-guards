import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createToken, verifyToken, setAuthCookie, removeAuthCookie, getCurrentUser } from '../../lib/auth';
import { cookies } from 'next/headers';

// We mock next/headers so we can intercept cookies() calls
vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(),
  };
});

describe('auth module', () => {
  const originalEnv = process.env;

  // Create a mock store for cookies
  let cookieStore: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = 'test-jwt-secret-key';

    // Setup cookie mock
    cookieStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(cookies).mockResolvedValue(cookieStore as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('createToken and verifyToken', () => {
    it('creates a token and verifies it successfully', async () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = await createToken(payload);

      expect(typeof token).toBe('string');

      const verified = await verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
    });

    it('returns null for an invalid token', async () => {
      const verified = await verifyToken('invalid.token.here');
      expect(verified).toBeNull();
    });

    it('works with the default fallback secret in development mode', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'development';

      const payload = { userId: 'dev', email: 'dev@example.com' };
      const token = await createToken(payload);
      const verified = await verifyToken(token);

      expect(verified?.userId).toBe('dev');
    });

    it('throws an error in production if the default secret is used', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';
      process.env.NEXT_RUNTIME = 'nodejs';

      await expect(createToken({ userId: '1', email: 'a@a.com' })).rejects.toThrow('JWT_SECRET must be set to a strong random value in production');
    });
  });

  describe('setAuthCookie', () => {
    it('sets a secure httpOnly cookie with the token', async () => {
      process.env.COOKIE_SECURE = 'true';
      await setAuthCookie('mock-token');

      expect(cookieStore.set).toHaveBeenCalledWith(
        'keyguard-token',
        'mock-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });
  });

  describe('removeAuthCookie', () => {
    it('deletes the auth cookie', async () => {
      await removeAuthCookie();
      expect(cookieStore.delete).toHaveBeenCalledWith('keyguard-token');
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user payload if a valid token cookie exists', async () => {
      const payload = { userId: 'u1', email: 'u1@test.com' };
      const token = await createToken(payload);

      cookieStore.get.mockReturnValue({ value: token });

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.userId).toBe('u1');
      expect(user?.email).toBe('u1@test.com');
    });

    it('returns null if no token cookie exists', async () => {
      cookieStore.get.mockReturnValue(undefined);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns null if token cookie is invalid', async () => {
      cookieStore.get.mockReturnValue({ value: 'invalid-token' });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
