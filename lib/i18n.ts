// Lightweight bilingual dictionary for a Bharat-first UI.
// Only the most visible labels are translated to keep the demo readable,
// while the app structure and legal copy stay in English for clarity.

export type Lang = "en" | "hi";

export const STRINGS = {
  "nav.dashboard": { en: "Wealth Map", hi: "धन मानचित्र" },
  "nav.vault": { en: "Family Vault", hi: "पारिवारिक तिजोरी" },
  "nav.transmission": { en: "Transmission", hi: "हस्तांतरण" },
  "nav.iepf": { en: "IEPF Claims", hi: "आईईपीएफ दावे" },
  "hero.eyebrow": {
    en: "SEBI Track B · Investor Rights & Safety",
    hi: "सेबी ट्रैक बी · निवेशक अधिकार और सुरक्षा",
  },
  "hero.title": {
    en: "Your family should never lose your wealth.",
    hi: "आपके परिवार को आपकी संपत्ति कभी नहीं खोनी चाहिए।",
  },
  "hero.subtitle": {
    en: "Viraasat builds a single, secure map of every account you own — so nominees are in place and nothing becomes unclaimed.",
    hi: "विरासत आपके हर खाते का एक सुरक्षित नक्शा बनाता है — ताकि नामांकित व्यक्ति दर्ज हो और कुछ भी लावारिस न रहे।",
  },
  "cta.connect": {
    en: "Connect via Account Aggregator",
    hi: "अकाउंट एग्रीगेटर से जोड़ें",
  },
  "cta.demo": { en: "Try the demo", hi: "डेमो देखें" },
  "score.healthy": { en: "Nominee Health Score", hi: "नामांकन स्वास्थ्य स्कोर" },
  "score.action": { en: "Action needed", hi: "कार्रवाई आवश्यक" },
  "score.clear": { en: "All clear", hi: "सब सुरक्षित" },
  "section.accounts": { en: "Your accounts", hi: "आपके खाते" },
  "section.atRisk": { en: "Needs a nominee", hi: "नामांकन आवश्यक" },
  "section.protected": { en: "Protected", hi: "सुरक्षित" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang];
}
