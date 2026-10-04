"use client";

import { useState } from "react";
import Link from "next/link";
import { api, AffidavitResult, downloadPdf, printText } from "@/lib/api";
import { TransmissionTracker } from "@/components/TransmissionTracker";

interface FamilyMemberInput {
  name: string;
  relationship: string;
  share: string;
}

export default function TransmissionPage() {
  const [deceased, setDeceased] = useState("");
  const [applicant, setApplicant] = useState("");
  const [relationship, setRelationship] = useState("");
  const [folio, setFolio] = useState("");
  const [members, setMembers] = useState<FamilyMemberInput[]>([
    { name: "", relationship: "", share: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AffidavitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setMember(i: number, patch: Partial<FamilyMemberInput>) {
    setMembers((ms) => ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function addMember() {
    setMembers((ms) => [...ms, { name: "", relationship: "", share: "" }]);
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const familyTree = members
        .filter((m) => m.name.trim())
        .map((m) => ({
          name: m.name.trim(),
          relationship: m.relationship.trim() || "heir",
          share: m.share ? Number(m.share) : null,
        }));
      const res = await api<AffidavitResult>("/docs/affidavit", {
        method: "POST",
        body: JSON.stringify({
          deceasedName: deceased,
          applicantName: applicant,
          relationship,
          folioOrDpid: folio || undefined,
          familyTree,
          noObjectionFrom: [],
        }),
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate affidavit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-saffron-600">
        Transmission Copilot
      </p>
      <h1 className="mt-1 text-2xl font-bold">Generate share-transmission documents</h1>
      <p className="mt-2 text-ink-500">
        Enter the deceased&apos;s details and family tree. Sarthi builds the
        affidavit/NOC payload (the PDF renderer is Team B&apos;s engine module).
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <Field label="Deceased account holder's name">
          <input
            className="input"
            value={deceased}
            onChange={(e) => setDeceased(e.target.value)}
            placeholder="e.g. Ramesh Sharma"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Applicant (your) name">
            <input
              className="input"
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
            />
          </Field>
          <Field label="Relationship to deceased">
            <input
              className="input"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Son / Spouse"
            />
          </Field>
        </div>
        <Field label="Folio / DP ID (optional)">
          <input
            className="input"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
          />
        </Field>

        <div className="border-t border-ink-100 pt-4">
          <p className="mb-2 text-sm font-medium text-ink-600">Other legal heirs</p>
          {members.map((m, i) => (
            <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_90px]">
              <input
                className="input"
                placeholder="Name"
                value={m.name}
                onChange={(e) => setMember(i, { name: e.target.value })}
              />
              <input
                className="input"
                placeholder="Relationship"
                value={m.relationship}
                onChange={(e) => setMember(i, { relationship: e.target.value })}
              />
              <input
                className="input"
                placeholder="Share %"
                inputMode="numeric"
                value={m.share}
                onChange={(e) => setMember(i, { share: e.target.value })}
              />
            </div>
          ))}
          <button
            onClick={addMember}
            className="text-sm font-medium text-saffron-600 hover:text-saffron-700"
          >
            + Add heir
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={generate}
          disabled={busy || !deceased.trim() || !applicant.trim()}
          className="w-full rounded-xl bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Generating…" : "Generate affidavit payload"}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-3 font-bold text-blue-900">
              Dynamic transmission checklist
            </h3>
            <ol className="list-inside list-decimal space-y-1.5 text-sm text-blue-800">
              {result.checklist.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">🧾</span>
              <div>
                <p className="font-semibold">Affidavit draft ready for notarization</p>
                <p className="text-xs text-ink-400">
                  {result.mock
                    ? "Mock draft — connect a Gemini key to the engine for the live generation."
                    : "Generated by the engine."}
                </p>
              </div>
            </div>
            <textarea
              readOnly
              value={result.affidavitText}
              className="mt-4 min-h-[280px] w-full rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-xs leading-relaxed text-ink-700 outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(result.affidavitText)}
                className="rounded-xl bg-ink-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-700"
              >
                Copy text
              </button>
              {result.pdfBase64 && (
                <button
                  onClick={() =>
                    downloadPdf(result.pdfBase64!, "affidavit-transmission.pdf")
                  }
                  className="rounded-xl bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-700"
                >
                  ⬇ Download PDF
                </button>
              )}
              <button
                onClick={() =>
                  printText("Affidavit for Transmission of Shares", result.affidavitText)
                }
                className="rounded-xl border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                🖨 Print
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <TransmissionTracker />
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
