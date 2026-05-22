import projects from "../../../mock-data/projects.json";
import rubrics from "../../../mock-data/rubrics.json";
import runs from "../../../mock-data/runs.json";
import cases from "../../../mock-data/cases.json";
import models from "../../../mock-data/models.json";

// Explicit interfaces — guards against TypeScript inferring 'never' when JSON files are empty arrays
export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  model: string;
  active_rubric: string;
  cases_total: number; // legacy stored field — not user-editable; coverage is computed from cases
  status?: "active" | "paused" | "archived";
  judge_model?: string;
  tags?: string;
  notes?: string;
}
export interface Dimension { id: string; name: string; method: string; weight: number; threshold: number }
export interface Rubric { id: string; name: string; version: string; owner: string; project_id: string; updated: string; dimensions: Dimension[]; safety_gates: string[] }
export interface Run { id: string; project_id: string; rubric_id: string; model: string; dataset_id: string; started_at: string; cases_total: number; cases_passing: number; overall_score: number; verdict: string; regression_flag: boolean; safety_findings: number; variable_changed: string }
export interface Claim { text: string; label: string; confidence: number; source_idx: number | null; evidence: string }
export interface Score { dim_id: string; score: number; method: string; rationale: string; threshold_passed: boolean }
export interface SafetyFinding { category: string; severity: string; evidence: string; status: string }
export interface Case { id: string; run_id: string; input: string; expected_behavior: string; ai_output: string; retrieved_context: string[]; claims: Claim[]; scores: Score[]; overall_score: number; safety_findings: SafetyFinding[]; human_review: string | null }
export interface AIModel { id: string; provider: string; label: string }

export const allProjects = projects as unknown as Project[];
export const allRubrics = rubrics as unknown as Rubric[];
export const allRuns = runs as unknown as Run[];
export const allCases = cases as unknown as Case[];
export const allModels = models as unknown as AIModel[];

export const getProject = (id: string) =>
  allProjects.find((p) => p.id === id);
export const getRubric = (id: string) =>
  allRubrics.find((r) => r.id === id);
export const getRun = (id: string) => allRuns.find((r) => r.id === id);
export const getCasesByRun = (runId: string) =>
  allCases.filter((c) => c.run_id === runId);
export const getCase = (id: string) => allCases.find((c) => c.id === id);

export const verdictLabel: Record<string, string> = {
  ship_ready: "Ship-ready",
  acceptable_with_caveats: "Acceptable",
  needs_work: "Needs work",
  blocked: "Blocked",
};

export const verdictTone: Record<string, string> = {
  ship_ready: "text-ok",
  acceptable_with_caveats: "text-warn",
  needs_work: "text-bad",
  blocked: "text-bad",
};

export const methodLabel: Record<string, string> = {
  deterministic: "Deterministic",
  llm_judge: "LLM Judge",
  semantic_similarity: "Semantic",
  claim_pipeline: "Claim Pipeline",
  human: "Human",
};

export const labelTone: Record<string, string> = {
  supported: "text-ok",
  partially_supported: "text-warn",
  unsupported: "text-bad",
  contradicted: "text-bad",
};

export const labelHeatClass: Record<string, string> = {
  supported: "heat-supported",
  partially_supported: "heat-partial",
  unsupported: "heat-unsupported",
  contradicted: "heat-contradicted",
};

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

// Computed dashboard metrics — derived from allRuns / allCases / allRubrics
export function computeDashboard() {
  const overallQuality =
    allRuns.length > 0
      ? allRuns.reduce((s, r) => s + r.overall_score, 0) / allRuns.length
      : 0;

  const activeProjects = new Set(allRuns.map((r) => r.project_id)).size;

  const highRiskRuns = allRuns.filter(
    (r) => r.regression_flag || r.safety_findings > 0,
  ).length;

  // Cases whose overall score is in needs_work territory (< 70)
  const failedCases = allCases.filter((c) => c.overall_score < 70).length;

  // Claim pipeline metrics
  const totalClaims = allCases.reduce((s, c) => s + c.claims.length, 0);
  const allClaimsFlat = allCases.flatMap((c) => c.claims);
  const avgConfidence =
    allClaimsFlat.length > 0
      ? allClaimsFlat.reduce((s, cl) => s + cl.confidence, 0) / allClaimsFlat.length
      : 0;

  // Open safety findings across all cases
  const openFindings = allCases.reduce(
    (s, c) => s + c.safety_findings.filter((f) => f.status === "open").length,
    0,
  );

  // Cases with at least one open safety finding = human review queue
  const inQueue = allCases.filter((c) =>
    c.safety_findings.some((f) => f.status === "open"),
  ).length;

  // Average pass rate across all runs (cases_passing / cases_total)
  const avgPassRate =
    allRuns.length > 0
      ? allRuns.reduce((s, r) => s + r.cases_passing / r.cases_total, 0) / allRuns.length
      : 0;

  // Quality breakdown grouped by evaluator method
  const groups: Record<string, { sum: number; count: number; pass: number }> = {};
  for (const c of allCases) {
    for (const sc of c.scores) {
      const g = groups[sc.method] ?? { sum: 0, count: 0, pass: 0 };
      g.sum += sc.score;
      g.count += 1;
      if (sc.threshold_passed) g.pass += 1;
      groups[sc.method] = g;
    }
  }
  const methodDisplayNames: Record<string, string> = {
    deterministic: "Deterministic Checks",
    llm_judge: "LLM Judge",
    semantic_similarity: "Semantic Similarity",
    claim_pipeline: "Claim Pipeline",
    human: "Human Review",
  };
  const quality_breakdown = Object.entries(groups)
    .map(([method, g]) => ({
      evaluator: methodDisplayNames[method] ?? method,
      score: Math.round(g.sum / g.count),
      cases: g.count,
      pass_rate: g.pass / g.count,
    }))
    .sort((a, b) => b.score - a.score);

  const pipeline_health = [
    { stage: "Input", score: activeProjects > 0 ? 100 : 0, label: `${activeProjects} projects` },
    { stage: "Rubric Engine", score: allRubrics.length > 0 ? 100 : 0, label: `${allRubrics.length} active rubrics` },
    {
      stage: "Scoring",
      score: allRuns.length > 0 ? Math.round(avgPassRate * 100) : 0,
      label: `${allRuns.length} runs evaluated`,
    },
    {
      stage: "Claim Pipeline",
      score: Math.round(avgConfidence * 100),
      label: `${totalClaims} claims processed`,
    },
    { stage: "Safety Layer", score: 100, label: `${openFindings} findings flagged` },
    {
      stage: "Human Review",
      score:
        allCases.length > 0
          ? Math.round(100 - (inQueue / allCases.length) * 100)
          : 100,
      label: `${inQueue} in queue`,
    },
    { stage: "Reports", score: 0, label: "0 generated · V1" },
  ];

  return {
    overall_quality: Math.round(overallQuality * 10) / 10,
    active_projects: activeProjects,
    recent_runs_30d: allRuns.length,
    failed_cases: failedCases,
    high_risk_runs: highRiskRuns,
    pipeline_health,
    quality_breakdown,
  };
}

// ─── Project Intelligence Utilities ──────────────────────────────────────────

export interface ProjectCoverage {
  total: number;
  passing: number;
  failing: number;
  unscored: number;
  regressionCases: number;
  safetyCases: number;
}

export interface RecentQuality {
  totalRuns: number;
  lastScore: number | null;
  prevScore: number | null;
  delta: number | null;
  hasRegression: boolean;
  lastRunAt: string | null;
}

export interface ReviewStatus {
  open: number;
  p0Safety: number;
  p1LowConf: number;
  reviewed: number;
}

export interface SafetyState {
  openBlockers: number;
  piiFindings: number;
  falseConfFindings: number;
  policyFindings: number;
}

export interface RubricSummary {
  id: string;
  name: string;
  version: string;
  dimensionCount: number;
  weightsNormalized: boolean;
  safetyGateEnabled: boolean;
  minThreshold: number;
}

export function getProjectRuns(projectId: string): Run[] {
  return allRuns.filter((r) => r.project_id === projectId);
}

export function getProjectCases(projectId: string): Case[] {
  const runIds = new Set(getProjectRuns(projectId).map((r) => r.id));
  return allCases.filter((c) => runIds.has(c.run_id));
}

export function calculateProjectCoverage(cases: Case[], runs: Run[]): ProjectCoverage {
  const regressionRunIds = new Set(runs.filter((r) => r.regression_flag).map((r) => r.id));
  return {
    total: cases.length,
    passing: cases.filter((c) => c.scores.length > 0 && c.overall_score >= 70).length,
    failing: cases.filter((c) => c.scores.length > 0 && c.overall_score < 70).length,
    unscored: cases.filter((c) => c.scores.length === 0).length,
    regressionCases: cases.filter((c) => regressionRunIds.has(c.run_id)).length,
    safetyCases: cases.filter((c) => c.safety_findings.length > 0).length,
  };
}

export function calculateRecentQuality(runs: Run[]): RecentQuality {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
  const last = sorted[0] ?? null;
  const prev = sorted[1] ?? null;
  return {
    totalRuns: runs.length,
    lastScore: last?.overall_score ?? null,
    prevScore: prev?.overall_score ?? null,
    delta: last && prev ? +(last.overall_score - prev.overall_score).toFixed(1) : null,
    hasRegression: runs.some((r) => r.regression_flag),
    lastRunAt: last?.started_at ?? null,
  };
}

export function calculateReviewStatus(cases: Case[]): ReviewStatus {
  const openFindings = cases.flatMap((c) => c.safety_findings).filter((f) => f.status === "open");
  return {
    open: openFindings.length,
    p0Safety: openFindings.filter((f) => f.severity === "critical").length,
    p1LowConf: openFindings.filter((f) => f.severity === "high").length,
    reviewed: cases.filter((c) => c.human_review !== null).length,
  };
}

export function calculateSafetyState(cases: Case[]): SafetyState {
  const all = cases.flatMap((c) => c.safety_findings);
  return {
    openBlockers: all.filter((f) => f.status === "open").length,
    piiFindings: all.filter((f) => f.category === "pii_leakage").length,
    falseConfFindings: all.filter((f) => f.category === "false_confirmation").length,
    policyFindings: all.filter(
      (f) => f.category !== "pii_leakage" && f.category !== "false_confirmation",
    ).length,
  };
}

export function getActiveRubricSummary(project: Project): RubricSummary | null {
  if (!project.active_rubric) return null;
  const rubric = allRubrics.find((r) => r.id === project.active_rubric);
  if (!rubric) return null;
  const weightSum = rubric.dimensions.reduce((s, d) => s + d.weight, 0);
  const thresholds = rubric.dimensions.map((d) => d.threshold);
  return {
    id: rubric.id,
    name: rubric.name,
    version: rubric.version,
    dimensionCount: rubric.dimensions.length,
    weightsNormalized: Math.abs(weightSum - 1) < 0.001,
    safetyGateEnabled: rubric.safety_gates.length > 0,
    minThreshold: thresholds.length > 0 ? Math.min(...thresholds) : 0,
  };
}
