import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Pill,
  Bar,
  StatCard,
  scoreTone,
} from "@/components/ui";
import { HeatMap } from "@/components/heat-map";
import {
  getRun,
  getCasesByRun,
  getProject,
  getRubric,
  labelTone,
  methodLabel,
  verdictLabel,
  verdictTone,
  fmtDate,
} from "@/lib/data";
import { ChevronLeft, ShieldAlert } from "lucide-react";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) notFound();

  const project = getProject(run.project_id);
  const rubric = getRubric(run.rubric_id);
  const cases = getCasesByRun(run.id);
  const sample = cases[0];

  const dimAverages = rubric
    ? rubric.dimensions.map((d) => {
        const ds = cases
          .flatMap((c) => c.scores)
          .filter((s) => s.dim_id === d.id);
        const avg = ds.length
          ? ds.reduce((s, x) => s + x.score, 0) / ds.length
          : null;
        return { ...d, avg };
      })
    : [];

  const allClaims = cases.flatMap((c) => c.claims);
  const labelCounts = allClaims.reduce(
    (acc, c) => {
      acc[c.label] = (acc[c.label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <Link
        href="/runs"
        className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
      >
        <ChevronLeft size={12} /> All runs
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{project?.name}</h1>
          <p className="text-text-secondary text-sm mt-1">
            Run <span className="font-mono">{run.id}</span> · {fmtDate(run.started_at)}
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Pill tone="brand">rubric {rubric?.id}</Pill>
            <Pill>model {run.model}</Pill>
            <Pill>dataset {run.dataset_id}</Pill>
            <Pill>changed: {run.variable_changed}</Pill>
            {run.regression_flag && <Pill tone="bad">regression flagged</Pill>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase text-text-muted">Verdict</div>
          <div className={`text-2xl font-semibold ${verdictTone[run.verdict]}`}>
            {verdictLabel[run.verdict]}
          </div>
          <div className={`text-sm font-mono ${verdictTone[run.verdict]}`}>
            {run.overall_score.toFixed(1)}/100
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Cases"
          value={run.cases_total}
          sub={`${run.cases_passing} passing`}
        />
        <StatCard
          label="Pass rate"
          value={`${((run.cases_passing / run.cases_total) * 100).toFixed(0)}%`}
        />
        <StatCard
          label="Safety findings"
          value={run.safety_findings}
          tone={run.safety_findings > 0 ? "bad" : "ok"}
        />
        <StatCard label="Claims processed" value={allClaims.length} />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">Dimension breakdown</h2>
        <p className="text-xs text-text-muted mb-4">
          per-dimension averages across {cases.length} sample case(s) · safety is gated, not weighted
        </p>
        <div className="space-y-3">
          {dimAverages.map((d) => {
            const v = d.avg ?? 0;
            const tone = scoreTone(v, d.threshold);
            const passed = v >= d.threshold;
            return (
              <div key={d.id} className="space-y-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span>
                    {d.name}
                    <span className="text-text-muted text-[11px] ml-2">
                      · {methodLabel[d.method] ?? d.method} · weight{" "}
                      {d.weight.toFixed(2)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-xs">
                    {d.avg !== null ? (
                      <>
                        <span
                          className={
                            tone === "ok"
                              ? "text-ok"
                              : tone === "warn"
                                ? "text-warn"
                                : "text-bad"
                          }
                        >
                          {d.avg.toFixed(1)}
                        </span>
                        <span className="text-text-muted">
                          /{d.threshold}
                        </span>
                        {!passed && (
                          <span className="text-bad ml-2">below</span>
                        )}
                      </>
                    ) : (
                      <span className="text-text-muted">n/a</span>
                    )}
                  </span>
                </div>
                <Bar value={v} tone={tone} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">Claim distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["supported", "partially_supported", "unsupported", "contradicted"] as const).map(
            (label) => {
              const n = labelCounts[label] ?? 0;
              const tone = labelTone[label];
              return (
                <div
                  key={label}
                  className="bg-bg-panel border border-border-subtle rounded-md p-3"
                >
                  <div className="text-[10px] uppercase text-text-muted">
                    {label.replace("_", " ")}
                  </div>
                  <div className={`text-2xl font-semibold mt-1 ${tone}`}>
                    {n}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </Card>

      {cases.length > 1 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-3">Cases ({cases.length})</h2>
          <div className="space-y-2">
            {cases.map((c) => {
              const tone = scoreTone(c.overall_score);
              return (
                <Link
                  key={c.id}
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between p-3 bg-bg-panel border border-border-subtle rounded-md hover:bg-bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-text-muted">{c.id}</span>
                    {c.safety_findings.length > 0 && (
                      <ShieldAlert size={12} className="text-bad" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-muted">{c.claims.length} claims</span>
                    <span
                      className={`font-mono text-sm ${
                        tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"
                      }`}
                    >
                      {c.overall_score.toFixed(1)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {sample && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              {cases.length === 1 ? `Case · ${sample.id}` : `Sample case · ${sample.id}`}
            </h2>
            <div className="flex items-center gap-3">
              <Link href={`/cases/${sample.id}`} className="text-xs text-brand hover:underline">
                Full detail →
              </Link>
              <span className={`text-sm font-mono ${verdictTone[run.verdict]}`}>
                {sample.overall_score.toFixed(1)}/100
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Input">{sample.input}</Field>
            <Field label="Expected behavior">{sample.expected_behavior}</Field>

            <div>
              <div className="text-[10px] uppercase text-text-muted mb-1.5">
                AI output (heat map)
              </div>
              <div className="bg-bg-panel border border-border-subtle rounded-md p-4">
                <HeatMap output={sample.ai_output} claims={sample.claims} />
              </div>
              <div className="flex gap-3 mt-2 text-[10px] text-text-muted">
                <span><span className="heat-supported px-1">supported</span></span>
                <span><span className="heat-partial px-1">partial</span></span>
                <span><span className="heat-unsupported px-1">unsupported</span></span>
                <span><span className="heat-contradicted px-1">contradicted</span></span>
              </div>
            </div>

            {sample.retrieved_context.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-text-muted mb-1.5">
                  Retrieved context
                </div>
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {sample.retrieved_context.map((c, i) => (
                    <li
                      key={i}
                      className="bg-bg-panel border border-border-subtle rounded p-2"
                    >
                      <span className="text-text-muted font-mono mr-2">
                        [{i + 1}]
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase text-text-muted mb-1.5">
                Claims ({sample.claims.length})
              </div>
              <div className="space-y-1.5">
                {sample.claims.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-xs bg-bg-panel border border-border-subtle rounded p-2.5"
                  >
                    <span
                      className={`shrink-0 ${labelTone[c.label]} text-[10px] uppercase`}
                    >
                      {c.label.replace("_", " ")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div>{c.text}</div>
                      {c.evidence && (
                        <div className="text-text-muted mt-0.5 text-[11px]">
                          {c.evidence}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-text-muted shrink-0">
                      {c.confidence.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {sample.safety_findings.length > 0 && (
              <div>
                <div className="text-[10px] uppercase text-text-muted mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert size={11} /> Safety findings
                </div>
                <div className="space-y-1.5">
                  {sample.safety_findings.map((f, i) => (
                    <div
                      key={i}
                      className="border border-bad/40 bg-bad/5 rounded p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-bad">{f.category}</span>
                        <Pill tone="bad">{f.severity}</Pill>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {f.evidence}
                      </div>
                      <div className="text-[10px] text-text-muted mt-1">
                        status: {f.status} · gate cannot be score-averaged
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-text-muted mb-1.5">{label}</div>
      <div className="text-sm bg-bg-panel border border-border-subtle rounded-md p-3 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
