"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  id: string;
  title: string;
  hint?: string;
}

export function Checklist({
  items,
  storageKey,
  autoCheck = [],
}: {
  items: ChecklistItem[];
  storageKey: string;
  /** Item ids to force-check (e.g. when a prior step auto-completes). */
  autoCheck?: string[];
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Auto-check any items the parent marks as complete.
  const autoKey = autoCheck.join(",");
  useEffect(() => {
    if (!autoKey) return;
    setDone((d) => {
      const next = { ...d };
      for (const id of autoCheck) next[id] = true;
      return next;
    });
  }, [autoKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done, storageKey]);

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const completed = items.filter((i) => done[i.id]).length;
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink-700">Checklist</span>
        <span className="text-sm font-semibold text-ink-500">
          {completed}/{items.length}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-forest-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((s) => {
          const checked = !!done[s.id];
          return (
            <li key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  checked ? "border-forest-300 bg-forest-50" : "border-ink-200 hover:bg-ink-50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                    checked
                      ? "border-forest-500 bg-forest-500 text-white"
                      : "border-ink-300 text-transparent",
                  )}
                >
                  ✓
                </span>
                <span>
                  <span className={cn("block text-sm font-medium", checked && "line-through opacity-70")}>
                    {s.title}
                  </span>
                  {s.hint && <span className="block text-xs text-ink-400">{s.hint}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
