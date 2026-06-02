import Link from "next/link";
import { Card, Pill, scoreTone } from "@/components/ui";
import {
  verdictLabel,
  verdictTone,
  fmtDate,
  pct,
} from "@/lib/data";
import { fetchRuns, fetchProjects, fetchRubrics } from "@/lib/db";
import { FileText, Download, ShieldAlert } from "lucide-react";

export default async function ReportsPage() {
  const [allRuns, allProjects, allRubrics] = await Promise.all([
    fetchRuns(),
    fetchProjects(),
    fetchRubrics(),
  ]);
  const runsWithData = allRuns.map((run) => ({
    run,
    project: allProjects.find((p) => p.id === run.project_id),
    rubric: allRubrics.find((r) => r.id === run.rubric_id),
  }));

  const sorted = [...runsWithData].sort(
    (a, b) =>
      new Date(b.run.started_at).getTime() - new Date(a.run.started_at).getTime(),
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileText size={20} className="text-brand" /> Reports
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          One exportable report per completed run. Template: 13-section evaluation
          report format from the wiki.
        </p>
      </header>

      <div className="bg-bg-panel border border-border-subtle rounded-md px-4 py-3 text-xs text-text-muted">
        Reports are generated from run data. Click{" "}
        <span className="font-mono text-text-primary">Export .md</span> to
        download a markdown file for stakeholder distribution.
      </div>

      <div className="space-y-3">
        {sorted.map(({ run, project, rubric }) => {
          const passRate = run.cases_total > 0
            ? run.cases_passing / run.cases_total
            : 0;
          return (
            <Card key={run.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-text-primary">
                      {project?.name ?? run.project_id}
                    </span>
                    <span
                      className={`text-xs font-medium ${verdictTone[run.verdict] ?? ""}`}
                    >
                      {verdictLabel[run.verdict] ?? run.verdict}
                    </span>
                    {run.regression_flag && (
                      <Pill tone="bad">regression</Pill>
                    )}
                    {run.safety_findings > 0 && (
                      <span className="flex items-center gap-1 text-xs text-bad">
                        <ShieldAlert size={11} />
                        {run.safety_findings} safety
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-text-muted">
                    <span>
                      <span className="text-text-secondary font-mono">
                        {run.id}
                      </span>
                    </span>
                    <span>{fmtDate(run.started_at)}</span>
                    <span>model: {run.model}</span>
                    <span>rubric: {rubric?.id ?? run.rubric_id}</span>
                    <span>changed: {run.variable_changed}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-xl font-semibold text-${scoreTone(run.overall_score)}`}
                    >
                      {pct(run.overall_score)}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {run.cases_passing}/{run.cases_total} passing
                    </div>
                  </div>

                  <Link
                    href={`/reports/${run.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-hover rounded text-sm font-medium text-white transition-colors"
                  >
                    <Download size={13} />
                    Export .md
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
