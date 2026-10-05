# sarthi-portal

Viraasat web app for the Sarthi stack. Next.js 14 with TypeScript and Tailwind. It shows a Legacy Wealth Map, flags missing nominees, builds an encrypted Family Vault, generates transmission and IEPF affidavits as PDFs, and runs in 23 Indian languages. It holds no API keys and calls the engine for AA data, docs, and OCR.

```
                 +----------------------+
                 | portal :3000         |
                 | app/ + components/   |
                 +----------+-----------+
                            |
        +-------------------+-------------------+
        |                   |                   |
  lib/api.ts          lib/nominee.ts        lib/vault.ts
  engine client       health score          AES-GCM vault
  AA consent          AA fetch              decryptor
  OCR upload          scope filter          PDF helpers
        |                   |                   |
        +-------------------+-------------------+
                            |
                 127.0.0.1:8787
                 sarthi-engine
```

## Pages

- `/` is the landing page with hero, connect call to action, stats, and three step explainer. Headings and CTAs switch language through `t()`.
- `/dashboard` runs the Account Aggregator consent wizard with aggregator pick, scope select, OTP, and fetch. It renders total mapped wealth, account count, the Nominee Health Score gauge, an at risk banner with one click nominee links, and grouped account cards. It also shows the read only account holder name used downstream.
- `/vault` creates the encrypted Legacy Vault with owner, trusted contact, phone, and passphrase, then offers HTML download, PDF summary download, and a decrypt section that accepts a received vault file plus passphrase and renders the accounts table.
- `/transmission` pulls a demat or mutual fund account from the Wealth Map through a dropdown, pre-fills folio plus deceased plus applicant plus relationship, collects shareholding and heir details plus gender and father name, generates the official SEBI affidavit text with checklist, and offers copy, PDF download, and print. It also shows the step tracker.
- `/iepf` accepts KYC plus certificate uploads, runs AI OCR name extraction, shows match or mismatch, generates a name discrepancy affidavit on mismatch with PDF download and print, routes company to Nodal Officer with RTA email, and tracks a claim readiness checklist that auto checks completed steps.

## Components

- `components/StoreProvider.tsx` keeps snapshot, connecting state, language, connect and disconnect, plus owner name updates. It persists snapshot and language in localStorage.
- `components/Navbar.tsx` renders brand, four nav links, and the 23 language dropdown with native script names.
- `components/ConsentFlow.tsx` implements the aggregator, scopes, OTP, connecting, and done steps. It calls `fetchWealthSnapshot`, which uses the engine in live mode and `lib/aa.ts` in offline mock mode.
- `components/HoldingRow.tsx` renders one account with brand logo, provider, masked number, value in INR, nominee state, and an add nominee link when missing.
- `components/NomineeGauge.tsx` renders the 0 to 100 SVG gauge with red, amber, and green bands plus nominee chips.
- `components/ProviderLogo.tsx` renders `/public/logos/*.png` by provider code and falls back to the account type glyph when a file is missing.
- `components/TransmissionTracker.tsx` renders the seven step transmission checklist with progress and localStorage persistence.
- `components/Checklist.tsx` renders the reusable checklist used by the IEPF page, including auto check for steps the user already completed.
- `components/EngineStatus.tsx` polls `/health` and shows online, mock, or offline state in the footer.

## Libraries

- `lib/api.ts` defines `API_BASE` from `NEXT_PUBLIC_API_BASE`, `MOCK_AA` from `NEXT_PUBLIC_MOCK_AA`, the `api()` envelope unwrapper, `uploadOcr()` multipart helper, `downloadPdf()` base64 helper, `printText()` print window helper, and health, OCR, affidavit, and nodal types.
- `lib/types.ts` mirrors the contracts with `AccountType`, `Holding`, `Fip`, `AaConsentResponse`, `AaFetchResponse` with `ownerName`, `WealthSnapshot`, `ApiEnvelope`, `GrievanceState`, `Affidavit`, plus UI constants for aggregators, scopes, and account type meta.
- `lib/nominee.ts` implements `computeNomineeHealth` with score, covered, missing, atRisk, verdict, and band, plus `fetchWealthSnapshot` with mock and engine paths and scope filtering for bank, demat, mutual fund, and insurance.
- `lib/vault.ts` implements PBKDF2 plus AES-GCM-256 encrypt and decrypt with Web Crypto, vault artifact creation, and `renderVaultHtml`, which embeds a self contained decryptor with passphrase input, account table, and trusted contact display.
- `lib/i18n.ts` defines 23 language codes with native names and the `t()` lookup with English fallback. Nav, hero, score, page headings, CTAs, how it works copy, and transmission form labels run through it.
- `lib/logos.ts` maps provider codes such as hdfc, sbi, icici, cdsl, nsdl, cams, lic, onemoney, finvu, setu, groww, upstox, zerodha, and angelone to `/logos/*.png`.
- `lib/aa.ts` holds the offline mock portfolio used when the engine is unreachable.
- `lib/utils.ts` holds INR formatting and class name joining.

## Static assets

`public/logos/` holds downloaded brand favicons. KFintech stays a manual drop because its site blocks favicon scraping.

## Environment and scripts

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8787
NEXT_PUBLIC_MOCK_AA=true
```

`NEXT_PUBLIC_MOCK_AA=true` uses the offline portfolio with no backend. Set it to `false` to call the engine `/aa/*` routes. Scripts include `dev`, `build`, `start`, `lint`, `sync:contracts` for vendoring canonical types, and `test:contracts` for `ajv` fixture validation against `sarthi-contracts` schemas.

## Run and test

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Then run checks:

```powershell
npx tsc --noEmit
npm run test:contracts
npm run build
```

`test:contracts` validates holding, AA fetch, grievance, affidavit, and envelope fixtures. `EngineStatus` in the footer confirms the portal reaches the engine.
