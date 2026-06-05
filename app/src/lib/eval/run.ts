import "server-only";
import { getSupabase, hasSupabase } from "../supabase";
import { fetchRubric, fetchProject, getSettings } from "../db";
import { isLlmMethod, isSemanticMethod, hasRealScorer, isHumanMethod, isClaimMethod } from "./dimensions";
import { scoreWithJudge, type JudgeDimension } from "./judges";
import { scoreSemanticSimilarity } from "./semantic";
import { scoreDeterministic, detectFindings, type EvalInput, type DetectedFinding } from "./deterministic";
import { runClaimPipeline, type VerifiedClaim } from "./claims";
import { buildScores, overallScore, decideVerdict, type DimScore } from "./aggregate";
import { assertWithinBudget, addDailySpend } from "./budget";
import type { Rubric, Score, Claim } from "../data";

export interface EvaluateArgs {
  project_id: string;
  rubric_id: string;
  input: string;
  expected_behavior: string;
  ai_output: string;
  retrieved_context: string[];
  model?: string;
}

export interface EvaluateResult {
  run_id: string;
  case_id: string;
  overall_score: number;
  verdict: string;
  cost_usd: number;
}

// Score one case against a rubric. LLM + deterministic + claim pipeline.
interface ScoredCase {
  scores: Score[];
  overall: number;
  verdict: string;
  findings: DetectedFinding[];
  claims: VerifiedClaim[];
  cost_usd: number;
}

interface ScoreOpts {
  judgeModel?: string;
  claimModel?: string;
  detPii?: boolean;
  detFalseConfirm?: boolean;
}

async function scoreOne(rubric: Rubric, input: EvalInput, opts: ScoreOpts = {}): Promise<ScoredCase> {
  // Only dimensions with a real automated scorer are evaluated. `human` and
  // generic deterministic dims have none and stay unscored (no fabricated score).
  const scoredDims = rubric.dimensions.filter((d) => hasRealScorer(d.method, d.id));
  const llmDims: JudgeDimension[] = scoredDims
    .filter((d) => isLlmMethod(d.method))
    .map((d) => ({ id: d.id, name: d.name }));
  const semanticDims = scoredDims.filter((d) => isSemanticMethod(d.method));
  const hasClaimDim = scoredDims.some((d) => isClaimMethod(d.method));

  let cost = 0;
  if (llmDims.length > 0 || semanticDims.length > 0 || hasClaimDim) await assertWithinBudget();

  const judge = await scoreWithJudge(llmDims, input, opts.judgeModel);
  cost += judge.cost_usd;
  if (judge.cost_usd > 0) await addDailySpend(judge.cost_usd);

  // Claim pipeline (groundedness) — runs once, scores all claim_pipeline dims.
  let claims: VerifiedClaim[] = [];
  let claimScore = 0;
  if (hasClaimDim) {
    const cp = await runClaimPipeline(input, opts.claimModel);
    claims = cp.claims;
    claimScore = cp.score;
    cost += cp.cost_usd;
  }

  const byDim: Record<string, DimScore> = {};
  for (const s of judge.scores) byDim[s.dim_id] = { score: s.score, rationale: s.rationale };

  // Semantic similarity — real cosine of embeddings vs the expected behavior.
  for (const d of semanticDims) {
    const sem = await scoreSemanticSimilarity(input.ai_output, input.expected_behavior);
    cost += sem.cost_usd;
    byDim[d.id] = {
      score: sem.score,
      rationale: input.expected_behavior.trim()
        ? `Cosine similarity to expected behavior: ${sem.score.toFixed(2)}.`
        : "No reference (expected behavior) to compare against.",
    };
  }

  for (const d of scoredDims) {
    if (isLlmMethod(d.method) || isSemanticMethod(d.method)) continue;
    if (isClaimMethod(d.method)) {
      const supported = claims.filter((c) => c.label === "supported").length;
      byDim[d.id] = {
        score: claimScore,
        rationale: claims.length
          ? `Groundedness from ${claims.length} claims (${supported} supported).`
          : "No factual claims detected; nothing ungrounded.",
      };
      continue;
    }
    // Only safety reaches here (real deterministic).
    byDim[d.id] = scoreDeterministic(d.id, d.name, input);
  }

  // Weighted overall is renormalized over scored dimensions only.
  const scores = buildScores(scoredDims, byDim);
  const overall = overallScore(scoredDims, scores);
  const findings = detectFindings(input, { pii: opts.detPii, falseConfirm: opts.detFalseConfirm });
  const gateTriggered = findings.some((f) => rubric.safety_gates.includes(f.category));
  const verdict = decideVerdict(overall, scores, {
    hasCriticalSafety: findings.some((f) => f.severity === "critical"),
    safetyGateEnabled: rubric.safety_gates.length > 0,
    gateTriggered,
  });

  return { scores, overall, verdict, findings, claims, cost_usd: cost };
}

async function insertCaseChildren(
  caseId: string,
  scores: Score[],
  findings: DetectedFinding[],
  claims: Claim[] = [],
): Promise<void> {
  const db = getSupabase();
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
  if (claims.length) {
    const { error } = await db.from("claims").insert(
      claims.map((c, i) => ({
        case_id: caseId,
        text: c.text,
        label: c.label,
        confidence: c.confidence,
        source_idx: c.source_idx,
        evidence: c.evidence,
        ord: i,
      })),
    );
    if (error) throw new Error(`insert claims: ${error.message}`);
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
  const settings = await getSettings();
  const r = await scoreOne(rubric, input, {
    judgeModel: args.model || settings.judge_model,
    claimModel: settings.claim_model,
    detPii: settings.det_pii,
    detFalseConfirm: settings.det_false_confirm,
  });
  const needsHuman = rubric.dimensions.some((d) => isHumanMethod(d.method));

  const project = await fetchProject(args.project_id);
  const db = getSupabase();
  const stamp = Date.now();
  const runId = `run-adhoc-${stamp}`;
  const caseId = `case-adhoc-${stamp}`;

  const { error: runErr } = await db.from("runs").insert({
    id: runId,
    project_id: args.project_id,
    rubric_id: args.rubric_id,
    model: args.model || project?.model || "manual",
    dataset_id: "adhoc",
    started_at: new Date().toISOString(),
    cases_total: 1,
    cases_passing: r.overall >= 0.7 ? 1 : 0,
    overall_score: r.overall,
    verdict: r.verdict,
    regression_flag: false,
    safety_findings: r.findings.length,
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
    overall_score: r.overall,
    human_review: needsHuman ? "pending" : null,
  });
  if (caseErr) throw new Error(`insert case: ${caseErr.message}`);

  await insertCaseChildren(caseId, r.scores, r.findings, r.claims);

  return { run_id: runId, case_id: caseId, overall_score: r.overall, verdict: r.verdict, cost_usd: r.cost_usd };
}

// ── Batch: one run, N cases (rubric-generated dataset) ───────────────────────
export interface BatchCaseInput {
  input: string;
  expected_behavior: string;
  ai_output: string;
  retrieved_context: string[];
}

export interface BatchResult {
  run_id: string;
  cases_total: number;
  cases_passing: number;
  overall_score: number;
  verdict: string;
  cost_usd: number;
}

export async function evaluateBatch(args: {
  project_id: string;
  rubric_id: string;
  master_prompt: string;
  cases: BatchCaseInput[];
  model?: string;
}): Promise<BatchResult> {
  if (!hasSupabase()) {
    throw new Error("Evaluation runner requires Supabase (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (args.cases.length === 0) throw new Error("No cases to evaluate");

  const rubric = await fetchRubric(args.rubric_id);
  if (!rubric) throw new Error(`Rubric "${args.rubric_id}" not found`);
  if (rubric.dimensions.length === 0) throw new Error("Rubric has no dimensions");

  const needsHuman = rubric.dimensions.some((d) => isHumanMethod(d.method));
  const settings = await getSettings();
  const opts = {
    judgeModel: args.model || settings.judge_model,
    claimModel: settings.claim_model,
    detPii: settings.det_pii,
    detFalseConfirm: settings.det_false_confirm,
  };
  // Score cases concurrently — cuts wall time ~Nx and shrinks the window where
  // a dev hot-reload could drop the in-flight server action.
  const scored: ScoredCase[] = await Promise.all(
    args.cases.map((c) =>
      scoreOne(rubric, {
        input: c.input,
        expected_behavior: c.expected_behavior,
        ai_output: c.ai_output,
        retrieved_context: c.retrieved_context,
      }, opts),
    ),
  );

  const total = scored.length;
  const passing = scored.filter((s) => s.overall >= 0.7).length;
  const avg = Math.round((scored.reduce((s, x) => s + x.overall, 0) / total) * 100) / 100;
  const totalFindings = scored.reduce((s, x) => s + x.findings.length, 0);
  const totalCost = scored.reduce((s, x) => s + x.cost_usd, 0);
  const anyBlocked =
    rubric.safety_gates.length > 0 && scored.some((s) => s.verdict === "blocked");
  const runVerdict = anyBlocked
    ? "blocked"
    : avg >= 0.85 && passing === total
      ? "ship_ready"
      : avg >= 0.7
        ? "acceptable_with_caveats"
        : "needs_work";

  const project = await fetchProject(args.project_id);
  const db = getSupabase();
  const stamp = Date.now();
  const runId = `run-batch-${stamp}`;

  const { error: runErr } = await db.from("runs").insert({
    id: runId,
    project_id: args.project_id,
    rubric_id: args.rubric_id,
    model: args.model || project?.model || "manual",
    dataset_id: "generated",
    started_at: new Date().toISOString(),
    cases_total: total,
    cases_passing: passing,
    overall_score: avg,
    verdict: runVerdict,
    regression_flag: false,
    safety_findings: totalFindings,
    variable_changed: "rubric-generated batch",
  });
  if (runErr) throw new Error(`insert run: ${runErr.message}`);

  for (let i = 0; i < total; i++) {
    const c = args.cases[i];
    const r = scored[i];
    const caseId = `case-batch-${stamp}-${i}`;
    const { error: caseErr } = await db.from("cases").insert({
      id: caseId,
      run_id: runId,
      input: c.input,
      expected_behavior: c.expected_behavior,
      ai_output: c.ai_output,
      retrieved_context: c.retrieved_context,
      overall_score: r.overall,
      human_review: needsHuman ? "pending" : null,
    });
    if (caseErr) throw new Error(`insert case ${i}: ${caseErr.message}`);
    await insertCaseChildren(caseId, r.scores, r.findings, r.claims);
  }

  return {
    run_id: runId,
    cases_total: total,
    cases_passing: passing,
    overall_score: avg,
    verdict: runVerdict,
    cost_usd: totalCost,
  };
}
