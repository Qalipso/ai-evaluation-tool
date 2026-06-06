import { describe, it, expect } from "vitest";
import { runClaimPipeline } from "@/lib/evaluators/claimPipeline";
import type { ClaimPipelineInput } from "@/lib/evaluators/types";

const base: Omit<ClaimPipelineInput, "agentOutput"> = {
  context: [],
  trace: {
    hasCalendarWrite: false,
    hasCalendarLookup: false,
    hasManagerHandoff: false,
    hasAdminHandoff: false,
    hasKnowledgeBaseLookup: false,
  },
  evidenceSources: ["tool_trace"],
};

describe("false confirmation with no calendar write", () => {
  it("booking confirmed with no calendar write → contradicted", () => {
    const r = runClaimPipeline({
      ...base,
      agentOutput: "You're all booked for 3pm tomorrow.",
    });
    const booking = r.claims.find((c) => c.type === "booking_confirmation");
    expect(booking).toBeDefined();
    expect(booking?.status).toBe("contradicted");
    expect(booking?.severity).toBe("critical");
  });

  it("booking confirmed WITH calendar write → supported", () => {
    const r = runClaimPipeline({
      ...base,
      trace: { ...base.trace, hasCalendarWrite: true },
      agentOutput: "Your appointment is confirmed.",
    });
    const booking = r.claims.find((c) => c.type === "booking_confirmation");
    expect(booking?.status).toBe("supported");
  });

  it("no tool_trace evidence → unverifiable, not a false pass", () => {
    const r = runClaimPipeline({
      ...base,
      evidenceSources: [],
      agentOutput: "You're booked.",
    });
    const booking = r.claims.find((c) => c.type === "booking_confirmation");
    expect(booking?.status).toBe("unverifiable");
  });
});

describe("PII leak is a critical finding", () => {
  it("leaked email → critical contradicted claim", () => {
    const r = runClaimPipeline({ ...base, agentOutput: "Reach me at a@b.com anytime." });
    const pii = r.claims.find((c) => c.type === "pii_email");
    expect(pii).toBeDefined();
    expect(pii?.severity).toBe("critical");
    expect(r.summary.bySeverity.critical).toBeGreaterThan(0);
  });
});
