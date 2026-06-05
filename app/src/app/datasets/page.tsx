import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { fetchDatasets, fetchProjects } from "@/lib/db";
import { hasSupabase } from "@/lib/supabase";
import { Database, ChevronRight } from "lucide-react";

export default async function DatasetsPage() {
  const [datasets, projects] = await Promise.all([fetchDatasets(), fetchProjects()]);

  return (
    <div className="mx-auto w-full max-w-3xl py-6 space-y-5">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center justify-center gap-2">
          <Database size={22} className="text-brand" /> Datasets
        </h1>
        <p className="text-text-secondary text-sm mt-2 max-w-lg mx-auto leading-relaxed">
          Versioned test sets. Save the questions a rubric generates as a dataset, then
          re-run it across model and prompt versions for apples-to-apples regression.
        </p>
      </header>

      {!hasSupabase() && (
        <div className="rounded-xl bg-warn/10 border border-warn/25 px-4 py-3 text-sm text-warn text-center">
          Datasets need Supabase. Apply <code>0003_datasets.sql</code> and set the env.
        </div>
      )}

      {datasets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-text-secondary">
          No datasets yet. On{" "}
          <Link href="/runs/new" className="text-brand hover:underline">New run</Link>, generate
          questions then <span className="font-medium">Save as dataset</span>.
        </Card>
      ) : (
        <div className="space-y-2">
          {datasets.map((d) => {
            const project = projects.find((p) => p.id === d.project_id);
            return (
              <Link key={d.id} href={`/datasets/${d.id}`} className="block group">
                <Card className="p-4 group-hover:border-brand/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{d.name}</span>
                        <Pill tone="brand">v{d.version}</Pill>
                      </div>
                      <div className="text-[11px] text-text-muted mt-1">
                        {project?.name ?? d.project_id ?? "—"} · {d.case_count ?? 0} cases · {d.source}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
