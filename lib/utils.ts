import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numeric price in Indian Rupees (INR)
 * Example: 799 -> "₹799", 2999 -> "₹2,999", 15000 -> "₹15,000"
 */
export function formatINR(price: number | string | null | undefined): string {
  if (price === undefined || price === null || price === "") return "₹799";
  const num = typeof price === "number" ? price : parseFloat(String(price).replace(/[^0-9.]/g, ""));
  if (isNaN(num) || !isFinite(num) || num <= 0) return "₹799";
  // If legacy dollar value (e.g. 29.99, 24.99), fallback to 799 INR
  const displayNum = num < 100 ? 799 : Math.round(num);
  return `₹${displayNum.toLocaleString("en-IN")}`;
}

/**
 * Parse and normalize the beat's base MP3 price
 */
export function parseBeatMp3Price(price?: number | string | null): number {
  if (price === undefined || price === null || price === "") return 799;
  const num = typeof price === "number" ? price : parseFloat(String(price).replace(/[^0-9.]/g, ""));
  if (isNaN(num) || !isFinite(num) || num <= 0) return 799;
  // If legacy dollar value (< 100), default to 799 INR
  if (num < 100) return 799;
  return Math.round(num);
}

export const PRESET_PRICES = [
  { label: "₹799", value: 799 },
  { label: "₹999", value: 999 },
  { label: "₹2,999", value: 2999 },
  { label: "₹5,999", value: 5999 },
] as const;

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(clean)) return clean;
  return null;
}

export const KEY_GROUPS = [
  {
    group: "MAJOR",
    keys: [
      "C Major",
      "C# Major",
      "Db Major",
      "D Major",
      "Eb Major",
      "E Major",
      "F Major",
      "F# Major",
      "Gb Major",
      "G Major",
      "Ab Major",
      "A Major",
      "Bb Major",
      "B Major",
    ],
  },
  {
    group: "MINOR",
    keys: [
      "C Minor",
      "C# Minor",
      "Db Minor",
      "D Minor",
      "Eb Minor",
      "E Minor",
      "F Minor",
      "F# Minor",
      "Gb Minor",
      "G Minor",
      "Ab Minor",
      "A Minor",
      "Bb Minor",
      "B Minor",
    ],
  },
] as const;
