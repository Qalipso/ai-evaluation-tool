import type { ClaimLabel } from "./claims";

// Pure groundedness scoring — shared by the claim pipeline and tests.
// No server-only deps so it can be unit-tested directly.

// Per-label contribution to the 0..1 groundedness score.
export const LABEL_WEIGHT: Record<ClaimLabel, number> = {
  supported: 1,
  partially_supported: 0.6,
  unsupported: 0.2,
  contradicted: 0,
};

// No factual claims → nothing ungrounded → full groundedness.
export function scoreGroundedness(labels: ClaimLabel[]): number {
  if (labels.length === 0) return 1;
  const sum = labels.reduce((s, l) => s + LABEL_WEIGHT[l], 0);
  return Math.round((sum / labels.length) * 100) / 100;
}
