"use client";

import { useState } from "react";
import {
  ACCOUNT_AGGREGATORS,
  CONSENT_SCOPES,
  AccountAggregator,
} from "@/lib/types";
import { useStore } from "./StoreProvider";
import { ProviderLogo } from "./ProviderLogo";
import { cn } from "@/lib/utils";

type Step = "aggregator" | "scopes" | "otp" | "connecting" | "done";

export function ConsentFlow({ onClose }: { onClose: () => void }) {
  const { connect } = useStore();
  const [step, setStep] = useState<Step>("aggregator");
  const [aggregator, setAggregator] = useState<AccountAggregator | null>(null);
  const [scopes, setScopes] = useState<string[]>(["bank", "demat", "mutual_fund", "insurance"]);
  const [otp, setOtp] = useState("");

  const toggleScope = (id: string) =>
    setScopes((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const handleConnect = async () => {
    if (!aggregator) return;
    setStep("connecting");
    await connect(aggregator, scopes);
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-saffron-600">
              Account Aggregator · Consent
            </p>
            <h2 className="text-lg font-bold">Connect your accounts</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 px-6 pt-4">
          {(["aggregator", "scopes", "otp"] as Step[]).map((s, i) => {
            const active =
              step === s || (step === "connecting") || (step === "done");
            return (
              <div key={s} className="flex flex-1 items-center gap-1">
                <div
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    active ? "bg-saffron-500" : "bg-ink-100",
                  )}
                />
                {i < 2 && null}
              </div>
            );
          })}
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === "aggregator" && (
            <div className="space-y-3">
              <p className="text-sm text-ink-500">
                Choose your Account Aggregator. They fetch data from your banks
                &amp; depositories on your behalf — never sharing passwords.
              </p>
              {ACCOUNT_AGGREGATORS.map((aa) => (
                <button
                  key={aa.id}
                  onClick={() => {
                    setAggregator(aa);
                    setStep("scopes");
                  }}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                    aggregator?.id === aa.id
                      ? "border-saffron-400 bg-saffron-50"
                      : "border-ink-200 hover:border-ink-300 hover:bg-ink-50",
                  )}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-ink-200">
                    <ProviderLogo code={aa.id} fallback={aa.glyph} className="h-7 w-7" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{aa.name}</span>
                    <span className="block text-xs text-ink-400">
                      {aa.tagline}
                    </span>
                  </span>
                  <span className="text-ink-300">→</span>
                </button>
              ))}
            </div>
          )}

          {step === "scopes" && aggregator && (
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm">
                <p className="font-semibold">
                  Consent via {aggregator.name}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  Purpose: <strong>Wealth mapping &amp; nominee check</strong> ·
                  Duration: one-time fetch · Purpose code: FI-ACCOUNT
                </p>
              </div>
              <p className="text-sm text-ink-500">
                Select what Sarthi may read:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONSENT_SCOPES.map((scope) => {
                  const on = scopes.includes(scope.id);
                  return (
                    <button
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                        on
                          ? "border-forest-400 bg-forest-50"
                          : "border-ink-200 hover:border-ink-300",
                      )}
                    >
                      <span className="text-xl">{scope.icon}</span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {scope.label}
                        </span>
                        <span className="block text-xs text-ink-400">
                          {scope.description}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "ml-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                          on
                            ? "border-forest-500 bg-forest-500 text-white"
                            : "border-ink-300 text-transparent",
                        )}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                <p className="text-sm font-semibold">
                  Verify consent with {aggregator?.name}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  In production, {aggregator?.name} sends an OTP / biometric
                  prompt to approve the consent artefact. For the demo, enter
                  any 6 digits.
                </p>
              </div>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                inputMode="numeric"
                className="w-full rounded-xl border border-ink-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-saffron-500 focus:outline-none"
              />
            </div>
          )}

          {step === "connecting" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="pulse-ring flex h-16 w-16 items-center justify-center rounded-full bg-saffron-100 text-2xl">
                🔄
              </div>
              <p className="mt-4 font-semibold">
                Fetching your accounts…
              </p>
              <p className="mt-1 max-w-xs text-xs text-ink-400">
                Consent artefact → {aggregator?.name} → FIPs (bank / depository
                / AMC) → Sarthi
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-100 text-2xl">
                ✅
              </div>
              <p className="mt-4 font-semibold">Your wealth map is ready</p>
              <p className="mt-1 text-sm text-ink-500">
                We found your accounts and flagged the ones missing nominees.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-ink-100 px-6 py-4">
          {step === "aggregator" && (
            <button
              onClick={onClose}
              className="ml-auto text-sm font-medium text-ink-400 hover:text-ink-600"
            >
              Cancel
            </button>
          )}

          {(step === "scopes" || step === "otp") && (
            <>
              <button
                onClick={() =>
                  setStep((s) => (s === "otp" ? "scopes" : "aggregator"))
                }
                className="text-sm font-medium text-ink-400 hover:text-ink-600"
              >
                ← Back
              </button>
              <button
                disabled={
                  (step === "scopes" && scopes.length === 0) ||
                  (step === "otp" && otp.length < 6)
                }
                onClick={() =>
                  step === "scopes" ? setStep("otp") : handleConnect()
                }
                className="rounded-xl bg-saffron-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-saffron-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === "otp" ? "Approve & connect" : "Continue"}
              </button>
            </>
          )}

          {step === "done" && (
            <button
              onClick={onClose}
              className="ml-auto rounded-xl bg-ink-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
            >
              View my wealth map
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
