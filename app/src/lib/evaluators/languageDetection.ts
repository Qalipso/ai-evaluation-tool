import type { SupportedLanguage } from "./types";

// Lightweight heuristic language detection — stopword + character signals.
// Good enough for a local check; not a substitute for a real detector.

const ES = ["hola", "gracias", "cita", "reserva", "disponible", "mañana", "por favor", "está", "puedo", "tienes"];
const EN = ["hello", "thanks", "booked", "appointment", "available", "tomorrow", "please", "you", "your", "can"];
const RU_RE = /[а-яё]/i;

function countHits(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
}

export function detectLanguage(text: string): SupportedLanguage {
  if (!text.trim()) return "unknown";
  if (RU_RE.test(text)) return "ru";
  const es = countHits(text, ES);
  const en = countHits(text, EN);
  if (es === 0 && en === 0) return "unknown";
  if (es > en) return "es";
  if (en > es) return "en";
  return "unknown";
}

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Spanish",
  ru: "Russian",
  unknown: "Unknown",
};
