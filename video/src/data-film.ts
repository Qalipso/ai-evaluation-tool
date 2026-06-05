// Mock data for the 60s film. Demo case: AreaMosa — a Spanish WhatsApp
// booking assistant. Shapes mirror the real product (claims, scores, safety).

export const demoCase = {
  project: "AreaMosa Assistant",
  useCase: "WhatsApp booking assistant",
  language: "Spanish",
  risk: "client booking · policy · calendar state",
};

// ── Scene 1: Hook — confident answer, one unsupported claim ─────────────
export const hookAnswer = {
  text: "Your appointment is confirmed for 18:00 today. See you then!",
  // char range to flag as unsupported
  flag: "confirmed for 18:00",
};
export const hookFlag = "Unsupported claim · no calendar slot at 18:00";

// ── Scene 2: Problem — three failure alerts ─────────────────────────────
export const problemAlerts = [
  { kind: "Hallucinated fact", detail: "Cited a slot that does not exist", severity: "high" },
  { kind: "Wrong policy", detail: "Skipped the cancellation terms", severity: "med" },
  { kind: "Unsafe confirmation", detail: "Booked before checking the calendar", severity: "high" },
];

// ── Scene 3: Product reveal ─────────────────────────────────────────────
export const product = {
  name: "AI Evaluation Tool",
  tagline: "Quality control for AI outputs",
  sub: "Score, ground, and ship AI answers with evidence.",
};

// ── Scene 4: Rubric dimensions ──────────────────────────────────────────
export const rubricDims = [
  "Accuracy",
  "Conversation quality",
  "Hallucination risk",
  "Tone fit",
  "Multilingual",
  "State management",
  "Handoff intelligence",
];

// ── Scene 5: Claim pipeline ─────────────────────────────────────────────
export type ClaimLabel = "supported" | "partial" | "unsupported" | "contradicted";
export type FilmClaim = { text: string; label: ClaimLabel; confidence: number };

export const claimAnswer =
  "I checked the calendar and your appointment is confirmed for 18:00. Our cancellation policy gives a full refund up to 24 hours before.";

export const filmClaims: FilmClaim[] = [
  { text: "I checked the calendar", label: "contradicted", confidence: 0.91 },
  { text: "your appointment is confirmed for 18:00", label: "unsupported", confidence: 0.88 },
  { text: "full refund up to 24 hours before", label: "supported", confidence: 0.79 },
];

export const evidencePanel = [
  { k: "Retrieved context", v: "calendar.slots(2026-06-06) → []" },
  { k: "Source match", v: "policy.md §3 refund window" },
  { k: "Claim confidence", v: "0.88" },
  { k: "Verdict", v: "2 of 3 ungrounded" },
];

// ── Scene 6: Safety gates ───────────────────────────────────────────────
export type Gate = { name: string; status: "pass" | "blocked" };
export const safetyGates: Gate[] = [
  { name: "PII detection", status: "pass" },
  { name: "False confirmation", status: "blocked" },
  { name: "Prompt injection", status: "pass" },
  { name: "Unsupported pricing", status: "pass" },
  { name: "Language mismatch", status: "pass" },
  { name: "Policy violation", status: "pass" },
];

// ── Scene 7: Run verdict (the re-run, after evaluation) ─────────────────
export const verdict = {
  label: "Ship-ready",
  score: 0.94,
  metrics: [
    { k: "Pass rate", v: "100%" },
    { k: "Safety findings", v: "0" },
    { k: "Claims processed", v: "9" },
  ],
  bars: [
    { name: "Accuracy", v: 96 },
    { name: "Hallucination risk", v: 92 },
    { name: "Tone fit", v: 90 },
    { name: "State management", v: 95 },
  ],
};

// ── Scene 8: CTA ────────────────────────────────────────────────────────
export const cta = {
  name: "AI Evaluation Tool",
  slogan: "Evaluate AI with evidence, not vibes.",
  author: "Built by Eduard Shatalov",
  chips: ["Rubrics", "LLM Judge", "Claim Pipeline", "Safety Gates", "Human Review", "Reports"],
};
