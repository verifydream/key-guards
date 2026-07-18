import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createToken, verifyToken, setAuthCookie, removeAuthCookie, getCurrentUser } from '../auth';

// Mock next/headers
const mockCookieStore = {
  set: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe('auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createToken and verifyToken', () => {
    it('creates and verifies a valid token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = await createToken(payload);

      expect(typeof token).toBe('string');

      const verifiedPayload = await verifyToken(token);
      expect(verifiedPayload).not.toBeNull();
      expect(verifiedPayload?.userId).toBe(payload.userId);
      expect(verifiedPayload?.email).toBe(payload.email);
    });

    it('returns null for an invalid token', async () => {
      const invalidToken = 'this.is.invalid';
      const result = await verifyToken(invalidToken);
      expect(result).toBeNull();
    });

    it('throws error in production if JWT_SECRET is default', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_RUNTIME = 'nodejs';
      process.env.JWT_SECRET = 'keyguard-jwt-dev-secret-change-in-prod';

      await expect(createToken({ userId: '1', email: 'e' })).rejects.toThrow('JWT_SECRET must be set to a strong random value in production');
    });

    it('throws error in production if JWT_SECRET is not set', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_RUNTIME = 'nodejs';
      delete process.env.JWT_SECRET;

      await expect(createToken({ userId: '1', email: 'e' })).rejects.toThrow('JWT_SECRET must be set to a strong random value in production');
    });
  });

  describe('cookie handling', () => {
    it('sets the auth cookie correctly', async () => {
      const token = 'my-fake-token';
      await setAuthCookie(token);

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'keyguard-token',
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });

    it('removes the auth cookie correctly', async () => {
      await removeAuthCookie();
      expect(mockCookieStore.delete).toHaveBeenCalledWith('keyguard-token');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null if no token is present', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns the user payload if a valid token is present', async () => {
      const payload = { userId: '456', email: 'user@test.com' };
      const token = await createToken(payload);
      mockCookieStore.get.mockReturnValue({ value: token });

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.userId).toBe(payload.userId);
      expect(user?.email).toBe(payload.email);
    });

    it('returns null if the token is present but invalid', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-token-here' });
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });
});
