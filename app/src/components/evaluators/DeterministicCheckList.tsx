"use client";

import type { DeterministicCheck, CheckSeverity } from "@/lib/evaluators/types";
import { Check, X } from "lucide-react";

export const CHECK_SEVERITY_TONE: Record<CheckSeverity, string> = {
  info: "text-text-muted",
  warning: "text-warn",
  error: "text-bad",
  critical: "text-bad",
};

export function DeterministicCheckList({
  checks,
  selectedId,
  onSelect,
}: {
  checks: DeterministicCheck[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {checks.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors ${
            selectedId === c.id ? "border-brand/40 bg-brand/10" : "border-border-subtle bg-bg-card hover:bg-bg-hover"
          }`}
        >
          {c.passed ? (
            <Check size={15} className="text-ok shrink-0" />
          ) : (
            <X size={15} className="text-bad shrink-0" />
          )}
          <span className="flex-1 min-w-0">
            <span className="font-medium">{c.label}</span>
            <span className="block truncate text-text-muted">{c.reason}</span>
          </span>
          <span className={`text-[10px] uppercase font-medium ${CHECK_SEVERITY_TONE[c.severity]}`}>
            {c.severity}
            {c.blocksRelease && <span className="ml-1 text-bad">·blocks</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
