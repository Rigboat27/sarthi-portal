// Contract test: validate sample fixtures against the sarthi-contracts JSON Schemas.
// Runs with plain Node (no framework). Skips cleanly if the contracts repo isn't beside this one.
// Usage: npm run test:contracts
import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const schemasDir = resolve(here, "..", "..", "sarthi-contracts", "schemas");

if (!existsSync(schemasDir)) {
  console.warn("[contracts] sarthi-contracts not found beside sarthi-portal — skipping.");
  process.exit(0);
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
const load = (name) => JSON.parse(readFileSync(resolve(schemasDir, name), "utf8"));

let failures = 0;
function check(name, instance) {
  const validate = ajv.compile(load(name));
  if (validate(instance)) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
    for (const e of validate.errors ?? []) {
      console.error(`       ${e.instancePath || "(root)"} ${e.message}`);
    }
  }
}

const holding = {
  id: "h1",
  type: "bank",
  provider: "HDFC Bank",
  providerCode: "hdfc",
  label: "Savings Account",
  maskedNumber: "••••4521",
  value: 185400,
  nominee: { name: "Priya Sharma", relationship: "Spouse", verified: true },
};

const aaFetch = {
  consentId: "ca-test",
  fips: [{ fipId: "HDFC", type: "DEPOSIT", data: [holding] }],
};

const grievance = {
  complaintCategory: "non-receipt of funds",
  entityName: "Groww",
  entityType: "broker",
  clientIdFolioNoDpid: "ABCDE1234F",
  issueSummaryEnglish: "Broker did not credit sale proceeds.",
  issueSummaryOriginal: "मेरा पैसा नहीं आया",
  incidentDate: "2026-03-03",
  amountInvolved: 40000,
  priorContactDate: null,
  priorContactProof: "emailed",
  priorContactConfirmed: true,
  priorContactTicket: null,
  userName: null,
  userPhone: null,
  soldDescription: null,
  reliefSought: "Credit my sale proceeds",
  attachments: [],
  userLanguage: "hi-IN",
  skippedFields: [],
};

const affidavit = {
  deceasedName: "Ramesh Sharma",
  applicantName: "Priya Sharma",
  relationship: "Spouse",
  gender: "female",
  fatherName: "Ramprasad Sharma",
  familyTree: [{ name: "Arjun Sharma", relationship: "Son", age: "12" }],
};

const envelope = {
  ok: true,
  data: { x: 1 },
  meta: { tokens: { in: 1, out: 1 }, costEstimateInr: 0.1, mock: true },
  error: null,
};

console.log("Contract fixtures:");
check("holding.schema.json", holding);
check("aaFetchResponse.schema.json", aaFetch);
check("grievanceState.schema.json", grievance);
check("affidavit.schema.json", affidavit);
check("apiEnvelope.schema.json", envelope);

if (failures) {
  console.error(`\n${failures} contract fixture(s) failed`);
  process.exit(1);
}
console.log("\nall contract fixtures valid");
