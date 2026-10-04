// Core data model for the Viraasat Legacy Wealth Map.
// Mirrors `sarthi-contracts` (run `npm run sync:contracts` to refresh).

export type AccountType =
  | "bank"
  | "demat"
  | "mutual_fund"
  | "insurance"
  | "ppf"
  | "fd";

// --- Canonical API envelope (shared with the engine) ---

export interface TokenUsage {
  in?: number;
  out?: number;
}

export interface Meta {
  tokens?: TokenUsage;
  costEstimateInr?: number;
  mock?: boolean;
}

export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data: T | null;
  meta: Meta;
  error: unknown;
}

// --- Account Aggregator response shapes (Setu/Finvu-like) ---

export type FipType = "DEPOSIT" | "INVESTMENTS" | "INSURANCE" | "PPF";

export interface Fip {
  fipId: string;
  type: FipType;
  data: Holding[];
}

export interface AaConsentArtefact {
  consentId: string;
  purpose: string;
  purposeCode: string;
  fipTypes: string[];
  expiresAt?: string;
}

export interface AaConsentResponse {
  consentId: string;
  artefact: AaConsentArtefact;
}

export interface AaFetchResponse {
  consentId: string;
  ownerName?: string;
  fips: Fip[];
}

export interface Nominee {
  name: string;
  relationship: string;
  /** Whether the nominee is verified across the source system. */
  verified: boolean;
}

export interface Holding {
  id: string;
  type: AccountType;
  /** The financial institution / Financial Information Provider (FIP). */
  provider: string;
  /** Short code used for routing & deep links. */
  providerCode: string;
  /** Human-friendly label, e.g. "Savings Account ••••4521". */
  label: string;
  maskedNumber?: string;
  /** Approximate value in INR, if the FIP shared it. */
  value?: number;
  /** Nominee on record, if any. */
  nominee?: Nominee;
  /** Account / folio / policy identifier. */
  identifier?: string;
  detail?: string;
  /** Deep link where the user can add/fix the nominee. */
  fixUrl?: string;
}

export interface AccountAggregator {
  id: string;
  name: string;
  tagline: string;
  /** Emoji or short glyph used as a lightweight logo. */
  glyph: string;
  color: string;
}

export interface ConsentScope {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface WealthSnapshot {
  aggregator: AccountAggregator;
  consentId: string;
  fetchedAt: string;
  /** Account holder (customer) name from the AA. */
  ownerName?: string;
  holdings: Holding[];
}

export const ACCOUNT_AGGREGATORS: AccountAggregator[] = [
  {
    id: "onemoney",
    name: "OneMoney",
    tagline: "Consent-based financial data sharing",
    glyph: "₹",
    color: "#0ea5e9",
  },
  {
    id: "cams",
    name: "CAMS Finserv",
    tagline: "India's trusted AA & RTA network",
    glyph: "C",
    color: "#7c3aed",
  },
  {
    id: "finvu",
    name: "Finvu",
    tagline: "Open finance by Sahamati",
    glyph: "F",
    color: "#16a34a",
  },
  {
    id: "setu",
    name: "Setu AA",
    tagline: "Data gateway for Bharat",
    glyph: "S",
    color: "#ea580c",
  },
];

export const CONSENT_SCOPES: ConsentScope[] = [
  {
    id: "bank",
    label: "Bank Accounts",
    description: "Savings, current & FD balances with nominee status",
    icon: "🏦",
  },
  {
    id: "demat",
    label: "Demat Holdings",
    description: "Shares held in CDSL / NSDL depositories",
    icon: "📈",
  },
  {
    id: "mutual_fund",
    label: "Mutual Funds",
    description: "Folios across CAMS & KFintech",
    icon: "💼",
  },
  {
    id: "insurance",
    label: "Insurance Policies",
    description: "Life & term policies with beneficiary data",
    icon: "🛡️",
  },
];

export const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; icon: string }
> = {
  bank: { label: "Bank Account", icon: "🏦" },
  demat: { label: "Demat / DP", icon: "📈" },
  mutual_fund: { label: "Mutual Fund", icon: "💼" },
  insurance: { label: "Insurance", icon: "🛡️" },
  ppf: { label: "PPF", icon: "🏛️" },
  fd: { label: "Fixed Deposit", icon: "🧾" },
};
