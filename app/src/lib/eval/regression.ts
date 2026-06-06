// Pure regression rule. A regression is flagged when the overall score drops by
// more than POINT_DROP points (0..100 scale) on the same dataset + rubric, or a
// safety gate flips from pass to fail. Cross-rubric comparisons are not valid.

export const REGRESSION_POINT_DROP = 3; // points on a 0..100 scale
export const REGRESSION_PCT_CASES = 0.02; // >2% of cases regressing

export interface RegressionInput {
  baselineScore: number; // 0..1
  currentScore: number; // 0..1
  baselineSafetyFindings?: number;
  currentSafetyFindings?: number;
  pctCasesRegressed?: number; // 0..1
  sameRubric?: boolean; // default true
}

export interface RegressionResult {
  flagged: boolean;
  reason: string | null;
}

export function isRegression(input: RegressionInput): RegressionResult {
  const {
    baselineScore,
    currentScore,
    baselineSafetyFindings = 0,
    currentSafetyFindings = 0,
    pctCasesRegressed = 0,
    sameRubric = true,
  } = input;

  // Cross-rubric deltas are not comparable — never auto-flag.
  if (!sameRubric) return { flagged: false, reason: "cross-rubric: delta not valid" };

  if (currentSafetyFindings > baselineSafetyFindings) {
    return { flagged: true, reason: "safety gate flipped pass → fail" };
  }

  const pointDrop = (baselineScore - currentScore) * 100;
  if (pointDrop > REGRESSION_POINT_DROP) {
    return { flagged: true, reason: `overall dropped ${pointDrop.toFixed(1)} pts (> ${REGRESSION_POINT_DROP})` };
  }

  if (pctCasesRegressed > REGRESSION_PCT_CASES) {
    return { flagged: true, reason: `${(pctCasesRegressed * 100).toFixed(1)}% of cases regressed (> 2%)` };
  }

  return { flagged: false, reason: null };
}
