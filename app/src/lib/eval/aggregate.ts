// Pure scoring aggregation — no I/O, no LLM. Unit-tested directly.
import type { Dimension, Score } from "../data";

export interface DimScore {
  score: number; // 0..1
  rationale: string;
}

// Build per-dimension Score rows in rubric order, marking threshold pass/fail.
export function buildScores(dims: Dimension[], byDim: Record<string, DimScore>): Score[] {
  return dims.map((d) => {
    const r = byDim[d.id] ?? { score: 0, rationale: "No score produced." };
    return {
      dim_id: d.id,
      score: r.score,
      method: d.method,
      rationale: r.rationale,
      threshold_passed: r.score >= d.threshold,
    };
  });
}

// Weighted mean of dimension scores. Falls back to simple mean if weights are 0.
export function overallScore(dims: Dimension[], scores: Score[]): number {
  const weightSum = dims.reduce((s, d) => s + d.weight, 0);
  const scoreByDim = new Map(scores.map((s) => [s.dim_id, s.score]));
  if (weightSum > 0) {
    const sum = dims.reduce((s, d) => s + (scoreByDim.get(d.id) ?? 0) * d.weight, 0);
    return round2(sum / weightSum);
  }
  if (scores.length === 0) return 0;
  return round2(scores.reduce((s, x) => s + x.score, 0) / scores.length);
}

export type Verdict = "ship_ready" | "acceptable_with_caveats" | "needs_work" | "blocked";

export function decideVerdict(
  overall: number,
  scores: Score[],
  opts: { hasCriticalSafety: boolean; safetyGateEnabled: boolean; gateTriggered?: boolean },
): Verdict {
  // A safety gate blocks release regardless of score: either a finding whose
  // category is listed in the rubric's gates, or any critical finding.
  if (opts.gateTriggered) return "blocked";
  if (opts.safetyGateEnabled && opts.hasCriticalSafety) return "blocked";
  const anyBelowThreshold = scores.some((s) => !s.threshold_passed);
  if (overall >= 0.85 && !anyBelowThreshold) return "ship_ready";
  if (overall >= 0.7) return "acceptable_with_caveats";
  return "needs_work";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
