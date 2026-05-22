import { Card } from "@/components/ui";
import { allRuns, allProjects } from "@/lib/data";
import { RunsTable } from "./RunsTable";

export default function RunsPage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Eval Runs</h1>
          <p className="text-text-secondary text-sm mt-1">
            Stored evaluation runs. Each row is immutable; re-evaluation creates a new run.
          </p>
        </div>
        <button className="px-3.5 py-2 bg-brand hover:bg-brand-hover rounded-md text-sm font-medium">
          New run
        </button>
      </header>

      <Card>
        <RunsTable runs={allRuns} projects={allProjects} />
      </Card>
    </div>
  );
}
