import Link from "next/link";
import {
  PlayCircle,
  AlertCircle,
  GitCompare,
  CheckCircle2,
  CircleAlert,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { Card, StatCard, Pill, Bar, scoreTone } from "@/components/ui";
import {
  computeDashboard,
  verdictLabel,
  verdictTone,
  fmtDate,
} from "@/lib/data";
import { fetchRuns, fetchCases, fetchRubrics, fetchProjects } from "@/lib/db";

export default async function DashboardPage() {
  const [allRuns, allCases, allRubrics, allProjects] = await Promise.all([
    fetchRuns(),
    fetchCases(),
    fetchRubrics(),
    fetchProjects(),
  ]);
  const dashboardData = computeDashboard(allRuns, allCases, allRubrics);
  const recent = allRuns.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-ok" />
        system online · mock provider · {dashboardData.recent_runs_30d} recent runs
      </div>

      <header>
        <h1 className="text-3xl font-semibold">AI Quality Control</h1>
        <p className="text-text-secondary mt-1">
          Score, ground, and ship AI outputs with evidence.
        </p>
      </header>

      <div className="flex gap-2 flex-wrap">
        <button className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand hover:bg-brand-hover rounded-md text-sm font-medium">
          <PlayCircle size={16} />
          Run evaluation
        </button>
        <Link
          href="/review"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-bg-card hover:bg-bg-hover border border-border-subtle rounded-md text-sm"
        >
          <AlertCircle size={16} />
          Open failed cases
        </Link>
        <Link
          href="/compare"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-bg-card hover:bg-bg-hover border border-border-subtle rounded-md text-sm"
        >
          <GitCompare size={16} />
          Compare versions
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Overall quality"
          value={`${dashboardData.overall_quality.toFixed(1)}%`}
          sub="weighted across evaluators"
          tone="warn"
        />
        <StatCard
          label="Active projects"
          value={dashboardData.active_projects}
          sub="under evaluation"
        />
        <StatCard
          label="Recent runs"
          value={dashboardData.recent_runs_30d}
          sub="last 30 days"
        />
        <StatCard
          label="Failed cases"
          value={dashboardData.failed_cases}
          sub="needs review"
          tone="bad"
        />
        <StatCard
          label="High-risk runs"
          value={dashboardData.high_risk_runs}
          sub={dashboardData.high_risk_runs === 0 ? "all clear" : "investigate"}
          tone={dashboardData.high_risk_runs === 0 ? "ok" : "bad"}
        />
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <h2 className="text-base font-semibold">Pipeline health</h2>
            <p className="text-xs text-text-muted">
              end-to-end stage status across recent runs
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {dashboardData.pipeline_health.map((stage, i) => {
            const tone = scoreTone(stage.score, 90);
            const Icon =
              tone === "ok" ? CheckCircle2 : tone === "warn" ? CircleAlert : XCircle;
            const iconColor =
              tone === "ok"
                ? "text-ok"
                : tone === "warn"
                  ? "text-warn"
                  : "text-bad";
            return (
              <div key={i} className="bg-bg-panel border border-border-subtle rounded-md p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-medium">{stage.stage}</div>
                  <Icon size={14} className={iconColor} />
                </div>
                <div className="text-xl font-semibold mt-1.5">{stage.score}</div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  {stage.label}
                </div>
                <div className="mt-2">
                  <Bar value={stage.score} max={100} tone={tone} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Quality breakdown</h2>
            <p className="text-xs text-text-muted">
              average score per evaluator · last {dashboardData.recent_runs_30d} runs
            </p>
          </div>
          <div className="space-y-3">
            {dashboardData.quality_breakdown.map((ev) => {
              const tone = scoreTone(ev.score, 0.75);
              return (
                <div key={ev.evaluator} className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span>{ev.evaluator}</span>
                    <span className="tabular-nums font-mono text-xs">
                      <span className="text-text-primary">{ev.score.toFixed(2)}</span>
                      <span className="text-text-muted">/1.0</span>
                    </span>
                  </div>
                  <Bar value={ev.score} tone={tone} />
                  <div className="text-[10px] text-text-muted">
                    {ev.cases} cases · pass {(ev.pass_rate * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Recent runs</h2>
              <p className="text-xs text-text-muted">latest five</p>
            </div>
            <Link
              href="/runs"
              className="text-xs text-brand hover:text-brand-hover inline-flex items-center gap-1"
            >
              All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border-subtle -mx-2">
            {recent.map((run) => {
              const project = allProjects.find((p) => p.id === run.project_id);
              return (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between px-2 py-2.5 hover:bg-bg-hover rounded-md"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{project?.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {fmtDate(run.started_at)} · {run.cases_total} cases ·{" "}
                      {run.variable_changed}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {run.safety_findings > 0 && (
                      <Pill tone="bad">{run.safety_findings} safety</Pill>
                    )}
                    {run.regression_flag && <Pill tone="bad">regression</Pill>}
                    <span
                      className={`text-sm tabular-nums font-mono ${verdictTone[run.verdict]}`}
                    >
                      {run.overall_score.toFixed(1)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
