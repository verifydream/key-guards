import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "text-emerald-500 bg-emerald-500/10";
    case "rotate_soon": return "text-amber-500 bg-amber-500/10";
    case "overdue": return "text-red-500 bg-red-500/10";
    case "revoked": return "text-zinc-500 bg-zinc-500/10";
    default: return "text-zinc-500 bg-zinc-500/10";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "active": return "Healthy";
    case "rotate_soon": return "Rotate Soon";
    case "overdue": return "Overdue";
    case "revoked": return "Revoked";
    default: return status;
  }
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeStatus(lastRotated: Date, expiryDays: number): string {
  const days = daysSince(lastRotated);
  if (days >= expiryDays) return "overdue";
  if (days >= expiryDays - 30) return "rotate_soon";
  return "active";
}
