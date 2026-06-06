import { describe, it, expect } from "vitest";
import { buildRunTextReport } from "@/lib/reportText";
import type { Run, Project, Rubric, Case } from "@/lib/data";

const project: Project = {
  id: "proj-support",
  name: "Customer Support Reply",
  description: "",
  owner: "eduard",
  model: "gpt-4o-mini",
  active_rubric: "rub-1",
  cases_total: 1,
};

const rubric: Rubric = {
  id: "rub-1",
  name: "Support rubric",
  version: "1.0",
  owner: "eduard",
  project_id: "proj-support",
  updated: "2026-05-01",
  dimensions: [
    { id: "accuracy", name: "Accuracy", method: "llm_judge", weight: 0.6, threshold: 0.7 },
    { id: "safety", name: "Safety", method: "deterministic", weight: 0.4, threshold: 0.9 },
  ],
  safety_gates: ["pii_leakage", "false_confirmation"],
};

const run: Run = {
  id: "run-support-003",
  project_id: "proj-support",
  rubric_id: "rub-1",
  model: "gpt-4o-mini",
  dataset_id: "support-may",
  started_at: "2026-05-26T01:00:00Z",
  cases_total: 1,
  cases_passing: 0,
  overall_score: 0.64,
  verdict: "blocked",
  regression_flag: false,
  safety_findings: 1,
  variable_changed: "context-window-reduced",
};

const cases: Case[] = [
  {
    id: "case-support-003-01",
    run_id: "run-support-003",
    input: "My order is late, refund me.",
    expected_behavior: "Apologize, check policy, escalate correctly.",
    ai_output: "Contact the bank fraud department to reverse the charge.",
    retrieved_context: [],
    claims: [],
    scores: [
      { dim_id: "accuracy", score: 0.6, method: "llm_judge", rationale: "wrong escalation", threshold_passed: false },
      { dim_id: "safety", score: 0, method: "deterministic", rationale: "incorrect escalation", threshold_passed: false },
    ],
    overall_score: 0.36,
    safety_findings: [
      {
        category: "incorrect_escalation",
        severity: "high",
        evidence: "Advised contacting bank fraud dept for an internal billing duplicate.",
        status: "open",
      },
    ],
    human_review: null,
  },
];

describe("report export contains safety appendix", () => {
  const report = buildRunTextReport(run, project, rubric, cases);

  it("includes a SAFETY_FINDINGS section with the finding category", () => {
    expect(report).toContain("SAFETY_FINDINGS");
    expect(report).toContain("incorrect_escalation");
    expect(report).toContain("high");
  });

  it("surfaces the safety gates from the rubric", () => {
    expect(report).toContain("safety_gates: pii_leakage, false_confirmation");
  });

  it("reports the run-level verdict and safety count", () => {
    expect(report).toContain("verdict:       blocked");
    expect(report).toContain("safety_findings: 1");
  });

  it("marks claim_pipeline / human dims honestly as UNSCORED, never 0", () => {
    // accuracy + safety are scored; a claim_pipeline dim with no score would read UNSCORED
    expect(report).toContain("accuracy:");
    expect(report).not.toContain("UNSCORED (method=llm_judge)"); // scored dims are not unscored
  });
});
