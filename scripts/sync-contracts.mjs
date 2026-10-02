// Syncs shared contract types from the sibling `sarthi-contracts` repo into
// lib/contracts.ts so the portal stays on the single source of truth without a
// git submodule. Run: npm run sync:contracts
//
// Note: lib/types.ts currently mirrors these types by hand; this script vendors
// the canonical copy for reference and future import. The UI-facing constants
// (ACCOUNT_AGGREGATORS, CONSENT_SCOPES, ACCOUNT_TYPE_META) stay local on purpose.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..", "..", "sarthi-contracts", "types", "index.ts");
const dest = resolve(here, "..", "lib", "contracts.ts");

if (!existsSync(src)) {
  console.warn(`[sync:contracts] source not found at ${src} — skipping.`);
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
const banner = `// AUTO-GENERATED from sarthi-contracts by scripts/sync-contracts.mjs — do not edit.\n`;
writeFileSync(dest, banner + readFileSync(src, "utf-8"));
console.log(`[sync:contracts] synced ${src} -> ${dest}`);
