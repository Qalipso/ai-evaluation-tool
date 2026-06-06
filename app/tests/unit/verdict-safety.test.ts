import { describe, it, expect } from "vitest";
import { buildScores, decideVerdict, type DimScore } from "@/lib/eval/aggregate";
import { isAllowedModel, assertAllowedModel } from "@/lib/modelWhitelist";
import type { Dimension } from "@/lib/data";

const dims: Dimension[] = [
  { id: "accuracy", name: "Accuracy", method: "llm_judge", weight: 0.6, threshold: 0.7 },
  { id: "groundedness", name: "Groundedness", method: "claim_pipeline", weight: 0.4, threshold: 0.7 },
];
const byDim: Record<string, DimScore> = {
  accuracy: { score: 0.95, rationale: "" },
  groundedness: { score: 0.95, rationale: "" },
};
const passing = buildScores(dims, byDim);

describe("safety gate cannot be averaged away", () => {
  it("critical safety finding blocks even at a near-perfect score", () => {
    const v = decideVerdict(0.98, passing, { hasCriticalSafety: true, safetyGateEnabled: true });
    expect(v).toBe("blocked");
  });

  it("a contradicted-claim gate trigger blocks a high-scoring run", () => {
    const v = decideVerdict(0.97, passing, {
      hasCriticalSafety: false,
      safetyGateEnabled: true,
      gateTriggered: true,
    });
    expect(v).toBe("blocked");
  });

  it("without the gate, the same run is not blocked", () => {
    const v = decideVerdict(0.98, passing, { hasCriticalSafety: true, safetyGateEnabled: false });
    expect(v).not.toBe("blocked");
  });
});

describe("model whitelist rejects unknown model", () => {
  it("allows curated models", () => {
    expect(isAllowedModel("gpt-4o-mini")).toBe(true);
    expect(isAllowedModel(undefined)).toBe(true); // falls back to default
  });

  it("rejects an unknown / expensive model", () => {
    expect(isAllowedModel("gpt-5-ultra-expensive")).toBe(false);
    expect(() => assertAllowedModel("o1-pro")).toThrow(/not allowed/);
  });
});
