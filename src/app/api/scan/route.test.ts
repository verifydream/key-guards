import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

// Mock the auth logic
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ userId: 'test-user-id' })
}));

describe('Git Exposure Scanner', () => {
  const createRequest = (body: unknown) => {
    return new Request('http://localhost/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  it('should detect OpenAI API Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "sk-12345678901234567890";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'OpenAI API Key' }));
  });

  it('should not detect safe sk prefix (True Negative)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const skip = true;' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toHaveLength(0);
  });

  it('should detect Stripe API Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "sk_live_1234567890123456789012";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Stripe API Key' }));
  });

  it('should detect AWS Access Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "AKIA1234567890ABCDEF";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'AWS Access Key' }));
  });

  it('should detect AWS Secret Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'aws_secret_access_key = 1234567890123456789012345678901234567890;' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'AWS Secret Key' }));
  });

  it('should detect GitHub Token (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "ghp_123456789012345678901234567890123456";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'GitHub Token' }));
  });

  it('should detect Google API Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "AIza12345678901234567890123456789012345";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Google API Key' }));
  });

  it('should detect SendGrid Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "SG.1234567890123456789012.1234567890123456789012345678901234567890123";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'SendGrid Key' }));
  });

  it('should detect Supabase Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Supabase Key' }));
  });

  it('should detect Heroku API Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "12345678-1234-1234-1234-123456789012";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Heroku API Key' }));
  });

  it('should detect Generic API Key (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const api_key = "1234567890123456789012345";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Generic API Key' }));
  });

  it('should detect Private Key Block (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "-----BEGIN RSA PRIVATE KEY-----";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Private Key Block' }));
  });

  it('should detect Password in Code (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const password = "mysecretpassword123";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Password in Code' }));
  });

  it('should detect Bearer Token (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'Authorization: Bearer 1234567890abcdef' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Bearer Token' }));
  });

  it('should detect Connection String (True Positive)', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const db = "postgres://user:pass@localhost:5432/db";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results).toContainEqual(expect.objectContaining({ pattern: 'Connection String' }));
  });

  it('should return 400 if files array is missing', async () => {
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should mask matched secrets in output', async () => {
    const req = createRequest({ files: [{ name: 'config.js', content: 'const key = "sk-12345678901234567890";' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results[0].match).toBe('sk-1•••7890');
  });

  it('should properly mask short matched secrets in output', async () => {
    // Need a match <= 8 chars. We will use the Bearer token rule and match exactly 8 characters.
    const req = createRequest({ files: [{ name: 'config.js', content: 'Authorization: Bearer 12345678' }] });
    const res = await POST(req);
    const data = await res.json();
    expect(data.results[0].match).toBe('••••••••');
  });
});
