import { describe, it, expect } from "vitest";
import { buildScores, overallScore, decideVerdict, type DimScore } from "@/lib/eval/aggregate";
import type { Dimension } from "@/lib/data";

const dims: Dimension[] = [
  { id: "accuracy", name: "Accuracy", method: "llm_judge", weight: 0.6, threshold: 0.7 },
  { id: "safety", name: "Safety", method: "deterministic", weight: 0.4, threshold: 0.9 },
];

describe("buildScores", () => {
  it("marks threshold pass/fail per dimension", () => {
    const byDim: Record<string, DimScore> = {
      accuracy: { score: 0.8, rationale: "good" },
      safety: { score: 0.5, rationale: "flag" },
    };
    const scores = buildScores(dims, byDim);
    expect(scores).toHaveLength(2);
    expect(scores[0].threshold_passed).toBe(true);
    expect(scores[1].threshold_passed).toBe(false);
    expect(scores[0].method).toBe("llm_judge");
  });

  it("defaults missing dimension to zero", () => {
    const scores = buildScores(dims, { accuracy: { score: 1, rationale: "x" } });
    expect(scores[1].score).toBe(0);
    expect(scores[1].threshold_passed).toBe(false);
  });
});

describe("overallScore", () => {
  it("computes weighted mean", () => {
    const scores = buildScores(dims, {
      accuracy: { score: 1, rationale: "" },
      safety: { score: 0.5, rationale: "" },
    });
    // 1*0.6 + 0.5*0.4 = 0.8
    expect(overallScore(dims, scores)).toBe(0.8);
  });

  it("falls back to simple mean when weights are zero", () => {
    const zeroDims: Dimension[] = dims.map((d) => ({ ...d, weight: 0 }));
    const scores = buildScores(zeroDims, {
      accuracy: { score: 1, rationale: "" },
      safety: { score: 0, rationale: "" },
    });
    expect(overallScore(zeroDims, scores)).toBe(0.5);
  });

  it("returns 0 for no scores", () => {
    expect(overallScore([], [])).toBe(0);
  });
});

describe("decideVerdict", () => {
  const passing = buildScores(dims, {
    accuracy: { score: 0.9, rationale: "" },
    safety: { score: 0.95, rationale: "" },
  });

  it("blocks on critical safety when gate enabled", () => {
    expect(decideVerdict(0.95, passing, { hasCriticalSafety: true, safetyGateEnabled: true })).toBe("blocked");
  });

  it("does not block when gate disabled", () => {
    expect(decideVerdict(0.95, passing, { hasCriticalSafety: true, safetyGateEnabled: false })).not.toBe("blocked");
  });

  it("ship_ready needs high score and all thresholds passed", () => {
    expect(decideVerdict(0.9, passing, { hasCriticalSafety: false, safetyGateEnabled: true })).toBe("ship_ready");
  });

  it("acceptable when score ok but a threshold failed", () => {
    const mixed = buildScores(dims, {
      accuracy: { score: 0.95, rationale: "" },
      safety: { score: 0.5, rationale: "" },
    });
    expect(decideVerdict(0.77, mixed, { hasCriticalSafety: false, safetyGateEnabled: true })).toBe("acceptable_with_caveats");
  });

  it("needs_work for low score", () => {
    expect(decideVerdict(0.5, passing, { hasCriticalSafety: false, safetyGateEnabled: true })).toBe("needs_work");
  });
});
