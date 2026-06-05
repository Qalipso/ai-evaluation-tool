import type { ClaimSummary } from "@/lib/evaluators/types";

export function ClaimSummaryCards({ summary }: { summary: ClaimSummary }) {
  const cards = [
    { label: "Claims", value: summary.total, tone: "" },
    { label: "Critical", value: summary.bySeverity.critical, tone: summary.bySeverity.critical > 0 ? "text-bad" : "text-ok" },
    { label: "Contradicted", value: summary.byStatus.contradicted, tone: summary.byStatus.contradicted > 0 ? "text-bad" : "text-ok" },
    { label: "Unsupported", value: summary.byStatus.unsupported, tone: summary.byStatus.unsupported > 0 ? "text-warn" : "text-ok" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border-subtle bg-bg-card p-3">
          <div className="text-[10px] uppercase tracking-wide text-text-muted">{c.label}</div>
          <div className={`text-xl font-semibold mt-0.5 ${c.tone}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
