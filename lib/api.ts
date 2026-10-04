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

export interface OcrResult {
  kycName: string;
  certificateName: string;
  isMatch: boolean;
}

export interface AffidavitResult {
  affidavit: Record<string, unknown>;
  affidavitText: string;
  checklist: string[];
  pdfBase64: string | null;
  mock: boolean;
}

export interface NameAffidavitResult {
  affidavitText: string;
  pdfBase64: string;
  mock: boolean;
}

export interface NodalCompany {
  name: string;
  ticker: string;
  sector: string;
  rta: string;
}

export interface NodalResponse {
  companies: NodalCompany[];
  warning: string;
}

/** Multipart upload of KYC + certificate to /docs/ocr (browser sets the boundary). */
export async function uploadOcr(kyc: File, cert: File): Promise<OcrResult> {
  const fd = new FormData();
  fd.append("kyc", kyc);
  fd.append("cert", cert);
  const res = await fetch(`${API_BASE}/docs/ocr`, { method: "POST", body: fd });
  const env = (await res.json()) as ApiEnvelope<OcrResult>;
  if (!env.ok) {
    throw new Error(
      typeof env.error === "object" && env.error !== null
        ? JSON.stringify(env.error)
        : "OCR failed",
    );
  }
  return env.data as OcrResult;
}

/** Download a base64 PDF (from the engine) as a file. */
export function downloadPdf(b64: string, filename: string): void {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Open a print-friendly window for a document and trigger the print dialog. */
export function printText(title: string, text: string): void {
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  w.document.write(
    `<html><head><title>${title}</title><style>` +
      `body{font-family:Georgia,serif;max-width:640px;margin:32px auto;padding:0 16px;}` +
      `pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:14px;line-height:1.6;}` +
      `</style></head><body><h2>${title}</h2><pre>${esc}</pre>` +
      `<script>window.onload=function(){window.print()}</script></body></html>`,
  );
  w.document.close();
}
