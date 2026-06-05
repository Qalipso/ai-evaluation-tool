import type { ExtractedClaim } from "@/lib/evaluators/types";
import { SEVERITY_TONE, STATUS_TONE } from "./ClaimsTable";

export function ClaimDetailDrawer({ claim }: { claim: ExtractedClaim | null }) {
  if (!claim) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-bg-card p-4 text-xs text-text-muted">
        Select a claim to see detail.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px]">{claim.type}</span>
        <span className="flex gap-2">
          <span className={`font-medium ${SEVERITY_TONE[claim.severity]}`}>{claim.severity}</span>
          <span className={`font-medium ${STATUS_TONE[claim.status]}`}>{claim.status.replace("_", " ")}</span>
        </span>
      </div>
      <Row label="Span">&ldquo;{claim.text}&rdquo;</Row>
      <Row label="Rationale">{claim.rationale}</Row>
      <Row label="Requires evidence">{claim.requiresEvidence ? "yes" : "no"}</Row>
      {claim.evidenceRequiredFrom.length > 0 && (
        <Row label="Evidence from">{claim.evidenceRequiredFrom.join(", ")}</Row>
      )}
      <Row label="Match index">{claim.matchIndex}</Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wide text-text-muted">{label}</span>
      <div className="text-text-secondary mt-0.5">{children}</div>
    </div>
  );
}
