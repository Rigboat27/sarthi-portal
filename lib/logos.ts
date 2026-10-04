// Real brand logos (downloaded to /public/logos) keyed by provider code.
// Missing logos (e.g. kfintech) fall back to the account-type emoji.

export const PROVIDER_LOGOS: Record<string, string> = {
  hdfc: "/logos/hdfc.png",
  sbi: "/logos/sbi.png",
  icici: "/logos/icici.png",
  cdsl: "/logos/cdsl.png",
  nsdl: "/logos/nsdl.png",
  cams: "/logos/cams.png",
  kfintech: "/logos/kfintech.png",
  lic: "/logos/lic.png",
  onemoney: "/logos/onemoney.png",
  finvu: "/logos/finvu.png",
  setu: "/logos/setu.png",
  groww: "/logos/groww.png",
  upstox: "/logos/upstox.png",
  zerodha: "/logos/zerodha.png",
  angelone: "/logos/angelone.png",
};

export function providerLogo(code: string): string | null {
  return PROVIDER_LOGOS[code] ?? null;
}
