import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes efficiently, handling conflicts and conditional classes.
 *
 * @param {...ClassValue[]} inputs - An array of class values to merge.
 * @returns {string} The merged string of CSS classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Masks an API key for safe display in the user interface.
 * Returns early if the key is too short to mask properly.
 *
 * @param {string} key - The plaintext API key to mask.
 * @returns {string} The masked string (e.g., `sk-pr***redacted***w3`).
 */
export function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  const head = key.slice(0, 5);
  const tail = key.slice(-4);
  return `${head}***redacted***${tail}`;
}

/**
 * Returns Tailwind CSS classes for coloring status badges based on the key's health.
 *
 * @param {string} status - The current status of the key (active, rotate_soon, overdue, revoked).
 * @returns {string} The Tailwind CSS classes for the text and background color.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "text-emerald-500 bg-emerald-500/10";
    case "rotate_soon": return "text-amber-500 bg-amber-500/10";
    case "overdue": return "text-red-500 bg-red-500/10";
    case "revoked": return "text-zinc-500 bg-zinc-500/10";
    default: return "text-zinc-500 bg-zinc-500/10";
  }
}

/**
 * Returns a human-readable label for a given key status.
 *
 * @param {string} status - The raw status string.
 * @returns {string} The formatted, human-readable status label.
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "active": return "Healthy";
    case "rotate_soon": return "Rotate Soon";
    case "overdue": return "Overdue";
    case "revoked": return "Revoked";
    default: return status;
  }
}

/**
 * Calculates the number of full days that have elapsed since a given date.
 *
 * @param {Date} date - The past date to compare against the current time.
 * @returns {number} The integer number of days since the date.
 */
export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Computes the health status of an API key based on its last rotation date and configured expiry period.
 *
 * @param {Date} lastRotated - The date the key was last rotated.
 * @param {number} expiryDays - The maximum number of days the key should remain active before rotation is required.
 * @returns {string} The computed status ("overdue", "rotate_soon", or "active").
 */
export function computeStatus(lastRotated: Date, expiryDays: number): string {
  const days = daysSince(lastRotated);
  if (days >= expiryDays) return "overdue";
  if (days >= expiryDays - 30) return "rotate_soon";
  return "active";
}
