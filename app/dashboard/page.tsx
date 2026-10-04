"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { ConsentFlow } from "@/components/ConsentFlow";
import { NomineeGauge } from "@/components/NomineeGauge";
import { HoldingRow } from "@/components/HoldingRow";
import { computeNomineeHealth } from "@/lib/nominee";
import { ACCOUNT_TYPE_META } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { t } from "@/lib/i18n";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-6xl px-6 py-16">Loading…</div>}
    >
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const { snapshot, connected, disconnect, lang } = useStore();
  const searchParams = useSearchParams();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (searchParams.get("connect") === "1" && !connected) {
      setShowConsent(true);
    }
  }, [searchParams, connected]);

  if (!connected || !snapshot) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <span className="text-5xl">🗺️</span>
        <h1 className="mt-6 text-3xl font-bold">{t(lang, "page.dashboard.emptyTitle")}</h1>
        <p className="mt-3 max-w-md text-ink-500">
          Connect securely through the Account Aggregator framework to see every
          bank account, demat holding, mutual fund and policy — and whether a
          nominee protects each one.
        </p>
        <button
          onClick={() => setShowConsent(true)}
          className="mt-8 rounded-xl bg-saffron-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
        >
          Connect via Account Aggregator
        </button>
        {showConsent && <ConsentFlow onClose={() => setShowConsent(false)} />}
      </div>
    );
  }

  const health = computeNomineeHealth(snapshot.holdings);
  const totalValue = snapshot.holdings.reduce((s, h) => s + (h.value ?? 0), 0);
  const grouped = snapshot.holdings.reduce<Record<string, typeof snapshot.holdings>>(
    (acc, h) => {
      const key = ACCOUNT_TYPE_META[h.type].label;
      (acc[key] ??= []).push(h);
      return acc;
    },
    {},
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-saffron-600">
            Connected via {snapshot.aggregator.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{t(lang, "page.dashboard.wealthMap")}</h1>
          <p className="text-sm text-ink-400">
            Fetched {new Date(snapshot.fetchedAt).toLocaleString()} · Consent{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
              {snapshot.consentId}
            </code>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={disconnect}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50"
          >
            Disconnect
          </button>
          <Link
            href="/vault"
            className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            🛡️ Family Vault
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="text-sm text-ink-400">Total mapped wealth</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatINR(totalValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="text-sm text-ink-400">Accounts found</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {snapshot.holdings.length}
          </p>
          <p className="text-xs text-ink-400">
            {health.covered} protected · {health.missing} need action
          </p>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-5">
          <div>
            <p className="text-sm text-ink-400">{t(lang, "score.healthy")}</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                health.band === "red"
                  ? "text-red-600"
                  : health.band === "amber"
                    ? "text-amber-600"
                    : "text-forest-600"
              }`}
            >
              {health.missing > 0
                ? t(lang, "score.action")
                : t(lang, "score.clear")}
            </p>
          </div>
          <NomineeGauge health={health} />
        </div>
      </div>

      {/* At-risk banner */}
      {health.atRisk.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold text-amber-800">
            ⚠ {health.atRisk.length} account
            {health.atRisk.length > 1 ? "s" : ""} need
            {health.atRisk.length > 1 ? "" : "s"} a nominee
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            Without a nominee, these accounts can become unclaimed wealth and
            trap your family in legal delays. Fix them with one click.
          </p>
          <div className="mt-4 grid gap-3">
            {health.atRisk.map((h) => (
              <HoldingRow key={h.id} holding={h} />
            ))}
          </div>
        </div>
      )}

      {/* All accounts grouped */}
      <div className="mt-8 space-y-8">
        {Object.entries(grouped).map(([group, holdings]) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
              {group}
            </h2>
            <div className="grid gap-3">
              {holdings.map((h) => (
                <HoldingRow key={h.id} holding={h} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Next step */}
      <div className="mt-10 rounded-2xl border border-forest-200 bg-forest-50 p-6 text-center">
        <h2 className="text-lg font-bold text-forest-800">
          Protect this map for the people you love
        </h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-forest-700">
          Generate an encrypted Legacy Vault your family can open if something
          happens to you.
        </p>
        <Link
          href="/vault"
          className="mt-4 inline-flex rounded-xl bg-forest-600 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Open Family Vault →
        </Link>
      </div>
    </div>
  );
}
