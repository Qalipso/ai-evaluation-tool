import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fetchCase, fetchRun, fetchProject, fetchRubric } from "@/lib/db";
import { methodLabel } from "@/lib/data";
import { HumanReviewForm } from "./HumanReviewForm";

export default async function ReviewCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await fetchCase(id);
  if (!c) notFound();

  const run = await fetchRun(c.run_id);
  const [project, rubric] = await Promise.all([
    run ? fetchProject(run.project_id) : Promise.resolve(undefined),
    run ? fetchRubric(run.rubric_id) : Promise.resolve(undefined),
  ]);

  const scoredIds = new Set(c.scores.map((s) => s.dim_id));
  const humanDims = (rubric?.dimensions ?? []).filter((d) => d.method === "human" && !scoredIds.has(d.id));
  const autoScores = c.scores;

  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <Link href="/review" className="text-xs text-text-muted hover:text-brand inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={12} /> Review queue
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Human review</h1>
        <p className="text-text-secondary text-sm mt-1">
          {project?.name} · {rubric?.name} · case <span className="font-mono">{c.id}</span>
        </p>
      </header>

      {/* Case text */}
      <div className="elev-card p-6 space-y-4 mb-5">
        <Block label="User input">{c.input}</Block>
        <Block label="Expected behavior">{c.expected_behavior}</Block>
        <Block label="AI output">{c.ai_output}</Block>
        {c.retrieved_context.length > 0 && (
          <div>
            <div className="text-[10px] uppercase text-text-muted mb-1.5">Retrieved context</div>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              {c.retrieved_context.map((ctx, i) => (
                <li key={i} className="bg-bg-card border border-border-subtle rounded-lg p-2.5">
                  <span className="text-text-muted font-mono mr-2">[{i + 1}]</span>
                  {ctx}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Automated scores (read-only context for the reviewer) */}
      {autoScores.length > 0 && (
        <div className="elev-card p-6 mb-5">
          <h2 className="text-sm font-semibold mb-3">Automated scores</h2>
          <div className="space-y-2">
            {autoScores.map((s) => (
              <div key={s.dim_id} className="flex items-baseline justify-between text-sm">
                <span>
                  {s.dim_id}
                  <span className="text-text-muted text-[11px] ml-2">· {methodLabel[s.method] ?? s.method}</span>
                </span>
                <span className={`font-mono text-xs ${s.threshold_passed ? "text-ok" : "text-bad"}`}>
                  {s.score.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      {humanDims.length > 0 ? (
        <div className="elev-card p-6">
          <h2 className="text-sm font-semibold mb-1">Score human dimensions</h2>
          <p className="text-xs text-text-muted mb-4">
            Read the case above and score each dimension from 0 to 1, with a short rationale.
          </p>
          <HumanReviewForm
            caseId={c.id}
            dims={humanDims.map((d) => ({ id: d.id, name: d.name, threshold: d.threshold }))}
          />
        </div>
      ) : (
        <div className="elev-card p-6 text-sm text-text-secondary">
          This case has no pending human dimensions.
        </div>
      )}
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-text-muted mb-1.5">{label}</div>
      <div className="text-sm bg-bg-card border border-border-subtle rounded-lg p-3 leading-relaxed">{children}</div>
    </div>
  );
}
