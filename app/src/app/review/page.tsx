import { Card, Pill } from "@/components/ui";
import { labelTone } from "@/lib/data";
import { fetchCases, fetchRuns, fetchProjects, fetchRubrics } from "@/lib/db";
import { Users, ShieldAlert, AlertTriangle, CheckCircle, UserCheck } from "lucide-react";
import Link from "next/link";

type ReviewItem =
  | { kind: "safety"; caseId: string; runId: string; projectId: string; category: string; severity: string; evidence: string; status: string }
  | { kind: "uncertain"; caseId: string; runId: string; projectId: string; claimText: string; label: string; confidence: number; evidence: string }
  | { kind: "human"; caseId: string; runId: string; projectId: string; rubricName: string; dims: string[] };

export default async function ReviewPage() {
  const [allCases, allRuns, allProjects, allRubrics] = await Promise.all([
    fetchCases(),
    fetchRuns(),
    fetchProjects(),
    fetchRubrics(),
  ]);
  const items: ReviewItem[] = [];

  for (const c of allCases) {
    const run = allRuns.find((r) => r.id === c.run_id);
    const projectId = run?.project_id ?? "";

    if (c.human_review === "pending") {
      const rubric = allRubrics.find((r) => r.id === run?.rubric_id);
      const scoredIds = new Set(c.scores.map((s) => s.dim_id));
      const dims = (rubric?.dimensions ?? [])
        .filter((d) => d.method === "human" && !scoredIds.has(d.id))
        .map((d) => d.name);
      if (dims.length > 0) {
        items.push({ kind: "human", caseId: c.id, runId: c.run_id, projectId, rubricName: rubric?.name ?? "—", dims });
      }
    }

    for (const f of c.safety_findings) {
      items.push({ kind: "safety", caseId: c.id, runId: c.run_id, projectId, ...f });
    }

    for (const claim of c.claims) {
      if (claim.confidence < 0.7) {
        items.push({
          kind: "uncertain",
          caseId: c.id,
          runId: c.run_id,
          projectId,
          claimText: claim.text,
          label: claim.label,
          confidence: claim.confidence,
          evidence: claim.evidence,
        });
      }
    }
  }

  const safety = items.filter((i) => i.kind === "safety");
  const human = items.filter((i) => i.kind === "human");
  const uncertain = items
    .filter((i) => i.kind === "uncertain")
    .sort((a, b) => (a as { confidence: number }).confidence - (b as { confidence: number }).confidence);

  const total = items.length;
  const openSafety = safety.filter(
    (i) => i.kind === "safety" && (i as { status: string }).status === "open",
  ).length;

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users size={20} className="text-brand" /> Human Review Queue
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Priority order: open safety findings → uncertain claims (confidence &lt; 0.70) → calibration.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Total items" value={total} />
        <Stat label="Open safety" value={openSafety} tone={openSafety > 0 ? "bad" : "ok"} />
        <Stat label="Pending human" value={human.length} tone={human.length > 0 ? "warn" : "ok"} />
        <Stat label="Uncertain claims" value={uncertain.length} tone={uncertain.length > 0 ? "warn" : "ok"} />
      </div>

      {human.length > 0 && (
        <section className="space-y-2">
          <SectionHeader icon={<UserCheck size={14} className="text-brand" />} label="Pending human scoring" count={human.length} priority="P1" />
          <p className="text-xs text-text-muted -mt-1">
            Dimensions with method <span className="font-mono">human</span> have no automated scorer. A reviewer must score these cases.
          </p>
          {human.map((item, i) => {
            if (item.kind !== "human") return null;
            const project = allProjects.find((p) => p.id === item.projectId);
            return (
              <Card key={`h${i}`} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {item.dims.map((d) => (
                        <Pill key={d} tone="brand">{d}</Pill>
                      ))}
                    </div>
                    <div className="text-[11px] text-text-muted mt-1.5">
                      {project?.name} · {item.rubricName} · case{" "}
                      <span className="font-mono">{item.caseId}</span>
                    </div>
                  </div>
                  <Link href={`/review/${item.caseId}`} className="btn-pill btn-primary px-3.5 py-1.5 text-xs shrink-0">
                    Review →
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {safety.length > 0 && (
        <section className="space-y-2">
          <SectionHeader icon={<ShieldAlert size={14} className="text-bad" />} label="Safety findings" count={safety.length} priority="P0" />
          {safety.map((item, i) => {
            if (item.kind !== "safety") return null;
            const project = allProjects.find((p) => p.id === item.projectId);
            return (
              <Card key={i} className="p-4 border-bad/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill tone="bad">{item.severity}</Pill>
                      <span className="text-sm font-medium">{item.category.replaceAll("_", " ")}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{item.evidence}</p>
                    <div className="text-[11px] text-text-muted mt-1.5">
                      {project?.name} · case{" "}
                      <Link href={`/runs/${item.runId}`} className="font-mono hover:text-brand">
                        {item.caseId}
                      </Link>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {uncertain.length > 0 && (
        <section className="space-y-2">
          <SectionHeader icon={<AlertTriangle size={14} className="text-warn" />} label="Uncertain claim labels" count={uncertain.length} priority="P1" />
          <p className="text-xs text-text-muted -mt-1">
            Claims where the automated label confidence fell below 0.70. Human review calibrates the judge.
          </p>
          {uncertain.map((item, i) => {
            if (item.kind !== "uncertain") return null;
            const project = allProjects.find((p) => p.id === item.projectId);
            const tone = labelTone[item.label] ?? "text-text-secondary";
            return (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-mono ${tone}`}>{item.label.replaceAll("_", " ")}</span>
                      <span className="text-[10px] text-text-muted">conf {item.confidence.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-text-primary">"{item.claimText}"</p>
                    <p className="text-xs text-text-muted mt-1">{item.evidence}</p>
                    <div className="text-[11px] text-text-muted mt-1.5">
                      {project?.name} · <Link href={`/runs/${item.runId}`} className="font-mono hover:text-brand">{item.caseId}</Link>
                    </div>
                  </div>
                  <ConfBar confidence={item.confidence} />
                </div>
              </Card>
            );
          })}
        </section>
      )}

      {total === 0 && (
        <Card className="p-6 text-sm text-text-secondary flex items-center gap-2">
          <CheckCircle size={16} className="text-ok" /> Queue empty. No safety findings or uncertain claims.
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-text-primary";
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase text-text-muted">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${color}`}>{value}</div>
    </Card>
  );
}

function SectionHeader({ icon, label, count, priority }: { icon: React.ReactNode; label: string; count: number; priority: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      {icon}
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] text-text-muted bg-bg-panel border border-border-subtle rounded px-1.5 py-0.5">{count}</span>
      <span className="text-[10px] text-brand bg-brand/10 border border-brand/20 rounded px-1.5 py-0.5 font-mono">{priority}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Pill tone={status === "open" ? "bad" : "ok"}>{status}</Pill>
  );
}

function ConfBar({ confidence }: { confidence: number }) {
  const pct = confidence * 100;
  const color = confidence >= 0.7 ? "bg-ok" : confidence >= 0.5 ? "bg-warn" : "bg-bad";
  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      <span className="text-xs font-mono text-text-muted">{confidence.toFixed(2)}</span>
      <div className="w-16 h-1.5 bg-bg-hover rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
