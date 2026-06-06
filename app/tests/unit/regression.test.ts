import { describe, it, expect } from "vitest";
import { isRegression, REGRESSION_POINT_DROP } from "@/lib/eval/regression";

describe("regression > 3 points flagged", () => {
  it("flags a drop greater than 3 points", () => {
    // 0.82 → 0.77 = 5 pt drop
    const r = isRegression({ baselineScore: 0.82, currentScore: 0.77 });
    expect(r.flagged).toBe(true);
    expect(r.reason).toMatch(/dropped/);
  });

  it("does NOT flag a drop within threshold", () => {
    // 0.82 → 0.80 = 2 pt drop (<= 3)
    expect(isRegression({ baselineScore: 0.82, currentScore: 0.8 }).flagged).toBe(false);
  });

  it("does NOT flag an improvement", () => {
    expect(isRegression({ baselineScore: 0.74, currentScore: 0.82 }).flagged).toBe(false);
  });

  it("threshold constant is 3", () => {
    expect(REGRESSION_POINT_DROP).toBe(3);
  });
});

describe("safety gate flip is always a regression", () => {
  it("flags when safety findings increase even if score improved", () => {
    const r = isRegression({
      baselineScore: 0.7,
      currentScore: 0.95,
      baselineSafetyFindings: 0,
      currentSafetyFindings: 1,
    });
    expect(r.flagged).toBe(true);
    expect(r.reason).toMatch(/safety gate/);
  });
});

describe("regression cannot be masked by a higher mean", () => {
  it("flags >2% of cases regressing even when overall is flat", () => {
    const r = isRegression({ baselineScore: 0.8, currentScore: 0.8, pctCasesRegressed: 0.05 });
    expect(r.flagged).toBe(true);
  });
});

describe("cross-rubric comparisons are not flagged", () => {
  it("never auto-flags when rubric differs", () => {
    const r = isRegression({ baselineScore: 0.9, currentScore: 0.5, sameRubric: false });
    expect(r.flagged).toBe(false);
    expect(r.reason).toMatch(/cross-rubric/);
  });
});
