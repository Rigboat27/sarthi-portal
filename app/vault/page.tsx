"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { t } from "@/lib/i18n";
import {
  createLegacyVault,
  renderVaultHtml,
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
          <p className="mt-3 text-xs text-forest-700">
            Share this file with <strong>{trustedContact || "your trusted contact"}</strong> along
            with the passphrase — never store them together.
          </p>
        </div>
      )}
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
