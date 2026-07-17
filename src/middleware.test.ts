import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';
import * as jose from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

describe('Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createRequest = (pathname: string, token?: string) => {
    const req = new NextRequest(`http://localhost${pathname}`);
    if (token) {
      req.cookies.set('keyguard-token', token);
    }
    return req;
  };

  it('should allow public routes without token', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);
    // NextResponse.next() returns a response with specific headers indicating a passthrough
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('should allow auth api routes without token', async () => {
    const req = createRequest('/api/auth/login');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('should redirect UI routes to login if token is missing', async () => {
    const req = createRequest('/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307); // NextResponse.redirect uses 307 Temporary Redirect by default
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('should return 401 for API routes if token is missing', async () => {
    const req = createRequest('/api/keys');
    const res = await middleware(req);
    expect(res.status).toBe(401);
  });

  it('should allow access if token is valid', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { userId: '123' } } as any);

    const req = createRequest('/dashboard', 'valid-token');
    const res = await middleware(req);

    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(jose.jwtVerify).toHaveBeenCalled();
  });

  it('should redirect UI routes to login if token is invalid', async () => {
    vi.mocked(jose.jwtVerify).mockRejectedValue(new Error('Invalid token'));

    const req = createRequest('/dashboard', 'invalid-token');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login');
  });

  it('should return 401 for API routes if token is invalid', async () => {
    vi.mocked(jose.jwtVerify).mockRejectedValue(new Error('Invalid token'));

    const req = createRequest('/api/keys', 'invalid-token');
    const res = await middleware(req);

    expect(res.status).toBe(401);
  });

  it('should redirect UI routes to login in production if JWT_SECRET is not set or is default due to catching error', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_RUNTIME = 'nodejs';

    // Case 1: No secret
    delete process.env.JWT_SECRET;
    const req1 = createRequest('/dashboard', 'some-token');
    const res1 = await middleware(req1);
    expect(res1.status).toBe(307);

    // Case 2: Default secret
    process.env.JWT_SECRET = 'keyguard-jwt-dev-secret-change-in-prod';
    const req2 = createRequest('/api/keys', 'some-token');
    const res2 = await middleware(req2);
    // Since it catches any error in try/catch block for API routes, it returns 401
    expect(res2.status).toBe(401);
  });

  it('should not throw in edge runtime even if JWT_SECRET is not set', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_RUNTIME = 'edge';
    delete process.env.JWT_SECRET;
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { userId: '123' } } as any);

    const req = createRequest('/dashboard', 'valid-token');
    const res = await middleware(req);

    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
