"use client";

import { useState } from "react";
import Link from "next/link";
import {
  api,
  uploadOcr,
  downloadPdf,
  printText,
  OcrResult,
  NodalResponse,
  NameAffidavitResult,
} from "@/lib/api";
import { useStore } from "@/components/StoreProvider";
import { t } from "@/lib/i18n";
import { Checklist } from "@/components/Checklist";

const IEPF_CHECKLIST = [
  { id: "identity", title: "Proof of identity", hint: "Aadhaar / PAN of the claimant." },
  { id: "entitlement", title: "Proof of entitlement", hint: "Original share certificate / dividend warrant." },
  { id: "bank", title: "Cancelled cheque / bank proof", hint: "For the refund to be credited." },
  { id: "indemnity", title: "Indemnity bond", hint: "As required by the company / authority." },
  { id: "affidavit", title: "Affidavit for name discrepancy", hint: "Generated above if the names differ." },
  { id: "nodal", title: "Mail to the Nodal Officer", hint: "Route above gives the correct company." },
  { id: "file", title: "File IEPF-5 online & track", hint: "On the MCA portal, then follow up." },
];

export default function IepfPage() {
  const { lang } = useStore();
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [affBusy, setAffBusy] = useState(false);
  const [nameAff, setNameAff] = useState<NameAffidavitResult | null>(null);

  const [company, setCompany] = useState("");
  const [nodalBusy, setNodalBusy] = useState(false);
  const [nodal, setNodal] = useState<NodalResponse | null>(null);

  async function handleAnalyze() {
    if (!kycFile || !certFile) return;
    setStatus("analyzing");
    setError(null);
    setOcr(null);
    setNameAff(null);
    try {
      const res = await uploadOcr(kycFile, certFile);
      setOcr(res);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR failed");
      setStatus("error");
    }
  }

  async function handleGenerateNameAffidavit() {
    if (!ocr) return;
    setAffBusy(true);
    setError(null);
    try {
      const res = await api<NameAffidavitResult>("/docs/name-affidavit", {
        method: "POST",
        body: JSON.stringify({ kycName: ocr.kycName, certificateName: ocr.certificateName }),
      });
      setNameAff(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate affidavit");
    } finally {
      setAffBusy(false);
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
      <h1 className="mt-1 text-2xl font-bold">{t(lang, "page.iepf.title")}</h1>
      <p className="mt-2 text-ink-500">
        IEPF-5 claims are rejected when your current KYC name doesn&apos;t exactly
        match the name on old share certificates. Upload both below — Sarthi
        reads them with AI and flags a mismatch before you file.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* OCR upload */}
      <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="text-lg font-bold">1 · Upload your documents</h2>
        <Field label="KYC document (Aadhaar / PAN)">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink-800"
          />
        </Field>
        <Field label="Share certificate / dividend warrant">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink-800"
          />
        </Field>

        <button
          onClick={handleAnalyze}
          disabled={!kycFile || !certFile || status === "analyzing"}
          className="w-full rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "analyzing" ? "Analyzing with AI…" : t(lang, "page.iepf.analyze")}
        </button>
      </div>

      {ocr && (
        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6">
          <div className="space-y-2 rounded-xl bg-ink-50 p-4">
            <div className="flex justify-between border-b border-ink-200 pb-2 text-sm">
              <span className="text-ink-500">KYC name</span>
              <span className="font-semibold">{ocr.kycName}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm">
              <span className="text-ink-500">Certificate name</span>
              <span className="font-semibold">{ocr.certificateName}</span>
            </div>
          </div>

          {ocr.isMatch ? (
            <div className="mt-4 rounded-xl border border-forest-200 bg-forest-50 p-4 text-forest-900">
              <p className="font-bold">✅ Names match — safe to proceed</p>
              <p className="mt-1 text-sm opacity-90">
                You are safe to proceed with the IEPF-5 filing.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="font-bold">⚠️ Name mismatch detected</p>
              <p className="mt-1 text-sm opacity-90">
                The IEPF Authority will likely reject your claim. Generate a
                legal <strong>Affidavit for Name Discrepancy</strong> below and
                submit it with your filing.
              </p>
              <button
                onClick={handleGenerateNameAffidavit}
                disabled={affBusy}
                className="mt-3 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                {affBusy ? "Generating…" : "Generate name-discrepancy affidavit"}
              </button>

              {nameAff && (
                <div className="mt-4 rounded-xl bg-white p-4">
                  <textarea
                    readOnly
                    value={nameAff.affidavitText}
                    className="min-h-[200px] w-full rounded-lg border border-ink-200 bg-ink-50 p-3 font-mono text-xs leading-relaxed text-ink-700 outline-none"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        downloadPdf(nameAff.pdfBase64, "affidavit-name-discrepancy.pdf")
                      }
                      className="flex-1 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
                    >
                      ⬇ Download PDF
                    </button>
                    <button
                      onClick={() =>
                        printText("Affidavit for Name Discrepancy", nameAff.affidavitText)
                      }
                      className="flex-1 rounded-xl border border-ink-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
                    >
                      🖨 Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Nodal Officer router */}
      <div className="mt-6 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="text-lg font-bold">2 · Route to the right Nodal Officer</h2>
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
                      {c.sector} · RTA: {c.rta}
                    </p>
                    {c.supportEmail && (
                      <p className="text-xs text-ink-600">
                        RTA email:{" "}
                        <a
                          href={`mailto:${c.supportEmail}`}
                          className="font-semibold text-ink-800 underline"
                        >
                          {c.supportEmail}
                        </a>
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        c.name + " IEPF nodal officer",
                      )}`}
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

      {/* Claim readiness checklist */}
      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-bold">3 · Claim readiness checklist</h2>
        <Checklist
          items={IEPF_CHECKLIST}
          storageKey="sarthi.iepf.checklist"
          autoCheck={[
            ...(ocr ? ["identity", "entitlement"] : []),
            ...(nameAff ? ["affidavit"] : []),
            ...(nodal && nodal.companies.length ? ["nodal"] : []),
          ]}
        />
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
