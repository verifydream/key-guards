import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('db module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports a prisma instance', async () => {
    const { prisma } = await import('../../lib/db');
    expect(prisma).toBeDefined();
  });

  it('uses a global instance in non-production environments', async () => {
    process.env.NODE_ENV = 'development';

    // First import
    const { prisma: prisma1 } = await import('../../lib/db');

    // Invalidate module cache to simulate a hot reload or second import
    vi.resetModules();

    const { prisma: prisma2 } = await import('../../lib/db');

    // They should be the exact same instance because it's attached to globalForPrisma
    expect(prisma1).toBe(prisma2);
  });
});