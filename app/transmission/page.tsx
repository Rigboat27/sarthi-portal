"use client";

import { useState } from "react";
import Link from "next/link";
import { api, AffidavitResult, downloadPdf, printText } from "@/lib/api";
import { TransmissionTracker } from "@/components/TransmissionTracker";

interface HeirInput {
  name: string;
  age: string;
  relationship: string;
}

export default function TransmissionPage() {
  // deceased
  const [deceased, setDeceased] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [placeOfDeath, setPlaceOfDeath] = useState("");
  // applicant
  const [applicant, setApplicant] = useState("");
  const [relationship, setRelationship] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  // shareholding
  const [company, setCompany] = useState("");
  const [folio, setFolio] = useState("");
  const [certNos, setCertNos] = useState("");
  const [distinctiveNos, setDistinctiveNos] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [shares, setShares] = useState("");
  // heirs
  const [heirs, setHeirs] = useState<HeirInput[]>([
    { name: "", age: "", relationship: "" },
  ]);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AffidavitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setHeir(i: number, patch: Partial<HeirInput>) {
    setHeirs((hs) => hs.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }
  function addHeir() {
    setHeirs((hs) => [...hs, { name: "", age: "", relationship: "" }]);
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const familyTree = heirs
        .filter((h) => h.name.trim())
        .map((h) => ({
          name: h.name.trim(),
          relationship: h.relationship.trim() || "heir",
          age: h.age.trim() || null,
        }));
      const res = await api<AffidavitResult>("/docs/affidavit", {
        method: "POST",
        body: JSON.stringify({
          deceasedName: deceased,
          applicantName: applicant,
          relationship,
          applicantAge: age.trim() || null,
          applicantAddress: address.trim() || null,
          companyName: company.trim() || null,
          folioOrDpid: folio.trim() || null,
          certificateNos: certNos.trim() || null,
          distinctiveNos: distinctiveNos.trim() || null,
          faceValue: faceValue.trim() || null,
          numberOfShares: shares.trim() || null,
          dateOfDeath: dateOfDeath.trim() || null,
          placeOfDeath: placeOfDeath.trim() || null,
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
      <h1 className="mt-1 text-2xl font-bold">Generate the transmission affidavit</h1>
      <p className="mt-2 text-ink-500">
        Fill in the details and Sarthi produces the official SEBI affidavit for
        transmission of shares, ready to print on stamp paper and notarize.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border border-ink-200 bg-white p-6">
        {/* Deceased */}
        <Section title="Deceased shareholder">
          <Field label="Full name">
            <input className="input" value={deceased} onChange={(e) => setDeceased(e.target.value)} placeholder="e.g. Ramesh Sharma" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of death">
              <input className="input" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} placeholder="e.g. 12 June 2025" />
            </Field>
            <Field label="Place of death">
              <input className="input" value={placeOfDeath} onChange={(e) => setPlaceOfDeath(e.target.value)} placeholder="e.g. Mumbai" />
            </Field>
          </div>
        </Section>

        {/* Applicant */}
        <Section title="Applicant (you)">
          <Field label="Your full name">
            <input className="input" value={applicant} onChange={(e) => setApplicant(e.target.value)} placeholder="e.g. Priya Sharma" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Relation to deceased">
              <input className="input" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Spouse / Son / Daughter" />
            </Field>
            <Field label="Your age">
              <input className="input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 38" />
            </Field>
          </div>
          <Field label="Residential address">
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 12 MG Road, Mumbai" />
          </Field>
        </Section>

        {/* Shareholding */}
        <Section title="Shareholding details">
          <Field label="Company name">
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Reliance Industries Ltd" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Folio No.">
              <input className="input" value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="e.g. 98765432/44" />
            </Field>
            <Field label="Number of shares">
              <input className="input" value={shares} onChange={(e) => setShares(e.target.value)} placeholder="e.g. 100" />
            </Field>
            <Field label="Certificate No(s).">
              <input className="input" value={certNos} onChange={(e) => setCertNos(e.target.value)} placeholder="e.g. 112233 / 445566" />
            </Field>
            <Field label="Distinctive Nos.">
              <input className="input" value={distinctiveNos} onChange={(e) => setDistinctiveNos(e.target.value)} placeholder="e.g. 1001 to 1100" />
            </Field>
          </div>
          <Field label="Face value (Rs. per share)">
            <input className="input" value={faceValue} onChange={(e) => setFaceValue(e.target.value)} placeholder="e.g. 10" />
          </Field>
        </Section>

        {/* Heirs */}
        <Section title="Legal heirs (family tree)">
          <p className="text-sm text-ink-500">
            List every legal heir, including yourself if you inherit jointly.
          </p>
          {heirs.map((h, i) => (
            <div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_70px_1fr]">
              <input className="input" placeholder="Name" value={h.name} onChange={(e) => setHeir(i, { name: e.target.value })} />
              <input className="input" placeholder="Age" value={h.age} onChange={(e) => setHeir(i, { age: e.target.value })} />
              <input className="input" placeholder="Relationship" value={h.relationship} onChange={(e) => setHeir(i, { relationship: e.target.value })} />
            </div>
          ))}
          <button onClick={addHeir} className="text-sm font-medium text-saffron-600 hover:text-saffron-700">
            + Add heir
          </button>
        </Section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={generate}
          disabled={busy || !deceased.trim() || !applicant.trim()}
          className="w-full rounded-xl bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Generating…" : "Generate affidavit (PDF)"}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-3 font-bold text-blue-900">Next steps checklist</h3>
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
                <p className="font-semibold">Affidavit draft — ready for stamp paper</p>
                <p className="text-xs text-ink-400">
                  Official SEBI format. Download as PDF and print on ₹100 stamp paper.
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
                  onClick={() => downloadPdf(result.pdfBase64!, "affidavit-transmission.pdf")}
                  className="rounded-xl bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-700"
                >
                  ⬇ Download PDF
                </button>
              )}
              <button
                onClick={() => printText("Affidavit for Transmission of Shares", result.affidavitText)}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 border-t border-ink-100 pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm font-bold text-ink-800">{title}</p>
      {children}
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
