import {
  Holding,
  WealthSnapshot,
  AccountAggregator,
  AaConsentResponse,
  AaFetchResponse,
} from "./types";
import { MOCK_PORTFOLIO } from "./aa";
import { api, MOCK_AA } from "./api";

export interface NomineeHealth {
  score: number;
  total: number;
  covered: number;
  missing: number;
  /** Accounts that still need a nominee — the action list. */
  atRisk: Holding[];
  /** A plain-language, senior-friendly verdict. */
  verdict: string;
  /** Color band for the gauge. */
  band: "red" | "amber" | "green";
}

export function computeNomineeHealth(holdings: Holding[]): NomineeHealth {
  const total = holdings.length;
  const covered = holdings.filter(
    (h) => h.nominee?.verified,
  ).length;
  const missing = total - covered;
  const score = total === 0 ? 0 : Math.round((covered / total) * 100);

  const atRisk = holdings.filter(
    (h) => !h.nominee?.verified,
  );

  let band: NomineeHealth["band"] = "red";
  let verdict = "Several accounts are unprotected.";
  if (score >= 80) {
    band = "green";
    verdict = "Excellent — nearly everything is protected.";
  } else if (score >= 50) {
    band = "amber";
    verdict = "Getting there — a few accounts still need nominees.";
  }

  return { score, total, covered, missing, atRisk, verdict, band };
}

/** AA consent + fetch. Offline mock (MOCK_AA) or the Sarthi Core engine. */
export async function fetchWealthSnapshot(
  aggregator: AccountAggregator,
  scopes: string[],
): Promise<WealthSnapshot> {
  if (MOCK_AA) return fetchMockSnapshot(aggregator, scopes);
  return fetchEngineSnapshot(aggregator, scopes);
}

/** Zero-backend fallback (demo works without the engine running). */
async function fetchMockSnapshot(
  aggregator: AccountAggregator,
  scopes: string[],
): Promise<WealthSnapshot> {
  await sleep(1200);
  const scopeMap: Record<string, string[]> = {
    bank: ["bank", "fd", "ppf"],
    demat: ["demat"],
    mutual_fund: ["mutual_fund"],
    insurance: ["insurance"],
  };
  const allowedTypes = scopes.flatMap((s) => scopeMap[s] ?? []);
  const holdings = allowedTypes.length
    ? MOCK_PORTFOLIO.filter((h) => allowedTypes.includes(h.type))
    : MOCK_PORTFOLIO;
  return {
    aggregator,
    consentId: `ca-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    fetchedAt: new Date().toISOString(),
    holdings,
  };
}

/** Real AA flow against the engine: consent -> verify -> fetch, then flatten FIPs. */
async function fetchEngineSnapshot(
  aggregator: AccountAggregator,
  scopes: string[],
): Promise<WealthSnapshot> {
  const consent = await api<AaConsentResponse>("/aa/consent", {
    method: "POST",
    body: JSON.stringify({ aggregatorId: aggregator.id, scopes }),
  });

  // The AA mock accepts any OTP; the UI's OTP step remains cosmetic for now.
  await api<{ verified: boolean }>("/aa/verify", {
    method: "POST",
    body: JSON.stringify({ consentId: consent.consentId }),
  });

  const fetched = await api<AaFetchResponse>("/aa/fetch", {
    method: "POST",
    body: JSON.stringify({ consentId: consent.consentId }),
  });

  const holdings = fetched.fips.flatMap((fip) => fip.data);

  return {
    aggregator,
    consentId: consent.consentId,
    fetchedAt: new Date().toISOString(),
    holdings,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
