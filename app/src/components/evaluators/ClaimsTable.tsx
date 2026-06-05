"use client";

import type { ExtractedClaim, ClaimSeverity, ClaimStatus } from "@/lib/evaluators/types";

export const SEVERITY_TONE: Record<ClaimSeverity, string> = {
  low: "text-text-muted",
  medium: "text-warn",
  high: "text-bad",
  critical: "text-bad",
};

export const STATUS_TONE: Record<ClaimStatus, string> = {
  supported: "text-ok",
  unsupported: "text-warn",
  contradicted: "text-bad",
  unverifiable: "text-text-muted",
};

export function ClaimsTable({
  claims,
  selectedId,
  onSelect,
}: {
  claims: ExtractedClaim[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-bg-hover text-text-muted text-[10px] uppercase tracking-wide">
            <th className="text-left font-medium px-3 py-2">Type</th>
            <th className="text-left font-medium px-3 py-2">Span</th>
            <th className="text-left font-medium px-3 py-2">Severity</th>
            <th className="text-left font-medium px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`cursor-pointer border-t border-border-subtle transition-colors ${
                selectedId === c.id ? "bg-brand/10" : "hover:bg-bg-hover"
              }`}
            >
              <td className="px-3 py-2 font-mono text-[11px]">{c.type}</td>
              <td className="px-3 py-2 max-w-[14rem] truncate text-text-secondary">{c.text}</td>
              <td className={`px-3 py-2 font-medium ${SEVERITY_TONE[c.severity]}`}>{c.severity}</td>
              <td className={`px-3 py-2 font-medium ${STATUS_TONE[c.status]}`}>{c.status.replace("_", " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
