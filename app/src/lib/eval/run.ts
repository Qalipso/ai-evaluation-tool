import "server-only";
import { getSupabase, hasSupabase } from "../supabase";
import { fetchRubric, fetchProject } from "../db";
import { isLlmMethod } from "./dimensions";
import { scoreWithJudge, type JudgeDimension } from "./judges";
import { scoreDeterministic, detectFindings, type EvalInput } from "./deterministic";
import { buildScores, overallScore, decideVerdict, type DimScore } from "./aggregate";
import { assertWithinBudget, addDailySpend } from "./budget";

export interface EvaluateArgs {
  project_id: string;
  rubric_id: string;
  input: string;
  expected_behavior: string;
  ai_output: string;
  retrieved_context: string[];
}

export interface EvaluateResult {
  run_id: string;
  case_id: string;
  overall_score: number;
  verdict: string;
  cost_usd: number;
}

export async function evaluateCase(args: EvaluateArgs): Promise<EvaluateResult> {
  if (!hasSupabase()) {
    throw new Error("Evaluation runner requires Supabase (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  }

  const rubric = await fetchRubric(args.rubric_id);
  if (!rubric) throw new Error(`Rubric "${args.rubric_id}" not found`);
  if (rubric.dimensions.length === 0) throw new Error("Rubric has no dimensions");

  const input: EvalInput = {
    input: args.input,
    expected_behavior: args.expected_behavior,
    ai_output: args.ai_output,
    retrieved_context: args.retrieved_context,
  };

  const llmDims: JudgeDimension[] = rubric.dimensions
    .filter((d) => isLlmMethod(d.method))
    .map((d) => ({ id: d.id, name: d.name }));

  // Budget guard before any paid call.
  let cost = 0;
  if (llmDims.length > 0) await assertWithinBudget();
  const judge = await scoreWithJudge(llmDims, input);
  cost = judge.cost_usd;
  if (cost > 0) await addDailySpend(cost);

  // Assemble per-dimension scores.
  const byDim: Record<string, DimScore> = {};
  for (const s of judge.scores) byDim[s.dim_id] = { score: s.score, rationale: s.rationale };
  for (const d of rubric.dimensions) {
    if (isLlmMethod(d.method)) continue;
    byDim[d.id] = scoreDeterministic(d.id, d.name, input);
  }

  const scores = buildScores(rubric.dimensions, byDim);
  const overall = overallScore(rubric.dimensions, scores);

  const findings = detectFindings(input);
  const hasCriticalSafety = findings.some((f) => f.severity === "critical");
  const verdict = decideVerdict(overall, scores, {
    hasCriticalSafety,
    safetyGateEnabled: rubric.safety_gates.length > 0,
  });

  // Persist run + case + children.
  const project = await fetchProject(args.project_id);
  const db = getSupabase();
  const stamp = Date.now();
  const runId = `run-adhoc-${stamp}`;
  const caseId = `case-adhoc-${stamp}`;
  const passing = overall >= 0.7 ? 1 : 0;

  const { error: runErr } = await db.from("runs").insert({
    id: runId,
    project_id: args.project_id,
    rubric_id: args.rubric_id,
    model: project?.model ?? "manual",
    dataset_id: "adhoc",
    started_at: new Date().toISOString(),
    cases_total: 1,
    cases_passing: passing,
    overall_score: overall,
    verdict,
    regression_flag: false,
    safety_findings: findings.length,
    variable_changed: "manual single-case run",
  });
  if (runErr) throw new Error(`insert run: ${runErr.message}`);

  const { error: caseErr } = await db.from("cases").insert({
    id: caseId,
    run_id: runId,
    input: args.input,
    expected_behavior: args.expected_behavior,
    ai_output: args.ai_output,
    retrieved_context: args.retrieved_context,
    overall_score: overall,
    human_review: null,
  });
  if (caseErr) throw new Error(`insert case: ${caseErr.message}`);

  if (scores.length) {
    const { error } = await db.from("scores").insert(
      scores.map((s, i) => ({
        case_id: caseId,
        dim_id: s.dim_id,
        score: s.score,
        method: s.method,
        rationale: s.rationale,
        threshold_passed: s.threshold_passed,
        ord: i,
      })),
    );
    if (error) throw new Error(`insert scores: ${error.message}`);
  }

  if (findings.length) {
    const { error } = await db.from("safety_findings").insert(
      findings.map((f, i) => ({
        case_id: caseId,
        category: f.category,
        severity: f.severity,
        evidence: f.evidence,
        status: "open",
        ord: i,
      })),
    );
    if (error) throw new Error(`insert safety_findings: ${error.message}`);
  }

  return { run_id: runId, case_id: caseId, overall_score: overall, verdict, cost_usd: cost };
}
