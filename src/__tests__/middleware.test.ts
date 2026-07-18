import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: 'next' })),
    json: vi.fn((body, init) => ({ type: 'json', body, init })),
    redirect: vi.fn((url) => ({ type: 'redirect', url })),
  },
}));

// We must explicitly mock jwtVerify, but if we don't return anything or throw, it passes getSecret
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

describe('middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows public paths', async () => {
    const req = {
      nextUrl: { pathname: '/login' },
      cookies: { get: vi.fn() },
    } as unknown as NextRequest;

    const res = await middleware(req);
    expect(res).toEqual({ type: 'next' });
  });

  it('allows API auth paths', async () => {
    const req = {
      nextUrl: { pathname: '/api/auth/register' },
      cookies: { get: vi.fn() },
    } as unknown as NextRequest;

    const res = await middleware(req);
    expect(res).toEqual({ type: 'next' });
  });

  it('redirects to login if no token for protected page', async () => {
    const req = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { get: vi.fn(() => undefined) },
      url: 'http://localhost/dashboard'
    } as unknown as NextRequest;

    const res = await middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalled();
    expect(res).toEqual({ type: 'redirect', url: new URL('/login', 'http://localhost/dashboard') });
  });

  it('returns 401 for protected API if no token', async () => {
    const req = {
      nextUrl: { pathname: '/api/protected' },
      cookies: { get: vi.fn(() => undefined) },
      url: 'http://localhost/api/protected'
    } as unknown as NextRequest;

    const res = await middleware(req);
    expect(res).toEqual({ type: 'json', body: { error: 'Unauthorized' }, init: { status: 401 } });
  });

  it('allows protected path if valid token', async () => {
    const req = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { get: vi.fn(() => ({ value: 'valid-token' })) },
      url: 'http://localhost/dashboard'
    } as unknown as NextRequest;

    (jwtVerify as any).mockResolvedValue({ payload: {} });

    const res = await middleware(req);
    expect(res).toEqual({ type: 'next' });
  });

  it('redirects to login if invalid token for protected page', async () => {
    const req = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { get: vi.fn(() => ({ value: 'invalid-token' })) },
      url: 'http://localhost/dashboard'
    } as unknown as NextRequest;

    (jwtVerify as any).mockRejectedValue(new Error('invalid'));

    const res = await middleware(req);
    expect(res).toEqual({ type: 'redirect', url: new URL('/login', 'http://localhost/dashboard') });
  });

  it('returns 401 if invalid token for protected API', async () => {
    const req = {
      nextUrl: { pathname: '/api/protected' },
      cookies: { get: vi.fn(() => ({ value: 'invalid-token' })) },
      url: 'http://localhost/api/protected'
    } as unknown as NextRequest;

    (jwtVerify as any).mockRejectedValue(new Error('invalid'));

    const res = await middleware(req);
    expect(res).toEqual({ type: 'json', body: { error: 'Invalid token' }, init: { status: 401 } });
  });

  it('redirects instead of throwing because of catch block when JWT_SECRET is default', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('JWT_SECRET', 'keyguard-jwt-dev-secret-change-in-prod');

    const req = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { get: vi.fn(() => ({ value: 'valid-token' })) },
      url: 'http://localhost/dashboard'
    } as unknown as NextRequest;

    const res = await middleware(req);
    expect(res).toEqual({ type: 'redirect', url: new URL('/login', 'http://localhost/dashboard') });
  });

  it('redirects instead of throwing because of catch block when JWT_SECRET is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    const req = {
      nextUrl: { pathname: '/dashboard' },
      cookies: { get: vi.fn(() => ({ value: 'valid-token' })) },
      url: 'http://localhost/dashboard'
    } as unknown as NextRequest;

    const res = await middleware(req);
    expect(res).toEqual({ type: 'redirect', url: new URL('/login', 'http://localhost/dashboard') });
  });
});
