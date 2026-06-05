import Link from "next/link";
import { Card, Pill, Bar, scoreTone } from "@/components/ui";
import { verdictLabel, verdictTone, fmtDate, type Run } from "@/lib/data";
import { fetchRuns, fetchProjects } from "@/lib/db";
import { GitCompare, TrendingDown, TrendingUp, Minus } from "lucide-react";

function groupByProject(runs: Run[]): Map<string, Run[]> {
  const map = new Map<string, Run[]>();
  for (const r of runs) {
    const arr = map.get(r.project_id) ?? [];
    arr.push(r);
    map.set(r.project_id, arr);
  }
  return map;
}

export default async function ComparePage() {
  const [allRuns, allProjects] = await Promise.all([fetchRuns(), fetchProjects()]);
  const byProject = groupByProject(allRuns);
  const pairs: { project_id: string; current: Run; baseline: Run }[] = [];

  for (const [project_id, runs] of byProject) {
    if (runs.length < 2) continue;
    const sorted = [...runs].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
    );
    pairs.push({ project_id, current: sorted[0], baseline: sorted[1] });
  }

  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <GitCompare size={20} className="text-brand" /> Regression
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Same dataset · one variable changed. Each row is current vs previous run.
        </p>
      </header>

      <div className="bg-bg-panel border border-border-subtle rounded-md px-4 py-3 text-xs text-text-muted">
        Rule: a regression is flagged when the overall score drops by &gt;3 points on the same
        dataset + rubric pair, or any safety gate changes from pass to fail.
        Cross-rubric comparisons are marked separately — deltas may not be valid.
      </div>

      <div className="space-y-4">
        {pairs.map(({ project_id, current, baseline }) => {
          const project = allProjects.find((p) => p.id === project_id);
          const delta = current.overall_score - baseline.overall_score;
          const deltaAbs = Math.abs(delta);
          // Scores are on a 0..1 scale; "3 points" = 0.03.
          const REGRESSION_THRESHOLD = 0.03;
          const sameRubric = current.rubric_id === baseline.rubric_id;
          const isRegression = sameRubric && (current.regression_flag || delta < -REGRESSION_THRESHOLD);
          const deltaColor = !sameRubric ? "text-warn" : delta >= 0 ? "text-ok" : deltaAbs > REGRESSION_THRESHOLD ? "text-bad" : "text-warn";
          const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

          return (
            <Card key={project_id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold">{project?.name ?? project_id}</h2>
                  <p className="text-xs text-text-muted mt-0.5">{project?.description}</p>
                </div>
                <div className="flex gap-2">
                  {!sameRubric && <Pill tone="warn">rubric changed</Pill>}
                  {sameRubric && isRegression && <Pill tone="bad">regression</Pill>}
                  {sameRubric && !isRegression && <Pill tone="ok">stable</Pill>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <RunCol run={baseline} label="Baseline" />
                <div className="flex flex-col items-center justify-center gap-1">
                  <DeltaIcon size={20} className={deltaColor} />
                  <span className={`text-xl font-semibold font-mono ${deltaColor}`}>
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-text-muted uppercase">delta</span>
                </div>
                <RunCol run={current} label="Current" />
              </div>

              <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-text-muted">Baseline variable: </span>
                  <span className="font-mono">{baseline.variable_changed}</span>
                  {!sameRubric && (
                    <div className="text-warn mt-0.5 font-mono">{baseline.rubric_id}</div>
                  )}
                </div>
                <div>
                  <span className="text-text-muted">Current variable: </span>
                  <span className="font-mono">{current.variable_changed}</span>
                  {!sameRubric && (
                    <div className="text-warn mt-0.5 font-mono">{current.rubric_id}</div>
                  )}
                </div>
              </div>
              {!sameRubric && (
                <div className="mt-2 text-[11px] text-warn bg-warn/5 border border-warn/20 rounded px-3 py-2">
                  Rubric version changed — delta may not be a valid regression signal.
                </div>
              )}

              <div className="mt-3 flex gap-2 text-xs">
                <Link
                  href={`/runs/${current.id}`}
                  className="text-brand hover:underline"
                >
                  View current run →
                </Link>
                <span className="text-text-muted">·</span>
                <Link
                  href={`/runs/${baseline.id}`}
                  className="text-text-secondary hover:text-text-primary hover:underline"
                >
                  View baseline →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {pairs.length === 0 && (
        <Card className="p-6 text-sm text-text-secondary">
          No project has two or more runs. Run an evaluation to compare.
        </Card>
      )}
    </div>
  );
}

function RunCol({ run, label }: { run: Run; label: string }) {
  const tone = scoreTone(run.overall_score);
  const barTone = tone;
  return (
    <div className="bg-bg-panel border border-border-subtle rounded-md p-3 space-y-2">
      <div className="text-[10px] uppercase text-text-muted">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-2xl font-semibold font-mono ${
            tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"
          }`}
        >
          {run.overall_score.toFixed(2)}
        </span>
        <span className="text-text-muted text-xs">/1.0</span>
      </div>
      <Bar value={run.overall_score} tone={barTone} />
      <div className={`text-xs ${verdictTone[run.verdict]}`}>
        {verdictLabel[run.verdict]}
      </div>
      <div className="text-[10px] text-text-muted">
        {run.cases_passing}/{run.cases_total} passing · {fmtDate(run.started_at)}
      </div>
      {run.safety_findings > 0 && (
        <div className="text-[10px] text-bad">{run.safety_findings} safety finding(s)</div>
      )}
    </div>
  );
}
