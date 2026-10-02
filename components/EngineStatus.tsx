"use client";

import { useEffect, useState } from "react";
import { API_BASE, EngineHealth, api } from "@/lib/api";

type Status = "checking" | "online" | "offline";

export function EngineStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [health, setHealth] = useState<EngineHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<EngineHealth>("/health")
      .then((h) => {
        if (cancelled) return;
        setHealth(h);
        setStatus("online");
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dot = {
    checking: "bg-ink-300",
    online: "bg-forest-500",
    offline: "bg-red-500",
  }[status];

  const label = {
    checking: "Checking engine…",
    online: health?.mockMode ? "Engine online · mock mode" : "Engine online",
    offline: "Engine offline · using mock",
  }[status];

  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-ink-400 sm:px-6">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {label}
        </span>
        <span className="font-mono">{API_BASE}</span>
      </div>
    </footer>
  );
}
