import type { Run, Project, Rubric, Case } from "./data";

// Structured plain-text evaluation report, designed for downstream analysis:
// stable sections, key:value headers, one scored line per dimension per case.

function hr(ch = "=", n = 60): string {
  return ch.repeat(n);
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

export function buildRunTextReport(
  run: Run,
  project: Project | undefined,
  rubric: Rubric | undefined,
  cases: Case[],
): string {
  const L: string[] = [];
  const dims = rubric?.dimensions ?? [];
  const dimById = new Map(dims.map((d) => [d.id, d]));

  // ── Header ────────────────────────────────────────────────────────────────
  L.push("AI EVALUATION REPORT");
  L.push(hr());
  L.push(`run_id:        ${run.id}`);
  L.push(`project:       ${project?.name ?? run.project_id}`);
  L.push(`rubric:        ${rubric?.name ?? run.rubric_id} (v${rubric?.version ?? "?"})`);
  L.push(`model:         ${run.model}`);
  L.push(`dataset:       ${run.dataset_id}`);
  L.push(`started_at:    ${run.started_at}`);
  L.push(`verdict:       ${run.verdict}`);
  L.push(`overall_score: ${run.overall_score.toFixed(4)} (0..1)`);
  L.push(`cases_total:   ${run.cases_total}`);
  L.push(`cases_passing: ${run.cases_passing} (${fmtPct(run.cases_total ? run.cases_passing / run.cases_total : 0)})`);
  L.push(`safety_findings: ${run.safety_findings}`);
  L.push("");

  // ── Rubric ─────────────────────────────────────────────────────────────────
  L.push("RUBRIC");
  L.push(hr("-"));
  for (const d of dims) {
    L.push(`- ${d.id} | name="${d.name}" | method=${d.method} | weight=${d.weight} | threshold=${d.threshold}`);
  }
  if (rubric?.safety_gates.length) L.push(`safety_gates: ${rubric.safety_gates.join(", ")}`);
  L.push("");

  // ── Dimension averages (scored only) ────────────────────────────────────────
  L.push("DIMENSION AVERAGES");
  L.push(hr("-"));
  for (const d of dims) {
    const ds = cases.flatMap((c) => c.scores).filter((s) => s.dim_id === d.id);
    if (ds.length === 0) {
      L.push(`${d.id}: UNSCORED (method=${d.method}; no automated scorer)`);
      continue;
    }
    const avg = ds.reduce((s, x) => s + x.score, 0) / ds.length;
    const status = avg >= d.threshold ? "PASS" : "BELOW";
    L.push(`${d.id}: ${avg.toFixed(4)} >= ${d.threshold} ${status} (n=${ds.length}, method=${d.method})`);
  }
  L.push("");

  // ── Cases ───────────────────────────────────────────────────────────────────
  L.push(`CASES (${cases.length})`);
  L.push(hr("-"));
  cases.forEach((c, idx) => {
    L.push(`[${idx + 1}] case_id=${c.id} overall=${c.overall_score.toFixed(4)}${c.human_review ? ` human_review=${c.human_review}` : ""}`);
    L.push(`  INPUT: ${c.input}`);
    L.push(`  EXPECTED: ${c.expected_behavior}`);
    L.push(`  AI_OUTPUT: ${c.ai_output}`);
    if (c.retrieved_context.length) {
      L.push(`  CONTEXT:`);
      c.retrieved_context.forEach((ctx, i) => L.push(`    [${i}] ${ctx}`));
    }
    L.push(`  SCORES:`);
    for (const d of dims) {
      const s = c.scores.find((x) => x.dim_id === d.id);
      if (!s) {
        L.push(`    ${d.id}: UNSCORED (method=${d.method})`);
        continue;
      }
      const status = s.threshold_passed ? "PASS" : "BELOW";
      const thr = dimById.get(s.dim_id)?.threshold ?? "?";
      L.push(`    ${s.dim_id}: ${s.score.toFixed(4)} >= ${thr} ${status} (method=${s.method})`);
      if (s.rationale) L.push(`      rationale: ${s.rationale}`);
    }
    if (c.safety_findings.length) {
      L.push(`  SAFETY_FINDINGS:`);
      for (const f of c.safety_findings) L.push(`    ${f.category} | ${f.severity} | status=${f.status} | ${f.evidence}`);
    }
    if (c.claims.length) {
      L.push(`  CLAIMS:`);
      for (const cl of c.claims) L.push(`    ${cl.label} | conf=${cl.confidence.toFixed(2)} | ${cl.text}`);
    }
    L.push("");
  });

  L.push(hr());
  L.push("Methodology: LLM-judge dimensions scored at temperature 0 (variance applies).");
  L.push("Deterministic = code checks. UNSCORED dimensions (human/claim_pipeline) await review.");
  L.push(`Generated: ${new Date().toISOString()}`);

  return L.join("\n");
}
