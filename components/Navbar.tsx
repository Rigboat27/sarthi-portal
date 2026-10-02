"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "./StoreProvider";
import { t, StringKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV: { href: string; key: StringKey; soon?: boolean }[] = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/vault", key: "nav.vault" },
  { href: "/transmission", key: "nav.transmission", soon: true },
  { href: "/iepf", key: "nav.iepf", soon: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { lang, setLang } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-lg font-bold text-white shadow-sm">
            स
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight">
              Sarthi
            </span>
            <span className="-mt-1 block text-[11px] font-medium text-ink-400">
              Viraasat · वि·रा·सत
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
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

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-ink-200 p-0.5">
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                  lang === l
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:text-ink-900",
                )}
              >
                {l === "en" ? "EN" : "हि"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
