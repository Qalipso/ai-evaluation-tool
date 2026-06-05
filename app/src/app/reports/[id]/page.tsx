import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, Pill, Bar, scoreTone } from "@/components/ui";
import {
  verdictLabel,
  verdictTone,
  methodLabel,
  labelTone,
  fmtDate,
  pct,
  type Run,
  type Project,
  type Rubric,
  type Case,
} from "@/lib/data";
import { fetchRun, fetchProject, fetchRubric, fetchCasesByRun } from "@/lib/db";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { ReportExport } from "./ReportExport";

function buildMarkdown(
  run: Run,
  project: Project | undefined,
  rubric: Rubric | undefined,
  cases: Case[],
): string {
  const passRate = run.cases_total > 0
    ? Math.round((run.cases_passing / run.cases_total) * 100)
    : 0;
  const score = run.overall_score.toFixed(2);

  const dimAverages = rubric
    ? rubric.dimensions.map((d) => {
        const ds = cases.flatMap((c) => c.scores).filter((s) => s.dim_id === d.id);
        const avg = ds.length ? ds.reduce((s, x) => s + x.score, 0) / ds.length : null;
        const passing = ds.filter((s) => s.threshold_passed).length;
        return { ...d, avg, passing, total: ds.length };
      })
    : [];

  const allClaims = cases.flatMap((c) => c.claims);
  const supported = allClaims.filter((c) => c.label === "supported").length;
  const partial = allClaims.filter((c) => c.label === "partially_supported").length;
  const unsupported = allClaims.filter((c) => c.label === "unsupported").length;
  const contradicted = allClaims.filter((c) => c.label === "contradicted").length;

  const allSafety = cases.flatMap((c) => c.safety_findings);
  const failingCases = [...cases]
    .filter((c) => c.overall_score < 0.75)
    .sort((a, b) => a.overall_score - b.overall_score)
    .slice(0, 3);
  const passingCases = [...cases]
    .filter((c) => c.overall_score >= 0.85)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 2);

  const lines: string[] = [];

  // 1. Header
  lines.push(`# Evaluation Report`);
  lines.push(``);
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Project | ${project?.name ?? run.project_id} |`);
  lines.push(`| Rubric | ${rubric?.id ?? run.rubric_id} (v${rubric?.version ?? "?"}) |`);
  lines.push(`| Dataset | ${run.dataset_id} |`);
  lines.push(`| Model | ${run.model} |`);
  lines.push(`| Variable changed | ${run.variable_changed} |`);
  lines.push(`| Run ID | \`${run.id}\` |`);
  lines.push(`| Timestamp | ${fmtDate(run.started_at)} |`);
  lines.push(``);

  // 2. Verdict
  lines.push(`## Verdict`);
  lines.push(``);
  lines.push(`**${verdictLabel[run.verdict] ?? run.verdict}**`);
  if (run.regression_flag) lines.push(`\n> Regression flagged — score dropped vs previous run on same dataset.`);
  if (run.safety_findings > 0) lines.push(`\n> ${run.safety_findings} safety finding(s) open — see §6.`);
  lines.push(``);

  // 3. Summary
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`Evaluated ${run.cases_total} outputs against rubric \`${rubric?.id ?? run.rubric_id}\`. Overall score ${score}/1.0 — ${verdictLabel[run.verdict] ?? run.verdict}. ${
    run.regression_flag
      ? `Regression flagged: score dropped vs previous run.`
      : run.safety_findings > 0
        ? `${run.safety_findings} safety finding(s) require resolution before shipping.`
        : `No safety findings; no regression.`
  }`);
  lines.push(``);

  // 4. Aggregate scores
  lines.push(`## Aggregate Scores`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Overall score | ${score}/1.0 |`);
  lines.push(`| Pass rate | ${passRate}% (${run.cases_passing}/${run.cases_total}) |`);
  lines.push(`| Cases evaluated | ${run.cases_total} |`);
  if (run.safety_findings > 0) lines.push(`| Safety findings | ${run.safety_findings} |`);
  lines.push(``);

  // 5. Dimension breakdown
  if (dimAverages.length > 0) {
    lines.push(`## Dimension Breakdown`);
    lines.push(``);
    lines.push(`| Dimension | Mean | Threshold | Pass rate | Method |`);
    lines.push(`|-----------|------|-----------|-----------|--------|`);
    dimAverages.forEach((d) => {
      const mean = d.avg != null ? d.avg.toFixed(2) : "—";
      const passRate = d.total > 0 ? `${Math.round((d.passing / d.total) * 100)}%` : "—";
      const flag = d.avg != null && d.avg < d.threshold ? " ⚠" : "";
      lines.push(
        `| ${d.name} | ${mean}${flag} | ${d.threshold.toFixed(2)} | ${passRate} | ${methodLabel[d.method] ?? d.method} |`,
      );
    });
    lines.push(``);
  }

  // 6. Safety findings
  lines.push(`## Safety Findings`);
  lines.push(``);
  if (allSafety.length === 0) {
    lines.push(`No safety findings.`);
  } else {
    allSafety.forEach((f) => {
      lines.push(`- **${f.category}** (${f.severity}) — ${f.evidence} — Status: ${f.status}`);
    });
  }
  lines.push(``);

  // 7. Hallucination summary
  lines.push(`## Hallucination Summary`);
  lines.push(``);
  lines.push(`| Label | Count |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Supported | ${supported} |`);
  lines.push(`| Partially supported | ${partial} |`);
  lines.push(`| Unsupported | ${unsupported} |`);
  lines.push(`| Contradicted | ${contradicted} |`);
  lines.push(`| **Total claims** | **${allClaims.length}** |`);
  lines.push(``);

  // 8. Groundedness summary
  const groundedScore = rubric?.dimensions.find((d) => d.id === "groundedness");
  if (groundedScore) {
    lines.push(`## Groundedness Summary`);
    lines.push(``);
    lines.push(`Groundedness dimension tracked. Threshold: ${groundedScore.threshold.toFixed(2)}/1.0. See dimension breakdown above.`);
    lines.push(``);
  }

  // 9. Failing cases
  if (failingCases.length > 0) {
    lines.push(`## Failing Cases (top ${failingCases.length})`);
    lines.push(``);
    failingCases.forEach((c, i) => {
      lines.push(`### Case ${i + 1}: \`${c.id}\``);
      lines.push(``);
      lines.push(`**Score:** ${c.overall_score.toFixed(2)}/1.0`);
      lines.push(``);
      lines.push(`**Input:** ${c.input}`);
      lines.push(``);
      lines.push(`**Expected:** ${c.expected_behavior}`);
      lines.push(``);
      lines.push(`**AI output:** ${c.ai_output}`);
      lines.push(``);
      const unsupportedClaims = c.claims.filter(
        (cl) => cl.label === "unsupported" || cl.label === "contradicted",
      );
      if (unsupportedClaims.length > 0) {
        lines.push(`**Problem claims:**`);
        unsupportedClaims.forEach((cl) => {
          lines.push(`- "${cl.text}" — ${cl.label} (confidence ${cl.confidence})`);
        });
        lines.push(``);
      }
      if (c.human_review) {
        lines.push(`**Reviewer note:** ${c.human_review}`);
        lines.push(``);
      }
    });
  }

  // 10. Exemplar passing cases
  if (passingCases.length > 0) {
    lines.push(`## Exemplar Passing Cases`);
    lines.push(``);
    passingCases.forEach((c, i) => {
      lines.push(`### Case ${i + 1}: \`${c.id}\``);
      lines.push(``);
      lines.push(`**Score:** ${c.overall_score.toFixed(2)}/1.0`);
      lines.push(``);
      lines.push(`**Input:** ${c.input}`);
      lines.push(``);
    });
  }

  // 11. Overrides
  const reviewed = cases.filter((c) => c.human_review !== null);
  lines.push(`## Overrides`);
  lines.push(``);
  if (reviewed.length === 0) {
    lines.push(`No human overrides recorded for this run.`);
  } else {
    reviewed.forEach((c) => {
      lines.push(`- \`${c.id}\`: ${c.human_review}`);
    });
  }
  lines.push(``);

  // 12. Recommendations
  lines.push(`## Recommendations`);
  lines.push(``);
  const belowThreshold = dimAverages.filter(
    (d) => d.avg != null && d.avg < d.threshold,
  );
  if (belowThreshold.length === 0 && allSafety.length === 0 && !run.regression_flag) {
    lines.push(`Run passes all thresholds. Ready for promotion decision per release policy.`);
  } else {
    if (allSafety.length > 0) {
      lines.push(
        `1. **Resolve safety findings** — ${allSafety.length} open finding(s) must be closed before shipping.`,
      );
    }
    if (run.regression_flag) {
      lines.push(
        `${allSafety.length > 0 ? "2" : "1"}. **Investigate regression** — score dropped vs previous run on same dataset. Diff prompt versions.`,
      );
    }
    belowThreshold.forEach((d, i) => {
      const n = (allSafety.length > 0 ? 1 : 0) + (run.regression_flag ? 1 : 0) + i + 1;
      lines.push(
        `${n}. **Improve ${d.name}** — mean ${(d.avg ?? 0).toFixed(2)}, threshold ${d.threshold.toFixed(2)}. Review failing cases in this dimension.`,
      );
    });
  }
  lines.push(``);

  // 13. Appendix: configuration
  lines.push(`## Appendix: Configuration`);
  lines.push(``);
  lines.push(`\`\`\``);
  lines.push(`run_id:          ${run.id}`);
  lines.push(`project_id:      ${run.project_id}`);
  lines.push(`rubric_id:       ${rubric?.id ?? run.rubric_id}`);
  lines.push(`rubric_version:  ${rubric?.version ?? "unknown"}`);
  lines.push(`model:           ${run.model}`);
  lines.push(`dataset_id:      ${run.dataset_id}`);
  lines.push(`variable_changed: ${run.variable_changed}`);
  lines.push(`cases_total:     ${run.cases_total}`);
  lines.push(`cases_passing:   ${run.cases_passing}`);
  lines.push(`overall_score:   ${run.overall_score}`);
  lines.push(`safety_findings: ${run.safety_findings}`);
  lines.push(`regression_flag: ${run.regression_flag}`);
  if (rubric) {
    lines.push(``);
    lines.push(`dimensions:`);
    rubric.dimensions.forEach((d) => {
      lines.push(`  - ${d.id}: threshold=${d.threshold} method=${d.method} weight=${d.weight}`);
    });
    if (rubric.safety_gates.length > 0) {
      lines.push(``);
      lines.push(`safety_gates: ${rubric.safety_gates.join(", ")}`);
    }
  }
  lines.push(`\`\`\``);
  lines.push(``);
  lines.push(`## Methodology notes`);
  lines.push(``);
  lines.push(`- LLM-judge dimensions are scored at temperature 0 for stability, but judge scores still carry run-to-run variance. Treat a single run as one sample, not ground truth.`);
  lines.push(`- Deterministic dimensions use heuristic checks (length, PII, false-confirmation patterns), not an LLM.`);
  lines.push(`- Overall score is the weighted mean of dimension scores; verdict also applies the rubric's safety gate.`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`*Generated by AI Evaluation Tool · ${new Date().toISOString().slice(0, 10)}*`);

  return lines.join("\n");
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await fetchRun(id);
  if (!run) notFound();

  const [project, rubric, cases] = await Promise.all([
    fetchProject(run.project_id),
    fetchRubric(run.rubric_id),
    fetchCasesByRun(run.id),
  ]);

  const score = run.overall_score.toFixed(2);
  const passRate = run.cases_total > 0
    ? Math.round((run.cases_passing / run.cases_total) * 100)
    : 0;

  const dimAverages = rubric
    ? rubric.dimensions.map((d) => {
        const ds = cases.flatMap((c) => c.scores).filter((s) => s.dim_id === d.id);
        const avg = ds.length ? ds.reduce((s, x) => s + x.score, 0) / ds.length : null;
        const passing = ds.filter((s) => s.threshold_passed).length;
        return { ...d, avg, passing, total: ds.length };
      })
    : [];

  const allClaims = cases.flatMap((c) => c.claims);
  const supported = allClaims.filter((c) => c.label === "supported").length;
  const partial = allClaims.filter((c) => c.label === "partially_supported").length;
  const unsupported = allClaims.filter((c) => c.label === "unsupported").length;
  const contradicted = allClaims.filter((c) => c.label === "contradicted").length;

  const allSafety = cases.flatMap((c) => c.safety_findings);
  const failingCases = [...cases]
    .filter((c) => c.overall_score < 0.75)
    .sort((a, b) => a.overall_score - b.overall_score)
    .slice(0, 3);
  const passingCases = [...cases]
    .filter((c) => c.overall_score >= 0.85)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 2);
  const reviewed = cases.filter((c) => c.human_review !== null);
  const belowThreshold = dimAverages.filter(
    (d) => d.avg != null && d.avg < d.threshold,
  );

  const markdown = buildMarkdown(run, project, rubric, cases);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 surface-enter">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/reports"
          className="text-xs text-text-muted hover:text-brand transition-colors inline-flex items-center gap-1"
        >
          <ChevronLeft size={12} /> All reports
        </Link>
        <ReportExport
          markdown={markdown}
          filename={`report-${run.id}.md`}
        />
      </div>

      {/* 1. Header */}
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {project?.name ?? run.project_id}
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          Run <span className="font-mono">{run.id}</span> · {fmtDate(run.started_at)}
        </p>
        <div className="flex gap-2 mt-3 flex-wrap justify-center">
          <Pill tone="brand">rubric {rubric?.id ?? run.rubric_id}</Pill>
          <Pill>model {run.model}</Pill>
          <Pill>dataset {run.dataset_id}</Pill>
          <Pill>changed: {run.variable_changed}</Pill>
          {run.regression_flag && <Pill tone="bad">regression flagged</Pill>}
        </div>
      </header>

      {/* 2. Verdict */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Verdict</div>
        <div className={`text-xl font-semibold ${verdictTone[run.verdict] ?? ""}`}>
          {verdictLabel[run.verdict] ?? run.verdict}
        </div>
        {run.regression_flag && (
          <p className="text-xs text-warn mt-1">
            Regression flagged — score dropped vs previous run on same dataset.
          </p>
        )}
        {run.safety_findings > 0 && (
          <p className="text-xs text-bad mt-1 flex items-center gap-1">
            <ShieldAlert size={12} />
            {run.safety_findings} safety finding(s) open — see Safety Findings below.
          </p>
        )}
      </Card>

      {/* 3. Summary */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Summary</div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Evaluated {run.cases_total} outputs against rubric{" "}
          <span className="font-mono text-text-primary">{rubric?.id ?? run.rubric_id}</span>. Overall score{" "}
          <span className={`font-semibold text-${scoreTone(run.overall_score)}`}>
            {score}/1.0
          </span>{" "}
          — {verdictLabel[run.verdict] ?? run.verdict}.{" "}
          {run.regression_flag
            ? "Regression flagged: score dropped vs previous run."
            : run.safety_findings > 0
              ? `${run.safety_findings} safety finding(s) require resolution before shipping.`
              : "No safety findings; no regression."}
        </p>
      </Card>

      {/* 4. Aggregate scores */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Overall</div>
          <div className={`text-3xl font-semibold mt-1 text-${scoreTone(run.overall_score)}`}>{score}</div>
          <div className="text-xs text-text-muted mt-0.5">/ 1.0</div>
        </Card>
        <Card className="px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Pass rate</div>
          <div className={`text-3xl font-semibold mt-1 text-${scoreTone(passRate / 100)}`}>{passRate}%</div>
          <div className="text-xs text-text-muted mt-0.5">
            {run.cases_passing}/{run.cases_total} cases
          </div>
        </Card>
        <Card className="px-4 py-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Safety</div>
          <div
            className={`text-3xl font-semibold mt-1 ${allSafety.length > 0 ? "text-bad" : "text-ok"}`}
          >
            {allSafety.length}
          </div>
          <div className="text-xs text-text-muted mt-0.5">findings</div>
        </Card>
      </div>

      {/* 5. Dimension breakdown */}
      {dimAverages.length > 0 && (
        <Card className="px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
            Dimension Breakdown
          </div>
          <div className="space-y-3">
            {dimAverages.map((d) => {
              const val = d.avg;
              const below = val != null && val < d.threshold;
              return (
                <div key={d.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={below ? "text-warn" : "text-text-secondary"}>
                      {d.name}
                      {below && " ⚠"}
                    </span>
                    <div className="flex items-center gap-3 text-text-muted">
                      <span>
                        {d.total > 0
                          ? `${Math.round((d.passing / d.total) * 100)}% pass`
                          : "no data"}
                      </span>
                      <span className="font-mono">
                        {val != null ? val.toFixed(2) : "—"} ≥{d.threshold.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {val != null && (
                    <Bar value={val} tone={below ? "warn" : "ok"} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 6. Safety findings */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
          <ShieldAlert size={11} /> Safety Findings
        </div>
        {allSafety.length === 0 ? (
          <p className="text-sm text-ok">No safety findings.</p>
        ) : (
          <div className="space-y-2">
            {allSafety.map((f, i) => (
              <div
                key={i}
                className="text-xs border border-bad/30 bg-bad/5 rounded px-3 py-2 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Pill tone="bad">{f.severity}</Pill>
                  <span className="font-medium text-text-primary">{f.category}</span>
                  <span className="text-text-muted">{f.status}</span>
                </div>
                <div className="text-text-secondary">{f.evidence}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 7. Hallucination summary */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
          Hallucination Summary
        </div>
        {allClaims.length === 0 ? (
          <p className="text-sm text-text-muted">No cases with claim data in this run.</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            {[
              { label: "Supported", count: supported, cls: "text-ok" },
              { label: "Partial", count: partial, cls: "text-warn" },
              { label: "Unsupported", count: unsupported, cls: "text-bad" },
              { label: "Contradicted", count: contradicted, cls: "text-bad" },
            ].map(({ label, count, cls }) => (
              <div key={label} className="bg-bg-base rounded p-2">
                <div className={`text-xl font-semibold ${cls}`}>{count}</div>
                <div className="text-text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
        {allClaims.length > 0 && (
          <div className="text-xs text-text-muted mt-2">
            {allClaims.length} total claims across {cases.length} cases
          </div>
        )}
      </Card>

      {/* 9. Failing cases */}
      {failingCases.length > 0 && (
        <Card className="px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
            Failing Cases (top {failingCases.length})
          </div>
          <div className="space-y-4">
            {failingCases.map((c) => (
              <div key={c.id} className="border-b border-border-subtle pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/cases/${c.id}`}
                    className="font-mono text-xs text-brand hover:underline"
                  >
                    {c.id}
                  </Link>
                  <span className={`text-xs font-medium text-${scoreTone(c.overall_score)}`}>
                    {c.overall_score.toFixed(2)}/1.0
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{c.input}</p>
                {c.claims.filter((cl) => cl.label === "unsupported" || cl.label === "contradicted").length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {c.claims
                      .filter((cl) => cl.label === "unsupported" || cl.label === "contradicted")
                      .map((cl, i) => (
                        <div key={i} className="text-xs text-bad bg-bad/5 border border-bad/20 rounded px-2 py-1">
                          &ldquo;{cl.text}&rdquo;
                        </div>
                      ))}
                  </div>
                )}
                {c.human_review && (
                  <p className="text-xs text-warn mt-1.5 italic">{c.human_review}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 10. Exemplar passing cases */}
      {passingCases.length > 0 && (
        <Card className="px-5 py-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
            Exemplar Passing Cases
          </div>
          <div className="space-y-3">
            {passingCases.map((c) => (
              <div key={c.id} className="border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/cases/${c.id}`}
                    className="font-mono text-xs text-brand hover:underline"
                  >
                    {c.id}
                  </Link>
                  <span className="text-xs text-ok font-medium">
                    {c.overall_score.toFixed(2)}/1.0
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2">{c.input}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 11. Overrides */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
          Overrides
        </div>
        {reviewed.length === 0 ? (
          <p className="text-sm text-text-muted">No human overrides recorded.</p>
        ) : (
          <ul className="space-y-1 text-xs text-text-secondary">
            {reviewed.map((c) => (
              <li key={c.id}>
                <span className="font-mono text-brand">{c.id}</span>: {c.human_review}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 12. Recommendations */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
          Recommendations
        </div>
        {belowThreshold.length === 0 && allSafety.length === 0 && !run.regression_flag ? (
          <p className="text-sm text-ok">
            All thresholds passed. Ready for promotion decision per release policy.
          </p>
        ) : (
          <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
            {allSafety.length > 0 && (
              <li>
                <strong className="text-bad">Resolve safety findings</strong> —{" "}
                {allSafety.length} open finding(s) must be closed before shipping.
              </li>
            )}
            {run.regression_flag && (
              <li>
                <strong className="text-warn">Investigate regression</strong> — score dropped
                vs previous run. Diff prompt versions.
              </li>
            )}
            {belowThreshold.map((d) => (
              <li key={d.id}>
                <strong className="text-warn">Improve {d.name}</strong> — mean{" "}
                {(d.avg ?? 0).toFixed(2)}, threshold {d.threshold.toFixed(2)}. Review failing
                cases in this dimension.
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* 13. Appendix */}
      <Card className="px-5 py-4">
        <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">
          Appendix: Configuration
        </div>
        <pre className="text-[11px] text-text-muted font-mono leading-relaxed overflow-x-auto">
          {`run_id:           ${run.id}
project_id:       ${run.project_id}
rubric_id:        ${rubric?.id ?? run.rubric_id}
rubric_version:   ${rubric?.version ?? "unknown"}
model:            ${run.model}
dataset_id:       ${run.dataset_id}
variable_changed: ${run.variable_changed}
cases_total:      ${run.cases_total}
cases_passing:    ${run.cases_passing}
overall_score:    ${run.overall_score}
safety_findings:  ${run.safety_findings}
regression_flag:  ${run.regression_flag}`}
        </pre>
      </Card>
    </div>
  );
}
