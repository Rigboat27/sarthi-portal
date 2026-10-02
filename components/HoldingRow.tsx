"use client";

import { Holding } from "@/lib/types";
import { ACCOUNT_TYPE_META } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { NomineeChip } from "./NomineeGauge";
import { cn } from "@/lib/utils";

export function HoldingRow({ holding }: { holding: Holding }) {
  const meta = ACCOUNT_TYPE_META[holding.type];
  const hasNominee = Boolean(holding.nominee?.verified);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center",
        hasNominee ? "border-ink-200" : "border-red-200 bg-red-50/40",
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-xl">
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{holding.provider}</p>
          <span className="text-xs text-ink-400">{meta.label}</span>
        </div>
        <p className="truncate text-sm text-ink-500">
          {holding.label}
          {holding.maskedNumber ? ` · ${holding.maskedNumber}` : ""}
          {holding.detail ? ` · ${holding.detail}` : ""}
        </p>
        {holding.nominee?.verified ? (
          <p className="mt-0.5 text-xs text-forest-700">
            Nominee: {holding.nominee.name} ({holding.nominee.relationship})
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-red-600">
            ⚠ No nominee on record
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <span className="text-sm font-bold tabular-nums">
          {formatINR(holding.value)}
        </span>
        {!hasNominee ? (
          <a
            href={holding.fixUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            Add nominee ↗
          </a>
        ) : (
          <NomineeChip verified />
        )}
      </div>
    </div>
  );
}
