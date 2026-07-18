import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cn, maskKey, getStatusColor, getStatusLabel, daysSince, computeStatus } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
      expect(cn('p-4', undefined, 'm-2', null)).toBe('p-4 m-2');
      expect(cn('px-2 py-1', { 'bg-blue-500': true, 'text-black': false })).toBe('px-2 py-1 bg-blue-500');
    });
  });

  describe('maskKey', () => {
    it('masks a short key correctly', () => {
      expect(maskKey('12345678')).toBe('••••••••');
      expect(maskKey('123')).toBe('••••••••');
    });

    it('masks a long key correctly', () => {
      expect(maskKey('abcdefghijklmnop')).toBe('abcde***redacted***mnop');
    });
  });

  describe('getStatusColor', () => {
    it('returns the correct color for active status', () => {
      expect(getStatusColor('active')).toBe('text-emerald-500 bg-emerald-500/10');
    });

    it('returns the correct color for rotate_soon status', () => {
      expect(getStatusColor('rotate_soon')).toBe('text-amber-500 bg-amber-500/10');
    });

    it('returns the correct color for overdue status', () => {
      expect(getStatusColor('overdue')).toBe('text-red-500 bg-red-500/10');
    });

    it('returns the correct color for revoked status', () => {
      expect(getStatusColor('revoked')).toBe('text-zinc-500 bg-zinc-500/10');
    });

    it('returns the correct default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('text-zinc-500 bg-zinc-500/10');
    });
  });

  describe('getStatusLabel', () => {
    it('returns the correct label for active status', () => {
      expect(getStatusLabel('active')).toBe('Healthy');
    });

    it('returns the correct label for rotate_soon status', () => {
      expect(getStatusLabel('rotate_soon')).toBe('Rotate Soon');
    });

    it('returns the correct label for overdue status', () => {
      expect(getStatusLabel('overdue')).toBe('Overdue');
    });

    it('returns the correct label for revoked status', () => {
      expect(getStatusLabel('revoked')).toBe('Revoked');
    });

    it('returns the status itself for unknown status', () => {
      expect(getStatusLabel('unknown_status')).toBe('unknown_status');
    });
  });

  describe('daysSince', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calculates days since a date correctly', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const pastDate = new Date('2024-01-05T12:00:00Z'); // 5 days ago
      expect(daysSince(pastDate)).toBe(5);
    });

    it('calculates days since a date correctly when time is slightly more than 5 days', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const pastDate = new Date('2024-01-04T13:00:00Z'); // Almost 6 days ago (5 days, 23 hours)
      expect(daysSince(pastDate)).toBe(5);
    });
  });

  describe('computeStatus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns active if not close to expiry', () => {
      const now = new Date('2024-05-01T00:00:00Z');
      vi.setSystemTime(now);
      const lastRotated = new Date('2024-04-15T00:00:00Z'); // 16 days ago
      expect(computeStatus(lastRotated, 90)).toBe('active');
    });

    it('returns rotate_soon if within 30 days of expiry', () => {
      const now = new Date('2024-05-01T00:00:00Z');
      vi.setSystemTime(now);
      const lastRotated = new Date('2024-03-01T00:00:00Z'); // 61 days ago
      expect(computeStatus(lastRotated, 90)).toBe('rotate_soon');
    });

    it('returns overdue if past expiry', () => {
      const now = new Date('2024-05-01T00:00:00Z');
      vi.setSystemTime(now);
      const lastRotated = new Date('2024-01-01T00:00:00Z'); // 121 days ago
      expect(computeStatus(lastRotated, 90)).toBe('overdue');
    });

    it('returns overdue if exactly on expiry day', () => {
      const now = new Date('2024-05-01T00:00:00Z');
      vi.setSystemTime(now);
      const lastRotated = new Date('2024-01-31T00:00:00Z'); // 91 days ago
      expect(computeStatus(lastRotated, 90)).toBe('overdue'); // Assuming expiry is 90 days, 91 is overdue. If 90 is overdue, it returns overdue.
    });
  });
});
