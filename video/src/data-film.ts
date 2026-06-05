// Scene-facing adapter. All values derive from the typed video data contract
// (data/evalVideoData.ts) so the film is data-driven, not hardcoded.

import { evalVideoData as D, type ClaimVerdict } from "./data/evalVideoData";

// ── Case meta ───────────────────────────────────────────────────────────
export const demoCase = {
  project: D.projectName,
  useCase: D.useCase,
  language: D.language,
  risk: "client booking · policy · calendar state",
};

// ── Scene 1: Hook — confident answer, one unsupported claim ─────────────
export const hookAnswer = {
  text: D.beforeExample.answer,
  flag: "confirmed for 18:00",
};
export const hookFlag = D.evidenceContradiction;
export const hookEvidence = D.beforeExample.evidence;
export const hookFailure = D.beforeExample.failure; // "False confirmation"

// ── Scene 2: Problem — failure alerts ───────────────────────────────────
export const problemAlerts = D.failureAlerts;

// ── Scene 3: Product reveal ─────────────────────────────────────────────
export const product = {
  name: D.productName,
  tagline: "Quality control for AI outputs",
  sub: "Score, ground, and ship AI answers with evidence.",
};

// ── Scene 4: Rubric dimensions (name + 0-1 score) ───────────────────────
export type RubricDim = { name: string; score: number };
export const rubricDims: RubricDim[] = D.rubricDimensions;

// ── Scene 5: Claim pipeline ─────────────────────────────────────────────
export type ClaimLabel = "supported" | "partial" | "unsupported" | "contradicted";
export type FilmClaim = { text: string; label: ClaimLabel; confidence: number };

const verdictToLabel: Record<ClaimVerdict, ClaimLabel> = {
  SUPPORTED: "supported",
  PARTIAL: "partial",
  UNSUPPORTED: "unsupported",
  CONTRADICTED: "contradicted",
};

export const filmClaims: FilmClaim[] = D.claims.map((c) => ({
  text: c.text,
  label: verdictToLabel[c.verdict],
  confidence: c.confidence,
}));

// The answer paragraph the claims were extracted from (the failing reply).
export const claimAnswer = D.beforeExample.answer;

const ungrounded = D.claims.filter((c) => c.verdict === "CONTRADICTED" || c.verdict === "UNSUPPORTED").length;
export const evidencePanel = [
  { k: "Retrieved context", v: "calendar.slots(2026-06-06) → []" },
  { k: "Evidence", v: D.beforeExample.evidence },
  { k: "Claim confidence", v: D.claims[0].confidence.toFixed(2) },
  { k: "Verdict", v: `${ungrounded} of ${D.claims.length} ungrounded` },
];

// ── Scene 6: Safety gates (the failing "before" run) ────────────────────
export type Gate = { name: string; status: "pass" | "blocked" };
export const safetyGates: Gate[] = D.safetyGates.map((g) => ({
  name: g.name,
  status: g.before === "BLOCKED" ? "blocked" : "pass",
}));

// ── Scene 7: Run verdict (the re-run, after evaluation) ─────────────────
export const verdict = {
  label: D.verdict,
  score: D.score,
  metrics: [
    { k: "Pass rate", v: D.passRate },
    { k: "Safety findings", v: String(D.safetyFindings) },
    { k: "Claims processed", v: String(D.claimsProcessed) },
  ],
  // five spotlight dimensions, 0-1 → 0-100
  bars: D.rubricDimensions.slice(0, 5).map((d) => ({ name: d.name, v: Math.round(d.score * 100) })),
};

// ── Scene 8: CTA ────────────────────────────────────────────────────────
export const cta = {
  name: D.productName,
  slogan: D.slogan,
  formula: D.secondaryFormula, // "Score it. Ground it. Gate it. Ship it."
  author: D.finalFooter,
  chips: ["Rubrics", "LLM Judge", "Claim Pipeline", "Safety Gates", "Human Review", "Reports"],
};
