import { Card, Pill } from "@/components/ui";
import { allRubrics, allProjects, methodLabel } from "@/lib/data";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function RubricsPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rubrics</h1>
          <p className="text-text-secondary text-sm mt-1">
            Versioned scoring definitions per project. Weights normalize to 1.
            Safety is a gate, not a weight.
          </p>
        </div>
        <Link
          href="/rubrics/new"
          className="px-3.5 py-2 bg-brand hover:bg-brand-hover rounded-md text-sm font-medium transition-colors"
        >
          New rubric
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {allRubrics.map((r) => {
          const project = allProjects.find((p) => p.id === r.project_id);
          const weightSum = r.dimensions.reduce((s, d) => s + d.weight, 0);
          return (
            <Link key={r.id} href={`/rubrics/${r.id}`} className="block group">
              <Card className="p-5 group-hover:border-brand/40 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold group-hover:text-brand transition-colors">
                        {r.name}
                      </h3>
                      <Pill tone="brand">v{r.version}</Pill>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {project?.name} · owner {r.owner} · updated {r.updated}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-text-muted">Weight sum</div>
                    <div className="text-sm font-mono tabular-nums">{weightSum.toFixed(2)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
                  {r.dimensions.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between text-sm border-b border-border-subtle/60 py-1.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate">{d.name}</div>
                        <div className="text-[10px] text-text-muted">
                          {methodLabel[d.method] ?? d.method} · threshold ≥ {d.threshold.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-mono tabular-nums text-xs text-text-secondary shrink-0">
                        {d.weight.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase text-text-muted mr-1">Safety gates:</span>
                    {r.safety_gates.map((g) => (
                      <Pill key={g} tone="bad">{g.replaceAll("_", " ")}</Pill>
                    ))}
                  </div>
                  <span className="text-xs text-brand group-hover:text-brand-hover inline-flex items-center gap-1 transition-colors">
                    Details <ChevronRight size={12} />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {allRubrics.length === 0 && (
        <div className="text-sm text-text-secondary text-center py-12">
          No rubrics.{" "}
          <Link href="/rubrics/new" className="text-brand hover:underline">
            Create one
          </Link>{" "}
          to get started.
        </div>
      )}
    </div>
  );
}
