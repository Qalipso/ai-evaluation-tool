"use client";

import type { EvidenceSource } from "@/lib/evaluators/types";
import { ALL_EVIDENCE_SOURCES } from "@/lib/evaluators/types";

const LABELS: Record<EvidenceSource, string> = {
  tool_trace: "Tool trace",
  context: "Context",
  business_config: "Business config",
  user_confirmation: "User confirmation",
};

export function EvidenceSourceSelector({
  value,
  onChange,
}: {
  value: EvidenceSource[];
  onChange: (v: EvidenceSource[]) => void;
}) {
  function toggle(s: EvidenceSource) {
    onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_EVIDENCE_SOURCES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => toggle(s)}
          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
            value.includes(s)
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-border-subtle bg-bg-card text-text-muted hover:text-text-secondary"
          }`}
        >
          {LABELS[s]}
        </button>
      ))}
    </div>
  );
}
