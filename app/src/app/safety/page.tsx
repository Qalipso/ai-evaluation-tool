import { Card, Pill } from "@/components/ui";
import { fetchCases, fetchRuns, fetchProjects } from "@/lib/db";
import { ShieldAlert } from "lucide-react";

export default async function SafetyLogPage() {
  const [allCases, allRuns, allProjects] = await Promise.all([
    fetchCases(),
    fetchRuns(),
    fetchProjects(),
  ]);
  const findings = allCases.flatMap((c) =>
    c.safety_findings.map((f) => ({ ...f, case: c })),
  );
  return (
    <div className="max-w-5xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldAlert size={20} className="text-bad" /> Safety Log
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Findings cannot be score-averaged away. Open findings block resolution.
        </p>
      </header>
      {findings.length === 0 ? (
        <Card className="p-6 text-sm text-text-secondary">No safety findings.</Card>
      ) : (
        <div className="space-y-2">
          {findings.map((f, i) => {
            const run = allRuns.find((r) => r.id === f.case.run_id);
            const project = allProjects.find((p) => p.id === run?.project_id);
            return (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm font-medium">{f.category.replaceAll("_", " ")}</div>
                  <div className="flex gap-2">
                    <Pill tone="bad">{f.severity}</Pill>
                    <Pill>{f.status}</Pill>
                  </div>
                </div>
                <div className="text-xs text-text-secondary">{f.evidence}</div>
                <div className="text-[11px] text-text-muted mt-1.5">
                  {project?.name} · case {f.case.id} · run {f.case.run_id}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
