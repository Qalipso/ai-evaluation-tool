import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, Pill } from "@/components/ui";
import { fetchDataset, fetchProject } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { DeleteDatasetButton } from "./DeleteDatasetButton";

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ds = await fetchDataset(id);
  if (!ds) notFound();
  const project = ds.project_id ? await fetchProject(ds.project_id) : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl py-6 space-y-5">
      <Link href="/datasets" className="text-xs text-text-muted hover:text-brand transition-colors inline-flex items-center gap-1">
        <ChevronLeft size={12} /> All datasets
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            {ds.name} <Pill tone="brand">v{ds.version}</Pill>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {project?.name ?? ds.project_id ?? "—"} · {ds.cases.length} cases · {ds.source}
          </p>
          {ds.description && <p className="text-xs text-text-muted mt-1">{ds.description}</p>}
        </div>
        <DeleteDatasetButton id={ds.id} />
      </header>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border-subtle bg-bg-hover/40 text-[10px] uppercase tracking-wide text-text-muted">
          Cases ({ds.cases.length})
        </div>
        <ul className="divide-y divide-border-subtle">
          {ds.cases.map((c, i) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-mono text-text-muted mt-0.5 w-5 shrink-0">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{c.input || "—"}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{c.expected_behavior || "—"}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Pill>{c.difficulty}</Pill>
                    {c.expected_language && <Pill>{c.expected_language}</Pill>}
                    {c.is_critical && <Pill tone="bad">critical</Pill>}
                    {c.tags.map((t) => <Pill key={t}>{t}</Pill>)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
