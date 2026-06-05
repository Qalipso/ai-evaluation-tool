import type { DeterministicResult } from "@/lib/evaluators/types";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export function CheckSummaryCards({ result }: { result: DeterministicResult }) {
  return (
    <div className="space-y-2">
      <div
        className={`rounded-xl border p-4 flex items-center gap-3 ${
          result.blocking
            ? "border-bad/30 bg-bad/5"
            : result.overallPass
              ? "border-ok/30 bg-ok/5"
              : "border-warn/30 bg-warn/5"
        }`}
      >
        {result.blocking ? (
          <ShieldAlert size={20} className="text-bad" />
        ) : result.overallPass ? (
          <CheckCircle2 size={20} className="text-ok" />
        ) : (
          <XCircle size={20} className="text-warn" />
        )}
        <div>
          <div className="text-sm font-semibold">
            {result.blocking ? "Blocking failure" : result.overallPass ? "All checks passed" : "Non-blocking failures"}
          </div>
          <div className="text-[11px] text-text-muted">
            {result.summary.passed}/{result.summary.total} passed · {result.summary.blocking} blocking
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Mini label="Total" value={result.summary.total} />
        <Mini label="Failed" value={result.summary.failed} tone={result.summary.failed > 0 ? "text-bad" : "text-ok"} />
        <Mini label="Blocking" value={result.summary.blocking} tone={result.summary.blocking > 0 ? "text-bad" : "text-ok"} />
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${tone}`}>{value}</div>
    </div>
  );
}
