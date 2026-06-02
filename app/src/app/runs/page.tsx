import Link from "next/link";
import { Card } from "@/components/ui";
import { fetchRuns, fetchProjects } from "@/lib/db";
import { RunsTable } from "./RunsTable";

export default async function RunsPage() {
  const [allRuns, allProjects] = await Promise.all([fetchRuns(), fetchProjects()]);
  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Eval Runs</h1>
          <p className="text-text-secondary text-sm mt-1">
            Stored evaluation runs. Each row is immutable; re-evaluation creates a new run.
          </p>
        </div>
        <Link
          href="/runs/new"
          className="px-3.5 py-2 bg-brand hover:bg-brand-hover rounded-md text-sm font-medium"
        >
          New run
        </Link>
      </header>

      <Card>
        <RunsTable runs={allRuns} projects={allProjects} />
      </Card>
    </div>
  );
}
