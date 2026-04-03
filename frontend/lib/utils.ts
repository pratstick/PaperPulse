import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "High Impact", color: "text-emerald-600 bg-emerald-50" };
  if (score >= 60) return { label: "Relevant", color: "text-blue-600 bg-blue-50" };
  if (score >= 40) return { label: "Interesting", color: "text-amber-600 bg-amber-50" };
  return { label: "Low Priority", color: "text-gray-500 bg-gray-50" };
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
