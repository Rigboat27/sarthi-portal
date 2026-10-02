"use client";

import { NomineeHealth } from "@/lib/nominee";
import { cn } from "@/lib/utils";

const BAND_COLORS = {
  red: "#dc2626",
  amber: "#d97706",
  green: "#16a34a",
};

export function NomineeGauge({ health }: { health: NomineeHealth }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const filled = (health.score / 100) * c;
  const color = BAND_COLORS[health.band];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="14"
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>
            {health.score}
          </span>
          <span className="text-xs font-medium text-ink-400">/ 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-ink-500">{health.verdict}</p>
    </div>
  );
}

export function NomineeChip({ verified }: { verified: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        verified
          ? "bg-forest-50 text-forest-700"
          : "bg-red-50 text-red-600",
      )}
    >
      {verified ? "Nominee ✓" : "No nominee"}
    </span>
  );
}
