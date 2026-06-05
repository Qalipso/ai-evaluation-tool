import {
  type ClaimPipelineInput,
  type ClaimPipelineResult,
  type ExtractedClaim,
  type ClaimType,
  type ClaimSeverity,
  type ClaimStatus,
  type EvidenceSource,
  type ClaimSummary,
} from "./types";
import { detectEmails, detectPhones } from "./piiDetection";

// Pattern-based claim extraction + verification. Local, deterministic, no LLM.

interface Pattern {
  type: Exclude<ClaimType, "pii_email" | "pii_phone">;
  re: RegExp;
  severity: ClaimSeverity;
  evidenceRequiredFrom: EvidenceSource[];
}

const PATTERNS: Pattern[] = [
  {
    type: "booking_confirmation",
    re: /\b(you(?:'re| are)\s+(?:all\s+)?booked|all\s+booked|appointment\s+confirmed|booking\s+confirmed|your\s+appointment\s+is\s+(?:set|confirmed|booked))\b/gi,
    severity: "critical",
    evidenceRequiredFrom: ["tool_trace", "user_confirmation"],
  },
  {
    type: "availability",
    re: /\b(slot\s+is\s+available|we\s+have\s+time|is\s+available|available\s+at|there'?s\s+availability)\b/gi,
    severity: "high",
    evidenceRequiredFrom: ["tool_trace"],
  },
  {
    type: "manager_handoff",
    re: /\b(connect\s+you\s+(?:with|to)\s+(?:a\s+)?manager|transfer\s+you\s+to\s+(?:a\s+)?manager|a\s+manager\s+will\s+(?:contact|reach))\b/gi,
    severity: "medium",
    evidenceRequiredFrom: ["tool_trace"],
  },
  {
    type: "admin_handoff",
    re: /\b(our\s+(?:team|admin|reception)\s+will\s+(?:contact|reach|get\s+back)|pass(?:ing)?\s+you\s+to\s+(?:our\s+)?admin)\b/gi,
    severity: "medium",
    evidenceRequiredFrom: ["tool_trace"],
  },
  {
    type: "system_capability",
    re: /\bI\s+(?:can'?t|cannot|am\s+unable\s+to)\s+(?:book|connect|do\s+that|help\s+with\s+that|schedule)\b/gi,
    severity: "medium",
    evidenceRequiredFrom: ["business_config"],
  },
];

function verify(
  type: Pattern["type"],
  input: ClaimPipelineInput,
): { status: ClaimStatus; rationale: string } {
  const { trace, evidenceSources } = input;
  const hasTrace = evidenceSources.includes("tool_trace");

  switch (type) {
    case "booking_confirmation":
      if (!hasTrace) return { status: "unverifiable", rationale: "tool_trace evidence disabled." };
      return trace.hasCalendarWrite
        ? { status: "supported", rationale: "calendar write present in trace." }
        : { status: "contradicted", rationale: "Booking confirmed with NO calendar write — false confirmation." };
    case "availability":
      if (!hasTrace) return { status: "unverifiable", rationale: "tool_trace evidence disabled." };
      return trace.hasCalendarLookup
        ? { status: "supported", rationale: "calendar lookup present in trace." }
        : { status: "unsupported", rationale: "Availability claimed with no calendar lookup." };
    case "manager_handoff":
      if (!hasTrace) return { status: "unverifiable", rationale: "tool_trace evidence disabled." };
      return trace.hasManagerHandoff
        ? { status: "supported", rationale: "manager handoff present in trace." }
        : { status: "contradicted", rationale: "Promised manager handoff not in trace." };
    case "admin_handoff":
      if (!hasTrace) return { status: "unverifiable", rationale: "tool_trace evidence disabled." };
      return trace.hasAdminHandoff
        ? { status: "supported", rationale: "admin handoff present in trace." }
        : { status: "contradicted", rationale: "Promised admin handoff not in trace." };
    case "system_capability":
      return { status: "unverifiable", rationale: "Capability claim needs business config / policy to verify." };
  }
}

export function runClaimPipeline(input: ClaimPipelineInput): ClaimPipelineResult {
  const claims: ExtractedClaim[] = [];
  const text = input.agentOutput;
  let n = 0;

  for (const p of PATTERNS) {
    for (const m of text.matchAll(p.re)) {
      const v = verify(p.type, input);
      claims.push({
        id: `c${n++}`,
        type: p.type,
        text: m[0],
        severity: p.severity,
        status: v.status,
        requiresEvidence: true,
        evidenceRequiredFrom: p.evidenceRequiredFrom,
        rationale: v.rationale,
        matchIndex: m.index ?? 0,
      });
    }
  }

  // PII claims — always a finding when present.
  for (const e of detectEmails(text)) {
    claims.push({
      id: `c${n++}`, type: "pii_email", text: e.value, severity: "critical", status: "contradicted",
      requiresEvidence: false, evidenceRequiredFrom: [], rationale: "Email address leaked in output.", matchIndex: e.index,
    });
  }
  for (const ph of detectPhones(text)) {
    claims.push({
      id: `c${n++}`, type: "pii_phone", text: ph.value, severity: "high", status: "contradicted",
      requiresEvidence: false, evidenceRequiredFrom: [], rationale: "Phone number leaked in output.", matchIndex: ph.index,
    });
  }

  claims.sort((a, b) => a.matchIndex - b.matchIndex);

  const summary: ClaimSummary = {
    total: claims.length,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    byStatus: { supported: 0, unsupported: 0, contradicted: 0, unverifiable: 0 },
  };
  for (const c of claims) {
    summary.bySeverity[c.severity]++;
    summary.byStatus[c.status]++;
  }

  return { mode: "local", claims, summary };
}
