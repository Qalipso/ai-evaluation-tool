// Guard against garbage / low-effort input before spending LLM calls on it.

export interface QualityCheck {
  ok: boolean;
  reason?: string;
}

export function checkTextQuality(s: string, label = "text"): QualityCheck {
  const t = (s ?? "").trim();
  if (t.length < 3) return { ok: false, reason: `${label} is too short` };
  if (t.length > 8000) return { ok: false, reason: `${label} exceeds 8000 characters` };

  const letters = (t.match(/[a-zA-Zа-яёА-ЯЁ]/g) ?? []).length;
  if (letters / t.length < 0.3) return { ok: false, reason: `${label} is mostly non-letter characters` };

  // Long runs of a single repeated character (keyboard mashing).
  if (/(.)\1{7,}/.test(t)) return { ok: false, reason: `${label} contains repeated-character spam` };

  // A handful of words but all identical.
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 4 && new Set(words.map((w) => w.toLowerCase())).size === 1) {
    return { ok: false, reason: `${label} is a single repeated word` };
  }

  return { ok: true };
}
