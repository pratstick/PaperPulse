"use client";

import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-gray-400";

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold shrink-0",
        color,
        sizeClasses[size]
      )}
    >
      {Math.round(pct)}
    </div>
  );
}
