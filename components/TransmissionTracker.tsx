"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sarthi.transmission.tracker";

export interface TrackerStep {
  id: string;
  title: string;
  hint: string;
}

export const TRANSMISSION_STEPS: TrackerStep[] = [
  { id: "death-cert", title: "Death certificate", hint: "Original + attested copies for each holding." },
  { id: "affidavit", title: "Affidavit of legal heirs", hint: "Generated above — print and notarize." },
  { id: "noc", title: "No-Objection Certificates (NOCs)", hint: "Signed by every other legal heir." },
  { id: "rta-form", title: "Transmission Request Form", hint: "Each RTA (KFintech / CAMS / TSR) has its own." },
  { id: "notarize", title: "Notarize / attest documents", hint: "KYC, affidavit, NOCs, cancelled cheque." },
  { id: "submit", title: "Submit packet to RTA / DP", hint: "Physical or via the DP's online route." },
  { id: "ack", title: "Track acknowledgment", hint: "RTA issues an SR number — follow up on it." },
];

export function TransmissionTracker() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      /* ignore */
    }
  }, [done]);

  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const completed = TRANSMISSION_STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((completed / TRANSMISSION_STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Step-by-step tracker</h2>
        <span className="text-sm font-semibold text-ink-500">
          {completed}/{TRANSMISSION_STEPS.length}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-forest-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {TRANSMISSION_STEPS.map((s, i) => {
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
                    {i + 1}. {s.title}
                  </span>
                  <span className="block text-xs text-ink-400">{s.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
