import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeStatus, daysSince, maskKey, getStatusColor, getStatusLabel, cn } from './utils';

describe('Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('daysSince', () => {
    it('should correctly calculate days since a given date', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const tenDaysAgo = new Date('2023-12-31T12:00:00Z');
      expect(daysSince(tenDaysAgo)).toBe(10);
    });
  });

  describe('computeStatus', () => {
    it('should return "active" for recent keys', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const lastRotated = new Date('2024-01-01T12:00:00Z'); // 9 days ago
      expect(computeStatus(lastRotated, 90)).toBe('active');
    });

    it('should return "rotate_soon" when expiry is within 30 days', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const lastRotated = new Date('2023-11-10T12:00:00Z'); // 61 days ago
      expect(computeStatus(lastRotated, 90)).toBe('rotate_soon');
    });

    it('should return "overdue" when days since rotation exceeds expiryDays', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const lastRotated = new Date('2023-10-10T12:00:00Z'); // 92 days ago
      expect(computeStatus(lastRotated, 90)).toBe('overdue');
    });

    it('should handle exact boundary (exactly expiryDays - 30)', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const lastRotated = new Date('2023-11-11T12:00:00Z'); // Exactly 60 days ago
      expect(computeStatus(lastRotated, 90)).toBe('rotate_soon');
    });

    it('should handle exact boundary (exactly expiryDays)', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const lastRotated = new Date('2023-10-12T12:00:00Z'); // Exactly 90 days ago
      expect(computeStatus(lastRotated, 90)).toBe('overdue');
    });
  });

  describe('maskKey', () => {
    it('should mask short keys completely', () => {
      expect(maskKey('short')).toBe('••••••••');
      expect(maskKey('12345678')).toBe('••••••••');
    });

    it('should mask long keys with ***redacted*** in the middle', () => {
      expect(maskKey('my-long-super-secret-key-1234')).toBe('my-lo***redacted***1234');
    });
  });

  describe('getStatusColor', () => {
    it('should return appropriate colors', () => {
      expect(getStatusColor('active')).toContain('emerald');
      expect(getStatusColor('rotate_soon')).toContain('amber');
      expect(getStatusColor('overdue')).toContain('red');
      expect(getStatusColor('revoked')).toContain('zinc');
      expect(getStatusColor('unknown')).toContain('zinc'); // default fallback
    });
  });

  describe('getStatusLabel', () => {
    it('should return readable labels', () => {
      expect(getStatusLabel('active')).toBe('Healthy');
      expect(getStatusLabel('rotate_soon')).toBe('Rotate Soon');
      expect(getStatusLabel('overdue')).toBe('Overdue');
      expect(getStatusLabel('revoked')).toBe('Revoked');
      expect(getStatusLabel('custom_status')).toBe('custom_status');
    });
  });

  describe('cn', () => {
    it('should merge classes', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });
  });
});
