import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { verdictTone, verdictLabel } from "@/lib/data";
import { fetchProjects, fetchRuns } from "@/lib/db";

export default async function ProjectsPage() {
  const [allProjects, allRuns] = await Promise.all([fetchProjects(), fetchRuns()]);
  return (
    <div className="space-y-5 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-text-secondary text-sm mt-1">
            Each project pairs a rubric, a dataset, and an under-test model.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-3.5 py-2 bg-brand hover:bg-brand-hover rounded-md text-sm font-medium transition-colors"
        >
          New project
        </Link>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {allProjects.map((p) => {
          const runs = allRuns.filter((r) => r.project_id === p.id);
          const last = runs[0];
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="block group">
              <Card className="p-4 group-hover:border-brand/40 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold group-hover:text-brand transition-colors">
                    {p.name}
                  </h3>
                  <Pill tone="brand">{p.owner}</Pill>
                </div>
                <p className="text-xs text-text-secondary mt-1">{p.description}</p>
                <div className="grid grid-cols-3 mt-4 text-xs gap-2">
                  <Stat label="Model" value={p.model} mono />
                  <Stat label="Rubric" value={p.active_rubric} mono />
                  <Stat label="Cases" value={p.cases_total} />
                </div>
                {last ? (
                  <div className="mt-3 pt-3 border-t border-border-subtle text-xs flex items-center justify-between">
                    <div>
                      <span className="text-text-muted">Last run · </span>
                      <span className="font-mono">{last.overall_score.toFixed(2)}</span>
                      <span className="text-text-muted"> · {last.cases_passing}/{last.cases_total} passing</span>
                    </div>
                    <span className={`text-xs ${verdictTone[last.verdict]}`}>
                      {verdictLabel[last.verdict]}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-text-muted">
                    No runs yet
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
      {allProjects.length === 0 && (
        <div className="text-sm text-text-secondary text-center py-12">
          No projects. <Link href="/projects/new" className="text-brand hover:underline">Create one</Link> to get started.
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase text-text-muted">{label}</div>
      <div className={mono ? "font-mono text-text-primary" : "text-text-primary"}>
        {value}
      </div>
    </div>
  );
}
