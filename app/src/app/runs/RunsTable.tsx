"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Pill } from "@/components/ui";
import { fmtDate, verdictLabel, verdictTone } from "@/lib/data";
import { deleteRun } from "./actions";

type Run = {
  id: string;
  project_id: string;
  rubric_id: string;
  model: string;
  started_at: string;
  cases_total: number;
  cases_passing: number;
  overall_score: number;
  verdict: string;
  regression_flag: boolean;
  safety_findings: number;
  variable_changed: string;
};

type Project = { id: string; name: string };

export function RunsTable({
  runs: initialRuns,
  projects,
}: {
  runs: Run[];
  projects: Project[];
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!window.confirm("Delete this run? Associated cases will also be removed.")) return;
    setDeletingId(id);
    setRuns((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteRun(id);
      setDeletingId(null);
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-bg-panel border-b border-border-subtle text-text-muted">
          <tr className="text-left text-[10px] uppercase tracking-wider">
            <th className="px-4 py-2.5 font-medium">When</th>
            <th className="px-4 py-2.5 font-medium">Project</th>
            <th className="px-4 py-2.5 font-medium">Rubric</th>
            <th className="px-4 py-2.5 font-medium">Model</th>
            <th className="px-4 py-2.5 font-medium">Variable</th>
            <th className="px-4 py-2.5 font-medium text-right">Score</th>
            <th className="px-4 py-2.5 font-medium text-right">Pass</th>
            <th className="px-4 py-2.5 font-medium">Verdict</th>
            <th className="px-4 py-2.5 font-medium">Flags</th>
            <th className="px-4 py-2.5 font-medium w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {runs.map((run) => {
            const project = projects.find((p) => p.id === run.project_id);
            const passRate = run.cases_passing / run.cases_total;
            const isDeleting = deletingId === run.id;
            return (
              <tr
                key={run.id}
                className={`hover:bg-bg-hover transition-colors ${isDeleting ? "opacity-40" : ""}`}
              >
                <td className="px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">
                  {fmtDate(run.started_at)}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/runs/${run.id}`} className="hover:text-brand">
                    {project?.name ?? run.project_id}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-text-secondary text-xs">
                  {run.rubric_id}
                </td>
                <td className="px-4 py-2.5 text-text-secondary text-xs font-mono">
                  {run.model}
                </td>
                <td className="px-4 py-2.5 text-text-secondary text-xs">
                  {run.variable_changed}
                </td>
                <td
                  className={`px-4 py-2.5 text-right font-mono tabular-nums ${verdictTone[run.verdict]}`}
                >
                  {run.overall_score.toFixed(1)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs text-text-secondary">
                  {(passRate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs ${verdictTone[run.verdict]}`}>
                    {verdictLabel[run.verdict]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {run.safety_findings > 0 && (
                      <Pill tone="bad">{run.safety_findings} safety</Pill>
                    )}
                    {run.regression_flag && <Pill tone="bad">regression</Pill>}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => handleDelete(run.id)}
                    disabled={pending}
                    className="text-text-muted hover:text-bad transition-colors disabled:opacity-30"
                    title="Delete run"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {runs.length === 0 && (
        <div className="px-4 py-8 text-sm text-text-secondary text-center">
          No runs. Create one to get started.
        </div>
      )}
    </div>
  );
}
