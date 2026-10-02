"use client";

import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { t } from "@/lib/i18n";

export default function HomePage() {
  const { lang, connected } = useStore();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-saffron-50 px-3 py-1 text-xs font-semibold text-saffron-700">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron-500" />
            {t(lang, "hero.eyebrow")}
          </span>
          <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {t(lang, "hero.title")}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-500">
            {t(lang, "hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={connected ? "/dashboard" : "/dashboard?connect=1"}
              className="inline-flex items-center gap-2 rounded-xl bg-saffron-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-700"
            >
              <span className="text-base">₹</span>
              {t(lang, "cta.connect")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
            >
              {t(lang, "cta.demo")} →
            </Link>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["100%", "Consent-based"],
              ["0", "Stock tips"],
              ["24×7", "On your side"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-bold text-ink-900">{v}</dt>
                <dd className="mt-1 text-xs text-ink-500">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-saffron-100 via-transparent to-forest-100 blur-2xl" />
          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Nominee Health Score</p>
                <p className="text-xs text-ink-400">6 of 9 accounts protected</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">
                67%
              </span>
            </div>
            <div className="mb-6 h-3 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-saffron-500 to-forest-500"
                style={{ width: "67%" }}
              />
            </div>

            <ul className="space-y-3">
              {[
                { icon: "🏦", name: "SBI Savings", ok: false },
                { icon: "📈", name: "CDSL Demat", ok: false },
                { icon: "💼", name: "KFintech ELSS", ok: false },
                { icon: "🛡️", name: "LIC Policy", ok: true },
              ].map((a) => (
                <li
                  key={a.name}
                  className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3"
                >
                  <span className="flex items-center gap-3 text-sm font-medium">
                    <span>{a.icon}</span> {a.name}
                  </span>
                  <span
                    className={
                      a.ok
                        ? "rounded-full bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700"
                        : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
                    }
                  >
                    {a.ok ? "Nominee ✓" : "No nominee"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-200 py-14">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Give consent",
              d: "Pick an Account Aggregator like OneMoney and approve a one-time, purpose-bound consent. No passwords shared.",
            },
            {
              n: "2",
              t: "We map everything",
              d: "Banks, demat, mutual funds and insurance appear in one place with their nominee status clearly flagged.",
            },
            {
              n: "3",
              t: "Fix & secure",
              d: "Follow direct links to register missing nominees, then generate an encrypted Legacy Vault for your family.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-ink-200 bg-white p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
