"use client";

import { useState } from "react";
import Link from "next/link";
import { api, uploadOcr, OcrResult, NodalResponse } from "@/lib/api";

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

  // OCR upload
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocr, setOcr] = useState<OcrResult | null>(null);

  // Nodal officer lookup
  const [company, setCompany] = useState("");
  const [nodalBusy, setNodalBusy] = useState(false);
  const [nodal, setNodal] = useState<NodalResponse | null>(null);

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

  async function handleOcr(file: File) {
    setOcrBusy(true);
    setError(null);
    try {
      const res = await uploadOcr(file);
      setOcr(res);
      // Pre-fill the certificate name from OCR so the user can just check.
      const name = res.fields?.name ?? "";
      if (name) setCert(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR failed");
    } finally {
      setOcrBusy(false);
    }
  }

  async function handleNodal() {
    if (!company.trim()) return;
    setNodalBusy(true);
    setError(null);
    try {
      const res = await api<NodalResponse>(`/data/nodal?company=${encodeURIComponent(company)}`);
      setNodal(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nodal lookup failed");
    } finally {
      setNodalBusy(false);
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
        between Aadhaar and the old share certificate — followed by sending
        documents to the wrong address. Sarthi flags both early.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* OCR upload */}
      <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="text-lg font-bold">1 · Upload your old certificate</h2>
        <p className="mt-1 text-sm text-ink-500">
          Sarthi reads the name off the document so you don&apos;t have to retype it.
        </p>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleOcr(f);
          }}
          className="mt-3 block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink-800"
        />
        {ocrBusy && <p className="mt-2 text-sm text-ink-400">Reading document…</p>}
        {ocr && (
          <div className="mt-3 rounded-xl bg-ink-50 p-3 text-sm">
            <p className="font-medium">Extracted name:</p>
            <p className="font-mono text-lg">{ocr.fields?.name ?? "(none)"}</p>
            <p className="text-xs text-ink-400">
              Mock OCR (Team B&apos;s real OCR replaces this).
            </p>
          </div>
        )}
      </div>

      {/* Name match */}
      <div className="mt-6 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="text-lg font-bold">2 · Compare names</h2>
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

        <button
          onClick={check}
          disabled={busy || !aadhaar.trim() || !cert.trim()}
          className="w-full rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Checking…" : "Check for mismatch"}
        </button>
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
            {result.match
              ? "✅ Names match"
              : "⚠️ Likely mismatch — you may need an affidavit"}
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
              IEPF-5 form.
            </p>
          )}
        </div>
      )}

      {/* Nodal Officer router */}
      <div className="mt-6 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="text-lg font-bold">3 · Route to the right Nodal Officer</h2>
        <p className="text-sm text-ink-500">
          Physical documents must go to the company&apos;s Nodal Officer, not the
          IEPF authority. Look up the company here.
        </p>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Infosys"
          />
          <button
            onClick={handleNodal}
            disabled={nodalBusy || !company.trim()}
            className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:opacity-40"
          >
            {nodalBusy ? "…" : "Find"}
          </button>
        </div>

        {nodal && (
          <div className="mt-2">
            {nodal.companies.length === 0 ? (
              <p className="text-sm text-ink-500">
                No matching company in the directory yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {nodal.companies.map((c) => (
                  <li key={c.ticker} className="rounded-xl bg-ink-50 p-3 text-sm">
                    <p className="font-semibold">
                      {c.name} <span className="text-ink-400">({c.ticker})</span>
                    </p>
                    <p className="text-xs text-ink-500">
                      RTA: {c.rta} · ISIN {c.isin}
                    </p>
                    <a
                      href={c.lookupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-saffron-600 hover:text-saffron-700"
                    >
                      Confirm Nodal Officer address ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-amber-700">{nodal.warning}</p>
          </div>
        )}
      </div>

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
