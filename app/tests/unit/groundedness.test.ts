import { describe, it, expect } from "vitest";
import { scoreGroundedness, LABEL_WEIGHT } from "@/lib/eval/groundedness";
import type { ClaimLabel } from "@/lib/eval/claims";

describe("claim pipeline score mapping", () => {
  it("maps each label to its groundedness weight", () => {
    expect(LABEL_WEIGHT.supported).toBe(1);
    expect(LABEL_WEIGHT.partially_supported).toBe(0.6);
    expect(LABEL_WEIGHT.unsupported).toBe(0.2);
    expect(LABEL_WEIGHT.contradicted).toBe(0);
  });

  it("no claims → full groundedness (nothing ungrounded)", () => {
    expect(scoreGroundedness([])).toBe(1);
  });

  it("all supported → 1.0", () => {
    expect(scoreGroundedness(["supported", "supported"])).toBe(1);
  });
});

describe("unsupported claim lowers groundedness", () => {
  it("one unsupported among supported drops the score below 1", () => {
    const labels: ClaimLabel[] = ["supported", "supported", "unsupported"];
    const score = scoreGroundedness(labels);
    expect(score).toBeLessThan(1);
    // (1 + 1 + 0.2) / 3 = 0.73
    expect(score).toBe(0.73);
  });
});

describe("contradicted claim tanks groundedness", () => {
  it("a single contradicted claim scores 0 groundedness", () => {
    expect(scoreGroundedness(["contradicted"])).toBe(0);
  });

  it("contradicted drags a mixed set down hard", () => {
    // (1 + 0) / 2 = 0.5
    expect(scoreGroundedness(["supported", "contradicted"])).toBe(0.5);
  });
});
