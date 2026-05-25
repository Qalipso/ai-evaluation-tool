import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import {
  getProject,
  allModels,
  allRubrics,
  getProjectRuns,
  getProjectCases,
  calculateProjectCoverage,
  calculateRecentQuality,
  calculateReviewStatus,
  calculateSafetyState,
  getActiveRubricSummary,
  fmtDate,
  pct,
  verdictTone,
  verdictLabel,
  type Project,
  type ProjectCoverage,
  type RecentQuality,
  type ReviewStatus,
  type SafetyState,
  type RubricSummary,
} from "@/lib/data";
import { EditProjectForm } from "./EditProjectForm";
import { DeleteProjectButton } from "./DeleteProjectButton";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const project = getProject(id);
  if (!project) notFound();

  const isEditing = edit === "1";

  const projectRuns = getProjectRuns(id);
  const projectCases = getProjectCases(id);
  const coverage = calculateProjectCoverage(projectCases, projectRuns);
  const quality = calculateRecentQuality(projectRuns);
  const reviewStatus = calculateReviewStatus(projectCases);
  const safetyState = calculateSafetyState(projectCases);
  const rubricSummary = getActiveRubricSummary(project);

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <header className="flex items-start gap-4 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
            <Link href="/projects" className="hover:text-brand transition-colors">Projects</Link>
            <span>/</span>
            <span className="truncate">{project.name}</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <StatusBadge status={project.status ?? "active"} />
          </div>
          {project.description && (
            <p className="text-text-secondary text-sm mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 items-start pt-0.5">
          <button
            disabled
            title="Coming soon"
            className="px-3 py-1.5 text-xs border border-border-subtle rounded-md text-text-muted cursor-not-allowed opacity-60"
          >
            Run evaluation
          </button>
          <Link
            href="/reports"
            className="px-3 py-1.5 text-xs border border-border-subtle rounded-md hover:bg-bg-hover transition-colors text-text-secondary"
          >
            Open reports
          </Link>
          {!isEditing && (
            <Link
              href={`/projects/${id}?edit=1`}
              className="px-3 py-1.5 text-xs border border-border-subtle rounded-md hover:bg-bg-hover transition-colors"
            >
              Edit settings
            </Link>
          )}
          <DeleteProjectButton id={id} name={project.name} />
        </div>
      </header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Settings */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <EditProjectForm project={project} models={allModels} rubrics={allRubrics} />
          ) : (
            <ProjectSettingsView project={project} projectId={id} rubricSummary={rubricSummary} />
          )}
        </div>

        {/* Right: Intelligence */}
        <div className="space-y-3">
          <div className="pb-0.5">
            <h2 className="text-sm font-semibold">Project Intelligence</h2>
            <p className="text-[11px] text-text-muted mt-0.5">
              Computed from stored runs, cases, rubrics, and safety findings.
            </p>
          </div>

          <IntelCard
            title="Evaluation Coverage"
            empty={projectCases.length === 0}
            emptyMsg="No evaluation cases yet. Add cases to measure this project's behavior."
          >
            <MetricRow label="Total cases" value={coverage.total} />
            <MetricRow label="Passing" value={coverage.passing} tone={coverage.passing > 0 ? "ok" : undefined} />
            <MetricRow label="Failing" value={coverage.failing} tone={coverage.failing > 0 ? "bad" : undefined} />
            <MetricRow label="Unscored" value={coverage.unscored} />
            <MetricRow label="Regression cases" value={coverage.regressionCases} tone={coverage.regressionCases > 0 ? "bad" : undefined} />
            <MetricRow label="Safety cases" value={coverage.safetyCases} tone={coverage.safetyCases > 0 ? "bad" : undefined} />
          </IntelCard>

          <IntelCard
            title="Recent Quality"
            empty={projectRuns.length === 0}
            emptyMsg="No runs yet. Run the first evaluation to establish a baseline."
          >
            <MetricRow label="Total runs" value={quality.totalRuns} />
            <MetricRow label="Last run score" value={quality.lastScore !== null ? quality.lastScore.toFixed(2) : "—"} mono />
            <MetricRow label="Previous score" value={quality.prevScore !== null ? quality.prevScore.toFixed(2) : "—"} mono />
            <MetricRow
              label="Score delta"
              value={
                quality.delta !== null
                  ? quality.delta >= 0
                    ? `+${quality.delta.toFixed(2)}`
                    : quality.delta.toFixed(2)
                  : "—"
              }
              tone={quality.delta !== null ? (quality.delta >= 0 ? "ok" : "bad") : undefined}
              mono
            />
            <MetricRow
              label="Regression status"
              value={quality.hasRegression ? "Flagged" : "Clean"}
              tone={quality.hasRegression ? "bad" : "ok"}
            />
          </IntelCard>

          <IntelCard
            title="Human Review"
            empty={projectCases.length === 0}
            emptyMsg="No cases to review."
          >
            <MetricRow label="Open items" value={reviewStatus.open} tone={reviewStatus.open > 0 ? "bad" : undefined} />
            <MetricRow label="P0 safety" value={reviewStatus.p0Safety} tone={reviewStatus.p0Safety > 0 ? "bad" : undefined} />
            <MetricRow label="P1 low-confidence" value={reviewStatus.p1LowConf} tone={reviewStatus.p1LowConf > 0 ? "warn" : undefined} />
            <MetricRow label="Reviewed cases" value={reviewStatus.reviewed} />
          </IntelCard>

          <IntelCard
            title="Safety State"
            empty={projectCases.length === 0}
            emptyMsg="No safety data available."
          >
            <MetricRow label="Open blockers" value={safetyState.openBlockers} tone={safetyState.openBlockers > 0 ? "bad" : undefined} />
            <MetricRow label="PII findings" value={safetyState.piiFindings} tone={safetyState.piiFindings > 0 ? "bad" : undefined} />
            <MetricRow label="False confirmations" value={safetyState.falseConfFindings} tone={safetyState.falseConfFindings > 0 ? "bad" : undefined} />
            <MetricRow label="Policy findings" value={safetyState.policyFindings} tone={safetyState.policyFindings > 0 ? "warn" : undefined} />
          </IntelCard>

          <IntelCard
            title="Active Rubric"
            empty={!rubricSummary}
            emptyMsg="No active rubric assigned."
          >
            {rubricSummary && (
              <>
                <MetricRow label="Name" value={rubricSummary.name} />
                <MetricRow label="Version" value={`v${rubricSummary.version}`} mono />
                <MetricRow label="Dimensions" value={rubricSummary.dimensionCount} />
                <MetricRow label="Weights normalized" value={rubricSummary.weightsNormalized ? "Yes" : "No"} tone={rubricSummary.weightsNormalized ? "ok" : "bad"} />
                <MetricRow label="Safety gate" value={rubricSummary.safetyGateEnabled ? "Enabled" : "Disabled"} tone={rubricSummary.safetyGateEnabled ? "ok" : undefined} />
                <MetricRow label="Min threshold" value={`≥ ${rubricSummary.minThreshold.toFixed(2)}`} mono />
              </>
            )}
          </IntelCard>
        </div>
      </div>

      {/* Runs history — full width, below grid */}
      {!isEditing && projectRuns.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Eval Run History</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border-subtle text-text-muted">
                  <tr className="text-left text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-2.5 font-medium">When</th>
                    <th className="px-4 py-2.5 font-medium">Variable</th>
                    <th className="px-4 py-2.5 font-medium text-right">Score</th>
                    <th className="px-4 py-2.5 font-medium text-right">Pass rate</th>
                    <th className="px-4 py-2.5 font-medium">Verdict</th>
                    <th className="px-4 py-2.5 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {projectRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-4 py-2.5 text-xs text-text-secondary whitespace-nowrap">
                        {fmtDate(run.started_at)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-text-secondary font-mono">
                        {run.variable_changed}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${verdictTone[run.verdict]}`}>
                        {run.overall_score.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs text-text-secondary">
                        {pct(run.cases_passing / run.cases_total)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs ${verdictTone[run.verdict]}`}>
                          {verdictLabel[run.verdict]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          {run.safety_findings > 0 && <Pill tone="bad">{run.safety_findings} safety</Pill>}
                          {run.regression_flag && <Pill tone="bad">regression</Pill>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Settings view (non-edit mode) ───────────────────────────────────────────

function ProjectSettingsView({
  project,
  projectId,
  rubricSummary,
}: {
  project: Project;
  projectId: string;
  rubricSummary: RubricSummary | null;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Project Settings</h2>
        <Link
          href={`/projects/${projectId}?edit=1`}
          className="text-xs text-brand hover:text-brand-hover transition-colors"
        >
          Edit settings →
        </Link>
      </div>

      <div className="space-y-4">
        <SettingsSection label="Identity">
          <SettingRow label="Name" value={project.name} />
          <SettingRow label="Description" value={project.description || "—"} muted={!project.description} />
          <SettingRow label="Owner" value={project.owner} />
          <SettingRow label="Status" value={<StatusBadge status={project.status ?? "active"} />} />
        </SettingsSection>

        <SettingsSection label="Evaluation Defaults">
          <SettingRow label="Default model" value={project.model} mono />
          <SettingRow
            label="Active rubric"
            value={
              rubricSummary ? (
                <Link href={`/rubrics/${rubricSummary.id}`} className="text-brand hover:underline font-mono text-xs">
                  {project.active_rubric}
                </Link>
              ) : project.active_rubric ? (
                <span className="font-mono text-xs text-text-muted">{project.active_rubric}</span>
              ) : (
                "—"
              )
            }
          />
          <SettingRow label="Judge model" value={project.judge_model || "—"} mono={!!project.judge_model} muted={!project.judge_model} />
        </SettingsSection>

        <SettingsSection label="Metadata">
          <SettingRow
            label="Tags"
            value={
              project.tags
                ? project.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                    <Pill key={t} tone="neutral">{t}</Pill>
                  ))
                : "—"
            }
            muted={!project.tags}
          />
          <SettingRow label="Notes" value={project.notes || "—"} muted={!project.notes} />
        </SettingsSection>
      </div>
    </Card>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-text-muted">{label}</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start py-1.5 gap-4 border-b border-border-subtle/50 last:border-0">
      <span className="text-[11px] text-text-muted w-28 shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs flex-1 flex flex-wrap gap-1 ${mono ? "font-mono" : ""} ${muted ? "text-text-muted italic" : "text-text-secondary"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Intelligence panel helpers ───────────────────────────────────────────────

function IntelCard({
  title,
  children,
  empty,
  emptyMsg,
}: {
  title: string;
  children?: React.ReactNode;
  empty?: boolean;
  emptyMsg?: string;
}) {
  return (
    <Card className="p-3.5">
      <h3 className="text-[10px] uppercase tracking-wide font-semibold text-text-muted mb-2">{title}</h3>
      {empty ? (
        <p className="text-[11px] text-text-muted italic leading-snug">{emptyMsg}</p>
      ) : (
        children
      )}
    </Card>
  );
}

function MetricRow({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string | number;
  tone?: "ok" | "bad" | "warn";
  mono?: boolean;
}) {
  const toneClass =
    tone === "ok" ? "text-ok" : tone === "bad" ? "text-bad" : tone === "warn" ? "text-warn" : "text-text-secondary";
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle/40 last:border-0">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className={`text-xs font-medium tabular-nums ${mono ? "font-mono" : ""} ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { tone: "ok" | "warn" | "neutral"; label: string }> = {
    active: { tone: "ok", label: "Active" },
    paused: { tone: "warn", label: "Paused" },
    archived: { tone: "neutral", label: "Archived" },
  };
  const { tone, label } = config[status] ?? { tone: "neutral", label: status };
  return <Pill tone={tone}>{label}</Pill>;
}
