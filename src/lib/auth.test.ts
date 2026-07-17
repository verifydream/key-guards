import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createToken, verifyToken, setAuthCookie, removeAuthCookie, getCurrentUser } from './auth';
import * as jose from 'jose';
import { cookies } from 'next/headers';

vi.mock('jose', () => {
  return {
    SignJWT: class {
      setProtectedHeader = vi.fn().mockReturnThis();
      setIssuedAt = vi.fn().mockReturnThis();
      setExpirationTime = vi.fn().mockReturnThis();
      sign = vi.fn().mockResolvedValue('mocked-token');
    },
    jwtVerify: vi.fn()
  };
});

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn().mockResolvedValue({
      set: vi.fn(),
      delete: vi.fn(),
      get: vi.fn()
    })
  };
});

describe('Auth Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createToken', () => {
    it('should create a token with correct payload', async () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = await createToken(payload);

      expect(token).toBe('mocked-token');
    });

    it('should throw an error in production if JWT_SECRET is not set', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_RUNTIME = 'nodejs';
      delete process.env.JWT_SECRET;

      await expect(createToken({ userId: '1', email: 'e' })).rejects.toThrow('JWT_SECRET must be set to a strong random value in production');
    });
  });

  describe('verifyToken', () => {
    it('should return payload if valid', async () => {
      const mockPayload = { userId: '123', email: 'test@example.com' };
      vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: mockPayload } as any);

      const payload = await verifyToken('valid-token');
      expect(payload).toEqual(mockPayload);
    });

    it('should return null if invalid', async () => {
      vi.mocked(jose.jwtVerify).mockRejectedValue(new Error('Invalid token'));

      const payload = await verifyToken('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('setAuthCookie', () => {
    it('should set cookie with secure=false when COOKIE_SECURE is not true', async () => {
      process.env.COOKIE_SECURE = 'false';
      await setAuthCookie('some-token');

      const cookieStore = await cookies();
      expect(cookieStore.set).toHaveBeenCalledWith(
        'keyguard-token',
        'some-token',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/'
        })
      );
    });

    it('should set cookie with secure=true when COOKIE_SECURE is true', async () => {
      process.env.COOKIE_SECURE = 'true';
      await setAuthCookie('some-token');

      const cookieStore = await cookies();
      expect(cookieStore.set).toHaveBeenCalledWith(
        'keyguard-token',
        'some-token',
        expect.objectContaining({ secure: true })
      );
    });
  });

  describe('removeAuthCookie', () => {
    it('should delete the cookie', async () => {
      await removeAuthCookie();
      const cookieStore = await cookies();
      expect(cookieStore.delete).toHaveBeenCalledWith('keyguard-token');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null if no token is found', async () => {
      const cookieStore = await cookies();
      vi.mocked(cookieStore.get).mockReturnValue(undefined);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return payload if valid token is found', async () => {
      const cookieStore = await cookies();
      vi.mocked(cookieStore.get).mockReturnValue({ value: 'valid-token' } as any);
      const mockPayload = { userId: '123', email: 'test@example.com' };
      vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: mockPayload } as any);

      const user = await getCurrentUser();
      expect(user).toEqual(mockPayload);
    });
  });
});
