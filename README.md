# sarthi-portal (Viraasat)

The Viraasat web portal — a Next.js 14 app and one of the three clients of the
**Sarthi Core** engine. It builds a Legacy Wealth Map from Account Aggregator data,
flags missing nominees, and offers transmission / IEPF helpers.

## Relationship to the rest of the stack

```
portal (this repo, :3000)  ──►  engine (FastAPI, :8787)
                                    ├── /aa/*   AA mock (Setu/Finvu shape)
                                    ├── /docs/* OCR · fuzzy match · affidavit
                                    ├── /speech/* · /llm/chat   (extension's providers)
                                    └── /data/* SEBI rules + broker directory
```

The portal never talks to vendors directly and holds no keys.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
```

Env (copy `.env.example` → `.env.local`):

- `NEXT_PUBLIC_API_BASE` — engine URL (default `http://127.0.0.1:8787`)
- `NEXT_PUBLIC_MOCK_AA` — `true` (default) uses the offline AA mock in `lib/aa.ts`
  with no backend; `false` calls the engine's `/aa/*` endpoints.

To demo the **full stack**:

```bash
# terminal 1 — engine
cd ../sarthi-engine && python run.py

# terminal 2 — portal (engine-connected)
NEXT_PUBLIC_MOCK_AA=false npm run dev
```

A footer on every page shows live engine connectivity (`/health`).

## Contract sync

`npm run sync:contracts` vendors the canonical types from the sibling
`sarthi-contracts` repo into `lib/contracts.ts`. `lib/types.ts` mirrors those
types plus local UI constants (`ACCOUNT_AGGREGATORS`, `CONSENT_SCOPES`).

## Pages

| Route | What it does |
|---|---|
| `/` | Landing + how-it-works |
| `/dashboard` | AA consent wizard → nominee audit (Nominee Health Score) |
| `/vault` | AES-GCM encrypted Legacy Vault (client-side, Web Crypto) |
| `/transmission` | Affidavit payload → `/docs/affidavit` |
| `/iepf` | Name-mismatch check → `/docs/match` |
