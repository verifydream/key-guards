import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, maskKey, getStatusColor, getStatusLabel, daysSince, computeStatus } from '../../lib/utils';

describe('utils module', () => {
  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
      expect(cn('p-4', { 'm-2': true, 'm-4': false })).toBe('p-4 m-2');
    });

    it('handles falsy values', () => {
      expect(cn('p-4', null, undefined, false, '')).toBe('p-4');
    });
  });

  describe('maskKey', () => {
    it('masks short keys with dots', () => {
      expect(maskKey('1234')).toBe('••••••••');
      expect(maskKey('12345678')).toBe('••••••••');
    });

    it('masks long keys with redacted string', () => {
      expect(maskKey('sk-1234567890abcdef')).toBe('sk-12***redacted***cdef');
    });
  });

  describe('getStatusColor', () => {
    it('returns correct color for known statuses', () => {
      expect(getStatusColor('active')).toBe('text-emerald-500 bg-emerald-500/10');
      expect(getStatusColor('rotate_soon')).toBe('text-amber-500 bg-amber-500/10');
      expect(getStatusColor('overdue')).toBe('text-red-500 bg-red-500/10');
      expect(getStatusColor('revoked')).toBe('text-zinc-500 bg-zinc-500/10');
    });

    it('returns default color for unknown statuses', () => {
      expect(getStatusColor('unknown_status')).toBe('text-zinc-500 bg-zinc-500/10');
      expect(getStatusColor('')).toBe('text-zinc-500 bg-zinc-500/10');
    });
  });

  describe('getStatusLabel', () => {
    it('returns correct label for known statuses', () => {
      expect(getStatusLabel('active')).toBe('Healthy');
      expect(getStatusLabel('rotate_soon')).toBe('Rotate Soon');
      expect(getStatusLabel('overdue')).toBe('Overdue');
      expect(getStatusLabel('revoked')).toBe('Revoked');
    });

    it('returns the input string for unknown statuses', () => {
      expect(getStatusLabel('unknown_status')).toBe('unknown_status');
      expect(getStatusLabel('Custom Status')).toBe('Custom Status');
    });
  });

  describe('daysSince', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates days since given date correctly', () => {
      const pastDate = new Date('2024-01-05T12:00:00Z');
      expect(daysSince(pastDate)).toBe(5);
    });

    it('returns 0 for the same day', () => {
      const today = new Date('2024-01-10T10:00:00Z');
      expect(daysSince(today)).toBe(0);
    });

    it('returns negative number for future date', () => {
      const futureDate = new Date('2024-01-15T12:00:00Z');
      expect(daysSince(futureDate)).toBe(-5);
    });
  });

  describe('computeStatus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns overdue if days since exceeds or equals expiryDays', () => {
      const lastRotated = new Date('2023-11-01T12:00:00Z'); // > 60 days
      expect(computeStatus(lastRotated, 60)).toBe('overdue');

      const exactExpiry = new Date('2023-11-11T12:00:00Z'); // Exactly 60 days
      expect(computeStatus(exactExpiry, 60)).toBe('overdue');
    });

    it('returns rotate_soon if within 30 days of expiry', () => {
      const lastRotated = new Date('2023-11-20T12:00:00Z'); // 51 days ago (within 60 - 30 = 30 to 60)
      expect(computeStatus(lastRotated, 60)).toBe('rotate_soon');

      const exactlyThirty = new Date('2023-12-11T12:00:00Z'); // Exactly 30 days ago (60 - 30 = 30)
      expect(computeStatus(exactlyThirty, 60)).toBe('rotate_soon');
    });

    it('returns active if freshly rotated', () => {
      const lastRotated = new Date('2024-01-05T12:00:00Z'); // 5 days ago (less than 30)
      expect(computeStatus(lastRotated, 60)).toBe('active');
    });

    it('handles negative expiry days (edge case)', () => {
        const lastRotated = new Date('2024-01-05T12:00:00Z'); // 5 days ago
        expect(computeStatus(lastRotated, -10)).toBe('overdue'); // 5 >= -10
    });
  });
});
