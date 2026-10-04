"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { t } from "@/lib/i18n";
import { api, downloadPdf } from "@/lib/api";
import {
  createLegacyVault,
  renderVaultHtml,
  decryptVault,
  VaultArtifact,
} from "@/lib/vault";

export default function VaultPage() {
  const { snapshot, lang } = useStore();

  const [owner, setOwner] = useState("");
  const [trustedContact, setTrustedContact] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [artifact, setArtifact] = useState<VaultArtifact | null>(null);

  // Decrypt (consumer) state
  const [vaultInput, setVaultInput] = useState<VaultArtifact | null>(null);
  const [decryptPass, setDecryptPass] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decrypted, setDecrypted] = useState<{
    owner: string;
    trustedContact: string;
    contactPhone?: string;
    accounts: Array<{ provider: string; label: string; maskedNumber?: string; nominee?: string; value?: number }>;
  } | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Pre-fill the account holder's name from the connected Wealth Map.
  useEffect(() => {
    if (snapshot?.ownerName && !owner) setOwner(snapshot.ownerName);
  }, [snapshot?.ownerName, owner]);

  async function handleVaultFile(file: File) {
    setDecryptError(null);
    setDecrypted(null);
    try {
      const text = await file.text();
      const m = text.match(/const ARTIFACT\s*=\s*(\{[\s\S]*?\});/);
      const json = m ? m[1] : text.trim();
      setVaultInput(JSON.parse(json) as VaultArtifact);
    } catch {
      setDecryptError("Could not read that file — upload the .html Legacy Vault.");
    }
  }

  async function doDecrypt() {
    if (!vaultInput) return;
    setDecrypting(true);
    setDecryptError(null);
    try {
      const plain = await decryptVault(vaultInput, decryptPass);
      setDecrypted(JSON.parse(plain));
    } catch {
      setDecryptError("Wrong passphrase or corrupted vault.");
    } finally {
      setDecrypting(false);
    }
  }

  if (!snapshot) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <span className="text-5xl">🛡️</span>
        <h1 className="mt-6 text-2xl font-bold">Family Vault</h1>
        <p className="mt-3 text-ink-500">
          Connect your accounts first, then Sarthi can bundle them into an
          encrypted Legacy Vault for your family.
        </p>
        <Link
          href="/dashboard?connect=1"
          className="mt-8 rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white hover:bg-saffron-700"
        >
          Connect accounts first
        </Link>
      </div>
    );
  }

  const passOk =
    passphrase.length >= 8 &&
    passphrase === confirm;

  async function generate() {
    if (!passOk) return;
    setBusy(true);
    try {
      const art = await createLegacyVault({
        owner: owner || "Account Holder",
        trustedContact,
        contactPhone,
        snapshot: snapshot!,
        passphrase,
      });
      setArtifact(art);
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!artifact) return;
    const html = renderVaultHtml(artifact);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sarthi-viraasat-legacy-vault.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadVaultPdf() {
    try {
      const accounts = snapshot!.holdings.map((h) => ({
        provider: h.provider,
        label: h.label,
        maskedNumber: h.maskedNumber ?? "",
        value: h.value ?? 0,
        nomineeName: h.nominee?.verified
          ? `${h.nominee.name} (${h.nominee.relationship})`
          : null,
      }));
      const res = await api<{ pdfBase64: string }>("/docs/vault-pdf", {
        method: "POST",
        body: JSON.stringify({ owner: owner || "Account Holder", accounts }),
      });
      downloadPdf(res.pdfBase64, "sarthi-viraasat-legacy-vault.pdf");
    } catch (e) {
      console.error("vault pdf failed", e);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-saffron-600">
        Family Vault
      </p>
      <h1 className="mt-1 text-2xl font-bold">{t(lang, "page.vault.title")}</h1>
      <p className="mt-2 text-ink-500">
        Sarthi encrypts your {snapshot.holdings.length} accounts into a single
        file your trusted contact can decrypt only with the passphrase you
        choose.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-6">
        <Field label="Your full name">
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="e.g. Ramesh Sharma"
            className="input"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trusted contact">
            <input
              value={trustedContact}
              onChange={(e) => setTrustedContact(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="input"
            />
          </Field>
          <Field label="Their phone">
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 …"
              inputMode="tel"
              className="input"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vault passphrase (min 8 chars)">
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </Field>
          <Field label="Confirm passphrase">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </Field>
        </div>

        {confirm.length > 0 && !passOk && (
          <p className="text-sm text-red-600">
            Passphrases must match and be at least 8 characters.
          </p>
        )}

        <button
          onClick={generate}
          disabled={!passOk || busy}
          className="w-full rounded-xl bg-forest-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Encrypting…" : `🔒 ${t(lang, "page.vault.encrypt")}`}
        </button>
      </div>

      {artifact && (
        <div className="mt-6 rounded-2xl border border-forest-200 bg-forest-50 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-600 text-lg text-white">
              🔒
            </span>
            <div>
              <p className="font-bold text-forest-800">Vault created</p>
              <p className="text-sm text-forest-700">
                AES-GCM encrypted · {artifact.accountCount} accounts ·{" "}
                {new Date(artifact.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={download}
            className="mt-4 w-full rounded-xl bg-forest-600 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-700"
          >
            ⬇ Download Legacy Vault (.html)
          </button>
          <button
            onClick={downloadVaultPdf}
            className="mt-2 w-full rounded-xl bg-ink-900 px-6 py-3 text-sm font-semibold text-white hover:bg-ink-800"
          >
            ⬇ Download PDF (printable summary)
          </button>
          <p className="mt-3 text-xs text-forest-700">
            Share this file with <strong>{trustedContact || "your trusted contact"}</strong> along
            with the passphrase — never store them together.
          </p>
        </div>
      )}

      {/* Decrypt a received vault (for the family member / consumer) */}
      <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="text-lg font-bold">🔓 Decrypt a Legacy Vault</h2>
        <p className="mt-1 text-sm text-ink-500">
          Received a <code className="rounded bg-ink-100 px-1">.html</code> Legacy
          Vault from a family member? Upload it and enter the passphrase to view
          the accounts.
        </p>

        <div className="mt-4 space-y-3">
          <input
            type="file"
            accept=".html,text/html"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVaultFile(f);
            }}
            className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink-800"
          />
          {vaultInput && (
            <p className="text-xs text-forest-700">
              ✓ Loaded vault for <strong>{vaultInput.owner}</strong> ·{" "}
              {vaultInput.accountCount} accounts
            </p>
          )}
          <Field label="Passphrase">
            <input
              type="password"
              value={decryptPass}
              onChange={(e) => setDecryptPass(e.target.value)}
              placeholder="Family Vault passphrase"
              className="input"
            />
          </Field>
          <button
            onClick={doDecrypt}
            disabled={!vaultInput || !decryptPass || decrypting}
            className="w-full rounded-xl bg-forest-600 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-40"
          >
            {decrypting ? "Decrypting…" : "Decrypt"}
          </button>

          {decryptError && (
            <p className="text-sm text-red-600">{decryptError}</p>
          )}

          {decrypted && (
            <div className="mt-4 rounded-xl bg-ink-50 p-4">
              <p className="text-sm font-semibold">
                {decrypted.owner} · Trusted contact: {decrypted.trustedContact}
                {decrypted.contactPhone ? ` · ${decrypted.contactPhone}` : ""}
              </p>
              <ul className="mt-3 space-y-2">
                {decrypted.accounts.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span>
                      {a.provider} · {a.label}
                      {a.maskedNumber ? ` ${a.maskedNumber}` : ""}
                    </span>
                    <span
                      className={
                        a.nominee && !a.nominee.startsWith("NO NOMINEE")
                          ? "text-forest-700"
                          : "text-red-600"
                      }
                    >
                      {a.nominee || "No nominee"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-600">
        {label}
      </span>
      {children}
    </label>
  );
}
