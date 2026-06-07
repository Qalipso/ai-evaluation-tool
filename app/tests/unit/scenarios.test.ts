import { describe, it, expect } from "vitest";
import { SCENARIOS } from "@/lib/eval-scenarios";
import type { ClaimScenario, DeterministicScenario } from "@/lib/eval-scenarios";
import { runDeterministicChecks } from "@/lib/evaluators/deterministicChecks";
import { runClaimPipeline } from "@/lib/evaluators/claimPipeline";

// ── Library-level assertion ───────────────────────────────────────────────────

it("SCENARIOS library contains at least 15 entries", () => {
  expect(SCENARIOS.length).toBeGreaterThanOrEqual(15);
});

// ── Deterministic scenarios ───────────────────────────────────────────────────

const deterministicScenarios = SCENARIOS.filter(
  (s): s is DeterministicScenario => s.kind === "deterministic",
);

describe("deterministic scenarios", () => {
  for (const scenario of deterministicScenarios) {
    describe(scenario.id, () => {
      it(`overallPass === ${scenario.expectOverallPass} — ${scenario.title}`, () => {
        const result = runDeterministicChecks(scenario.input);
        expect(result.overallPass).toBe(scenario.expectOverallPass);
      });

      it(`blocking === ${scenario.expectBlocking} — ${scenario.title}`, () => {
        const result = runDeterministicChecks(scenario.input);
        expect(result.blocking).toBe(scenario.expectBlocking);
      });

      it(`failing check types match expectation — ${scenario.title}`, () => {
        const result = runDeterministicChecks(scenario.input);
        const actualFailing = result.checks
          .filter((c) => !c.passed)
          .map((c) => c.type)
          .sort();
        const expectedFailing = [...scenario.expectFailingChecks].sort();
        expect(actualFailing).toEqual(expectedFailing);
      });
    });
  }
});

// ── Claim scenarios ───────────────────────────────────────────────────────────

const claimScenarios = SCENARIOS.filter(
  (s): s is ClaimScenario => s.kind === "claim",
);

describe("claim scenarios", () => {
  for (const scenario of claimScenarios) {
    describe(scenario.id, () => {
      it(`each expected claim appears with correct type+status — ${scenario.title}`, () => {
        const result = runClaimPipeline(scenario.input);
        for (const expected of scenario.expectClaims) {
          const match = result.claims.find(
            (c) => c.type === expected.type && c.status === expected.status,
          );
          expect(
            match,
            `expected a claim with type="${expected.type}" and status="${expected.status}" in scenario ${scenario.id}`,
          ).toBeDefined();
        }
      });

      it(`failing claim count (contradicted+unsupported) === ${scenario.expectFailingClaims} — ${scenario.title}`, () => {
        const result = runClaimPipeline(scenario.input);
        const failingCount = result.claims.filter(
          (c) => c.status === "contradicted" || c.status === "unsupported",
        ).length;
        expect(failingCount).toBe(scenario.expectFailingClaims);
      });
    });
  }
});
