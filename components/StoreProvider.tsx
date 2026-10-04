"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  WealthSnapshot,
  AccountAggregator,
} from "@/lib/types";
import { fetchWealthSnapshot } from "@/lib/nominee";
import { Lang, LANGUAGES } from "@/lib/i18n";

interface StoreValue {
  snapshot: WealthSnapshot | null;
  connecting: boolean;
  connected: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  connect: (aggregator: AccountAggregator, scopes: string[]) => Promise<void>;
  disconnect: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const SNAPSHOT_KEY = "sarthi.viraasat.snapshot";
const LANG_KEY = "sarthi.viraasat.lang";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<WealthSnapshot | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (raw) setSnapshot(JSON.parse(raw) as WealthSnapshot);
      const l = localStorage.getItem(LANG_KEY);
      if (l && LANGUAGES.some((x) => x.code === l)) setLangState(l as Lang);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (snapshot)
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      else localStorage.removeItem(SNAPSHOT_KEY);
    } catch {
      /* ignore */
    }
  }, [snapshot]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(
    async (aggregator: AccountAggregator, scopes: string[]) => {
      setConnecting(true);
      try {
        const snap = await fetchWealthSnapshot(aggregator, scopes);
        setSnapshot(snap);
      } finally {
        setConnecting(false);
      }
    },
    [],
  );

  const disconnect = useCallback(() => setSnapshot(null), []);

  const value = useMemo<StoreValue>(
    () => ({
      snapshot,
      connecting,
      connected: snapshot != null,
      lang,
      setLang,
      connect,
      disconnect,
    }),
    [snapshot, connecting, lang, setLang, connect, disconnect],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
