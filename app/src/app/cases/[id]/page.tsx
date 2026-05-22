import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, Pill, Bar, scoreTone } from "@/components/ui";
import { HeatMap } from "@/components/heat-map";
import {
  allCases,
  getRun,
  getProject,
  getRubric,
  labelTone,
  methodLabel,
  verdictTone,
  fmtDate,
} from "@/lib/data";
import { ChevronLeft, ShieldAlert } from "lucide-react";

export function generateStaticParams() {
  return allCases.map((c) => ({ id: c.id }));
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = allCases.find((x) => x.id === id);
  if (!c) notFound();

  const run = getRun(c.run_id);
  const project = run ? getProject(run.project_id) : undefined;
  const rubric = run ? getRubric(run.rubric_id) : undefined;

  return (
    <div className="space-y-5 max-w-4xl">
      <Link
        href={`/runs/${c.run_id}`}
        className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1"
      >
        <ChevronLeft size={12} /> Run {c.run_id}
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-mono">{c.id}</h1>
          <p className="text-text-secondary text-sm mt-1">
            {project?.name}
            {run && <> · {fmtDate(run.started_at)}</>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase text-text-muted">Case score</div>
          <div
            className={`text-2xl font-semibold font-mono ${
              scoreTone(c.overall_score) === "ok"
                ? "text-ok"
                : scoreTone(c.overall_score) === "warn"
                  ? "text-warn"
                  : "text-bad"
            }`}
          >
            {c.overall_score.toFixed(1)}
          </div>
          <div className="text-xs text-text-muted">/100</div>
        </div>
      </header>

      <Card className="p-5 space-y-4">
        <Field label="Input">{c.input}</Field>
        <Field label="Expected behavior">{c.expected_behavior}</Field>

        <div>
          <div className="text-[10px] uppercase text-text-muted mb-1.5">AI output (heat map)</div>
          <div className="bg-bg-panel border border-border-subtle rounded-md p-4">
            <HeatMap output={c.ai_output} claims={c.claims} />
          </div>
          <div className="flex gap-3 mt-2 text-[10px] text-text-muted">
            <span><span className="heat-supported px-1">supported</span></span>
            <span><span className="heat-partial px-1">partial</span></span>
            <span><span className="heat-unsupported px-1">unsupported</span></span>
            <span><span className="heat-contradicted px-1">contradicted</span></span>
          </div>
        </div>

        {c.retrieved_context.length > 0 && (
          <div>
            <div className="text-[10px] uppercase text-text-muted mb-1.5">Retrieved context</div>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              {c.retrieved_context.map((ctx, i) => (
                <li key={i} className="bg-bg-panel border border-border-subtle rounded p-2">
                  <span className="text-text-muted font-mono mr-2">[{i + 1}]</span>
                  {ctx}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3">Claims ({c.claims.length})</h2>
        <div className="space-y-1.5">
          {c.claims.map((claim, i) => (
            <div
              key={i}
              className="flex items-start gap-3 text-xs bg-bg-panel border border-border-subtle rounded p-2.5"
            >
              <span className={`shrink-0 ${labelTone[claim.label]} text-[10px] uppercase`}>
                {claim.label.replaceAll("_", " ")}
              </span>
              <div className="min-w-0 flex-1">
                <div>{claim.text}</div>
                {claim.evidence && (
                  <div className="text-text-muted mt-0.5 text-[11px]">{claim.evidence}</div>
                )}
              </div>
              <span className="font-mono text-text-muted shrink-0">{claim.confidence.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Card>

      {c.scores.length > 0 && (
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-3">Dimension scores</h2>
          <div className="space-y-3">
            {c.scores.map((s) => {
              const dim = rubric?.dimensions.find((d) => d.id === s.dim_id);
              const tone = scoreTone(s.score, dim?.threshold ?? 70);
              return (
                <div key={s.dim_id} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>
                      {dim?.name ?? s.dim_id}
                      <span className="text-text-muted text-[11px] ml-2">
                        · {methodLabel[s.method] ?? s.method}
                      </span>
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"
                      }`}
                    >
                      {s.score}/{dim?.threshold ?? "—"}
                      {!s.threshold_passed && <span className="text-bad ml-2">below</span>}
                    </span>
                  </div>
                  <Bar value={s.score} tone={tone} />
                  <p className="text-[11px] text-text-muted">{s.rationale}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {c.safety_findings.length > 0 && (
        <Card className="p-5 border-bad/30">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
            <ShieldAlert size={15} className="text-bad" /> Safety findings
          </h2>
          <div className="space-y-2">
            {c.safety_findings.map((f, i) => (
              <div key={i} className="border border-bad/40 bg-bad/5 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-bad">{f.category.replaceAll("_", " ")}</span>
                  <Pill tone="bad">{f.severity}</Pill>
                </div>
                <p className="text-xs text-text-secondary">{f.evidence}</p>
                <div className="text-[10px] text-text-muted mt-1">status: {f.status}</div>
              </div>
            ))}
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
