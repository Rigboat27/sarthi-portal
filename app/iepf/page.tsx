"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface MatchResult {
  score: number;
  match: boolean;
  a: string;
  b: string;
}

export default function IepfPage() {
  const [aadhaar, setAadhaar] = useState("");
  const [cert, setCert] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<MatchResult>("/docs/match", {
        method: "POST",
        body: JSON.stringify({ a: aadhaar, b: cert }),
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run the check");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-saffron-600">
        IEPF Claim Pre-Validator
      </p>
      <h1 className="mt-1 text-2xl font-bold">Catch name mismatches before you file</h1>
      <p className="mt-2 text-ink-500">
        The #1 reason IEPF-5 claims are rejected is a name/signature mismatch
        between Aadhaar and the old share certificate. Sarthi flags it early.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <Field label="Name on Aadhaar / KYC">
          <input
            className="input"
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value)}
            placeholder="e.g. Ramesh Sharma"
          />
        </Field>
        <Field label="Name on share certificate">
          <input
            className="input"
            value={cert}
            onChange={(e) => setCert(e.target.value)}
            placeholder="e.g. Ramesh Sharm"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={check}
          disabled={busy || !aadhaar.trim() || !cert.trim()}
          className="w-full rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Checking…" : "Check for mismatch"}
        </button>

        <p className="text-xs text-ink-400">
          In the full flow, documents are uploaded and run through OCR
          (<code className="rounded bg-ink-100 px-1">/docs/ocr</code>) before this
          fuzzy match (<code className="rounded bg-ink-100 px-1">/docs/match</code>).
        </p>
      </div>

      {result && (
        <div
          className={`mt-6 rounded-2xl border p-6 ${
            result.match
              ? "border-forest-200 bg-forest-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <p className="text-lg font-bold">
            {result.match ? "✅ Names match" : "⚠️ Likely mismatch — you may need an affidavit"}
          </p>
          <p className="mt-1 text-sm">
            Match confidence: <strong>{(result.score * 100).toFixed(0)}%</strong>
          </p>
          <p className="mt-2 font-mono text-xs text-ink-500">
            &quot;{result.a}&quot; vs &quot;{result.b}&quot;
          </p>
          {!result.match && (
            <p className="mt-3 text-sm">
              Prepare an affidavit for the name discrepancy before filing the
              IEPF-5 form, and send documents to the company&apos;s Nodal Officer
              (router coming soon).
            </p>
          )}
        </div>
      )}

      <Link
        href="/dashboard"
        className="mt-6 inline-block text-sm font-semibold text-saffron-600 hover:text-saffron-700"
      >
        ← Back to Wealth Map
      </Link>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-600">{label}</span>
      {children}
    </label>
  );
}
