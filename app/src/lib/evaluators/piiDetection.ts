// Pure PII pattern detection — shared by the claim pipeline and deterministic checks.

export const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Phone: international-ish, 9–15 digits with optional separators / leading +.
export const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

export interface PiiMatch {
  kind: "email" | "phone";
  value: string;
  index: number;
}

export function detectEmails(text: string): PiiMatch[] {
  const out: PiiMatch[] = [];
  for (const m of text.matchAll(EMAIL_RE)) {
    out.push({ kind: "email", value: m[0], index: m.index ?? 0 });
  }
  return out;
}

export function detectPhones(text: string): PiiMatch[] {
  const out: PiiMatch[] = [];
  for (const m of text.matchAll(PHONE_RE)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length >= 9 && digits.length <= 15) {
      out.push({ kind: "phone", value: m[0].trim(), index: m.index ?? 0 });
    }
  }
  return out;
}

export function detectPii(text: string): PiiMatch[] {
  return [...detectEmails(text), ...detectPhones(text)];
}
