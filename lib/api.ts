// Engine client for the Viraasat portal.
// All calls go through the Sarthi Core engine (FastAPI @ :8787) and unwrap the
// canonical ApiEnvelope. MOCK_AA toggles between the engine and an offline mock.

import type { ApiEnvelope } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8787";

// Offline fallback: when true, AA data comes from lib/aa.ts (no backend needed).
export const MOCK_AA = (process.env.NEXT_PUBLIC_MOCK_AA ?? "true") === "true";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const env = (await res.json()) as ApiEnvelope<T>;
  if (!env.ok) {
    const detail =
      typeof env.error === "object" && env.error !== null
        ? JSON.stringify(env.error)
        : String(env.error);
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return env.data as T;
}

export interface EngineHealth {
  version: string;
  providers: { sarvam: boolean; gemini: boolean; aa: string };
  mockMode: boolean;
  spendInr: number;
}
