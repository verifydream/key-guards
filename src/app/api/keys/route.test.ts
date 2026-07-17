import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';

vi.mock('@/lib/db', () => ({
  prisma: {
    apiKey: {
      findMany: vi.fn(),
      create: vi.fn(),
    }
  }
}));

vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn().mockReturnValue({ encrypted: 'enc', iv: 'iv', tag: 'tag' }),
  decrypt: vi.fn().mockReturnValue('decrypted-value')
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn()
}));

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

describe('Keys API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('should return keys with computed status and usage count', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'test-user' });
      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
        {
          id: '1',
          serviceName: 'TestService',
          environment: 'production',
          keyAlias: 'TestAlias',
          status: 'active',
          lastRotatedAt: new Date(),
          expiryDays: 90,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { usageLogs: 5 }
        }
      ]);

      const res = await GET();
      const data = await res.json();

      expect(data.keys).toHaveLength(1);
      expect(data.keys[0].serviceName).toBe('TestService');
      expect(data.keys[0].computedStatus).toBeDefined();
      expect(data.keys[0].usageCount).toBe(5);
    });
  });

  describe('POST', () => {
    const createRequest = (body: unknown) => new Request('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    it('should return 401 if unauthorized', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const req = createRequest({ serviceName: 'Test', keyValue: 'test-val' });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 if required fields are missing', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'test-user' });

      const req1 = createRequest({ serviceName: 'Test' }); // Missing keyValue
      const res1 = await POST(req1);
      expect(res1.status).toBe(400);

      const req2 = createRequest({ keyValue: 'test-val' }); // Missing serviceName
      const res2 = await POST(req2);
      expect(res2.status).toBe(400);
    });

    it('should create a key and return 201', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'test-user' });
      vi.mocked(prisma.apiKey.create).mockResolvedValue({
        id: '2',
        serviceName: 'TestService',
        environment: 'production',
        keyAlias: 'TestAlias',
        status: 'active',
        lastRotatedAt: new Date(),
        expiryDays: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = createRequest({ serviceName: 'TestService', keyValue: 'secret-key-123', keyAlias: 'TestAlias' });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.key.serviceName).toBe('TestService');
      expect(prisma.apiKey.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'test-user',
          serviceName: 'TestService',
          environment: 'production',
          encryptedValue: 'enc',
          iv: 'iv',
          tag: 'tag',
          keyAlias: 'TestAlias',
          expiryDays: 90
        })
      }));
    });

    it('should return 500 on db error', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'test-user' });
      vi.mocked(prisma.apiKey.create).mockRejectedValue(new Error('DB Error'));

      const req = createRequest({ serviceName: 'TestService', keyValue: 'secret-key-123' });
      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });
});
