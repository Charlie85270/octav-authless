import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse a timestamp that may be ISO string, Unix seconds, or Unix ms */
export function parseTimestamp(value: string | number): Date {
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const num = Number(value);
    // Unix seconds (< 1e12) vs milliseconds
    return new Date(num < 1e12 ? num * 1000 : num);
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  throw new Error(`Invalid timestamp: ${value}`);
}
