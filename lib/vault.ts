import { Holding, WealthSnapshot } from "./types";

/**
 * Family Vault — client-side "encryption" of a legacy document.
 *
 * For the demo we derive an AES-GCM key from a passphrase using PBKDF2 via the
 * Web Crypto API, encrypt the plaintext JSON, and produce a downloadable
 * self-contained HTML "Legacy Vault" file that the user can hand to a trusted
 * family member. In production this passphrase would be a real secret and the
 * ciphertext would be stored server-side.
 */

export interface VaultArtifact {
  format: "sarthi-vault/v1";
  createdAt: string;
  owner: string;
  aggregator: string;
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
  iterations: number;
  accountCount: number;
}

export interface LegacyDocumentInput {
  owner: string;
  trustedContact: string;
  contactPhone: string;
  snapshot: WealthSnapshot;
  passphrase: string;
}

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function createLegacyVault(
  input: LegacyDocumentInput,
): Promise<VaultArtifact> {
  const { snapshot, passphrase } = input;

  const enc = new TextEncoder();

  // 1. Derive a key from the passphrase (PBKDF2 -> AES-GCM 256).
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 150000;
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // 2. Build a plaintext manifest with everything the family needs.
  const plaintext = JSON.stringify(
    {
      owner: input.owner,
      trustedContact: input.trustedContact,
      contactPhone: input.contactPhone,
      generatedAt: snapshot.fetchedAt,
      aggregator: snapshot.aggregator.name,
      accounts: snapshot.holdings.map((h: Holding) => ({
        type: h.type,
        provider: h.provider,
        label: h.label,
        identifier: h.identifier,
        maskedNumber: h.maskedNumber,
        value: h.value,
        nominee: h.nominee
          ? `${h.nominee.name} (${h.nominee.relationship})`
          : "NO NOMINEE — action required",
      })),
    },
    null,
    2,
  );

  // 3. Encrypt.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );

  return {
    format: "sarthi-vault/v1",
    createdAt: new Date().toISOString(),
    owner: input.owner,
    aggregator: snapshot.aggregator.name,
    ciphertext: toB64(cipherBuf),
    iv: toB64(iv),
    salt: toB64(salt),
    iterations,
    accountCount: snapshot.holdings.length,
  };
}

/** Renders a self-contained HTML "Legacy Vault" that decrypts in-place with the passphrase. */
export function renderVaultHtml(artifact: VaultArtifact): string {
  const artifactJson = JSON.stringify(artifact);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sarthi Viraasat · Legacy Vault</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         margin: 0; padding: 32px 16px; background: #f8fafc; color: #0f172a; }
  .card { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 32px; }
  h1 { margin: 0 0 4px; font-size: 22px; display:flex; align-items:center; gap:10px; }
  .badge { background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700;
           padding: 4px 10px; border-radius: 999px; }
  .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
  .unlock { display:flex; gap:8px; margin: 16px 0; }
  input { flex:1; padding: 12px; border:1px solid #cbd5e1; border-radius:10px; font-size:14px; }
  button { padding: 12px 18px; border:0; border-radius:10px; background:#16a34a; color:#fff;
           font-weight:700; cursor:pointer; }
  button:hover { background:#15803d; }
  table { width:100%; border-collapse:collapse; margin-top:12px; font-size:14px; }
  th, td { text-align:left; padding:10px; border-bottom:1px solid #e2e8f0; }
  th { background:#f1f5f9; }
  .err { color:#dc2626; }
  .foot { margin-top: 24px; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="card">
    <h1>🛡️ Sarthi · Viraasat Legacy Vault <span class="badge">ENCRYPTED</span></h1>
    <div class="meta">
      Owner: <strong>${escapeHtml(artifact.owner)}</strong> ·
      Generated: ${new Date(artifact.createdAt).toLocaleString()} ·
      ${artifact.accountCount} accounts
    </div>
    <p>This file is <strong>AES-GCM encrypted</strong>. Enter the Family Vault
       passphrase to reveal the account-holder's financial footprint.</p>
    <div class="unlock">
      <input type="password" id="passphrase" placeholder="Family Vault passphrase" />
      <button id="unlockBtn">🔓 Decrypt</button>
    </div>
    <div id="output"></div>
    <div class="foot">Format: ${artifact.format} · Share only with a trusted family member.</div>
  </div>

<script>
const ARTIFACT = ${artifactJson};

function fromB64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function inr(v) {
  return v ? '₹' + Number(v).toLocaleString('en-IN') : '—';
}

async function decrypt(passphrase) {
  const enc = new TextEncoder();
  const salt = fromB64(ARTIFACT.salt);
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations: ARTIFACT.iterations, hash:'SHA-256' },
    baseKey, { name:'AES-GCM', length:256 }, false, ['decrypt']
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name:'AES-GCM', iv: fromB64(ARTIFACT.iv) }, key, fromB64(ARTIFACT.ciphertext)
  );
  return new TextDecoder().decode(plainBuf);
}

function render(data) {
  const out = document.getElementById('output');
  let html = '<h2>Accounts</h2><table><tr><th>Provider</th><th>Account</th><th>Nominee</th><th>Value</th></tr>';
  for (const a of data.accounts) {
    html += '<tr><td>' + esc(a.provider) + '</td><td>' + esc(a.label + (a.maskedNumber ? ' ' + a.maskedNumber : '')) + '</td><td>' + esc(a.nominee || '⚠ no nominee') + '</td><td>' + inr(a.value) + '</td></tr>';
  }
  html += '</table>';
  html += '<p class="meta">Trusted contact: <strong>' + esc(data.trustedContact) + '</strong>'
        + (data.contactPhone ? ' · ' + esc(data.contactPhone) : '') + '</p>';
  out.innerHTML = html;
}

document.getElementById('unlockBtn').onclick = async () => {
  const pass = document.getElementById('passphrase').value;
  const out = document.getElementById('output');
  try {
    render(JSON.parse(await decrypt(pass)));
  } catch (e) {
    out.innerHTML = '<p class="err">Wrong passphrase or corrupted vault.</p>';
  }
};
</script>
</body>
</html>`;
}

export async function decryptVault(
  artifact: VaultArtifact,
  passphrase: string,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = fromB64(artifact.salt);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: artifact.iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(artifact.iv) },
    key,
    fromB64(artifact.ciphertext),
  );
  return new TextDecoder().decode(plainBuf);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
