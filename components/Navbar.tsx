"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./StoreProvider";
import { t, StringKey, LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV: { href: string; key: StringKey; soon?: boolean }[] = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/vault", key: "nav.vault" },
  { href: "/transmission", key: "nav.transmission" },
  { href: "/iepf", key: "nav.iepf" },
];

export function Navbar() {
  const pathname = usePathname();
  const { lang, setLang } = useStore();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-lg font-bold text-white shadow-sm">
            स
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight">Sarthi</span>
            <span className="-mt-1 block text-[11px] font-medium text-ink-400">
              Viraasat · वि·रा·सत
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-saffron-50 text-saffron-700"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
              )}
            >
              {t(lang, item.key)}
              {item.soon && (
                <span className="ml-1.5 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
                  soon
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span aria-hidden>🌐</span>
            <span>{current.name}</span>
            <span className="text-ink-400">▾</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-1 max-h-80 w-56 overflow-y-auto rounded-xl border border-ink-200 bg-white py-1 shadow-lg"
              >
                {LANGUAGES.map((l) => (
                  <li key={l.code}>
                    <button
                      role="option"
                      aria-selected={l.code === lang}
                      onClick={() => {
                        setLang(l.code);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-ink-50",
                        l.code === lang ? "bg-saffron-50 font-semibold text-saffron-700" : "text-ink-700",
                      )}
                    >
                      <span>{l.name}</span>
                      <span className="text-[11px] text-ink-400">{l.english}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
