import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@prisma/client', () => {
  const mockPrismaClient = class {
    user = {
      findUnique: vi.fn(),
    };
  };
  return { PrismaClient: mockPrismaClient };
});

describe('db', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    // reset globalForPrisma.prisma
    delete (globalThis as unknown as Record<string, unknown>).prisma;
  });

  it('creates a new PrismaClient in production', async () => {
    process.env.NODE_ENV = 'production';
    const { prisma } = await import('../db');
    expect(prisma).toBeDefined();
    expect((globalThis as unknown as Record<string, unknown>).prisma).toBeUndefined();
  });

  it('reuses the PrismaClient instance in development', async () => {
    process.env.NODE_ENV = 'development';

    // Import first time
    await import('../db');
    expect((globalThis as unknown as Record<string, unknown>).prisma).toBeDefined();

    // Mock that global is set
    const mockGlobalPrisma = { mock: 'instance' };
    (globalThis as unknown as Record<string, unknown>).prisma = mockGlobalPrisma;

    // Force re-evaluation of module to test reuse
    vi.resetModules();
    const { prisma: prisma2 } = await import('../db');

    expect(prisma2).toBe(mockGlobalPrisma);
  });
});
