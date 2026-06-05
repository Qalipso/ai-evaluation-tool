import type { DeterministicCheck } from "@/lib/evaluators/types";
import { CHECK_SEVERITY_TONE } from "./DeterministicCheckList";

export function CheckDetailDrawer({ check }: { check: DeterministicCheck | null }) {
  if (!check) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-bg-card p-4 text-xs text-text-muted">
        Select a check to see detail.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">{check.label}</span>
        <span className={`text-[10px] uppercase font-medium ${CHECK_SEVERITY_TONE[check.severity]}`}>
          {check.passed ? "pass" : "fail"} · {check.severity}
        </span>
      </div>
      <Row label="Type">{check.type}</Row>
      <Row label="Reason">{check.reason}</Row>
      {check.expected !== undefined && <Row label="Expected">{check.expected}</Row>}
      {check.actual !== undefined && <Row label="Actual">{check.actual}</Row>}
      <Row label="Blocks release">{check.blocksRelease ? "yes" : "no"}</Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wide text-text-muted">{label}</span>
      <div className="text-text-secondary mt-0.5 font-mono">{children}</div>
    </div>
  );
}
