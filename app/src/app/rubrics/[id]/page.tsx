import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, Pill, Bar, scoreTone } from "@/components/ui";
import {
  getRubric, allProjects, allRuns, allCases, methodLabel,
} from "@/lib/data";
import { DeleteRubricButton } from "./DeleteRubricButton";
import { EditRubricForm } from "./EditRubricForm";

export default async function RubricDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const rubric = getRubric(id);
  if (!rubric) notFound();

  const project = allProjects.find((p) => p.id === rubric.project_id);
  const runs = allRuns.filter((r) => r.rubric_id === id);
  const cases = allCases.filter((c) => runs.some((r) => r.id === c.run_id));

  const weightSum = rubric.dimensions.reduce((s, d) => s + d.weight, 0);
  const weightOk = Math.abs(weightSum - 1) < 0.001;

  // Per-dimension analysis across all cases that used this rubric
  const dimAnalysis = rubric.dimensions.map((dim) => {
    const scores = cases.flatMap((c) => c.scores.filter((s) => s.dim_id === dim.id));
    const avgScore = scores.length > 0
      ? scores.reduce((s, sc) => s + sc.score, 0) / scores.length
      : null;
    const passRate = scores.length > 0
      ? scores.filter((s) => s.threshold_passed).length / scores.length
      : null;
    return { dim, avgScore, passRate, count: scores.length };
  });

  const isEditing = edit === "1";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
            <Link href="/rubrics" className="hover:text-brand">Rubrics</Link>
            <span>/</span>
            <span>{rubric.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{rubric.name}</h1>
            <Pill tone="brand">v{rubric.version}</Pill>
            {!weightOk && (
              <Pill tone="bad">weights ≠ 1.00</Pill>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-1">
            {project?.name ?? rubric.project_id} · owner {rubric.owner} · updated {rubric.updated}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!isEditing && (
            <Link
              href={`/rubrics/${id}?edit=1`}
              className="px-3 py-1.5 text-sm border border-border-subtle rounded-md hover:bg-bg-hover transition-colors"
            >
              Edit
            </Link>
          )}
          <DeleteRubricButton id={id} name={rubric.name} />
        </div>
      </div>

      {/* Edit form */}
      {isEditing && <EditRubricForm rubric={rubric} projects={allProjects} />}

      {/* Meta + Safety gates */}
      {!isEditing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetaCard label="Weight sum" value={weightSum.toFixed(2)} highlight={!weightOk ? "bad" : "ok"} />
          <MetaCard label="Dimensions" value={rubric.dimensions.length} />
          <MetaCard label="Safety gates" value={rubric.safety_gates.length} />
          <MetaCard label="Runs using this" value={runs.length} />
        </div>
      )}

      {/* Safety gates */}
      {!isEditing && rubric.safety_gates.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted uppercase tracking-wider">Safety gates:</span>
          {rubric.safety_gates.map((g) => (
            <Pill key={g} tone="bad">{g.replaceAll("_", " ")}</Pill>
          ))}
        </div>
      )}

      {/* Dimension analysis */}
      {!isEditing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Dimension analysis</h2>
            <span className="text-xs text-text-muted">
              {cases.length > 0 ? `${cases.length} cases · ${runs.length} runs` : "No runs yet — showing definition only"}
            </span>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-panel border-b border-border-subtle text-text-muted">
                  <tr className="text-left text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-medium">Dimension</th>
                    <th className="px-4 py-2.5 font-medium">Method</th>
                    <th className="px-4 py-2.5 font-medium text-right">Weight</th>
                    <th className="px-4 py-2.5 font-medium text-right">Threshold</th>
                    {cases.length > 0 && <>
                      <th className="px-4 py-2.5 font-medium text-right">Avg score</th>
                      <th className="px-4 py-2.5 font-medium text-right">Pass rate</th>
                      <th className="px-4 py-2.5 font-medium w-28">Performance</th>
                    </>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {dimAnalysis.map(({ dim, avgScore, passRate, count }) => {
                    const tone = avgScore !== null ? scoreTone(avgScore, dim.threshold) : "ok";
                    return (
                      <tr key={dim.id} className="hover:bg-bg-hover transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{dim.name}</div>
                          <div className="text-[10px] text-text-muted font-mono">{dim.id}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">
                          {methodLabel[dim.method] ?? dim.method}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                          {dim.weight.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-muted">
                          ≥{dim.threshold.toFixed(2)}
                        </td>
                        {cases.length > 0 && <>
                          <td className={`px-4 py-3 text-right font-mono tabular-nums ${avgScore !== null ? `text-${tone}` : "text-text-muted"}`}>
                            {avgScore !== null ? avgScore.toFixed(2) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                            {passRate !== null ? `${(passRate * 100).toFixed(0)}%` : "—"}
                            {count > 0 && <span className="text-text-muted ml-1">({count})</span>}
                          </td>
                          <td className="px-4 py-3">
                            {avgScore !== null ? (
                              <Bar value={avgScore} tone={tone} />
                            ) : (
                              <div className="text-xs text-text-muted">no data</div>
                            )}
                          </td>
                        </>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Runs that used this rubric */}
      {!isEditing && runs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Runs using this rubric</h2>
          <Card>
            <div className="divide-y divide-border-subtle">
              {runs.map((run) => {
                const proj = allProjects.find((p) => p.id === run.project_id);
                return (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium">{proj?.name ?? run.project_id}</div>
                      <div className="text-xs text-text-muted font-mono">{run.variable_changed} · {run.started_at.slice(0, 10)}</div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono tabular-nums">{run.overall_score.toFixed(2)}</span>
                      <span className="text-xs text-text-muted">{run.cases_passing}/{run.cases_total} passing</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetaCard({
  label, value, highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "ok" | "bad";
}) {
  const color = highlight === "bad" ? "text-bad" : highlight === "ok" ? "text-ok" : "";
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase text-text-muted mb-1">{label}</div>
      <div className={`text-sm font-mono font-medium ${color}`}>{value}</div>
    </Card>
  );
}
