// Local, pattern-based evaluator playground types. No LLM, no network — these
// run in code so the UI can prove the system is doing real checks.

export type EvaluatorMode = "local" | "llm" | "hybrid";

// ── Tool trace (lightweight, hand-editable JSON) ─────────────────────────────
export interface ToolTraceLite {
  hasCalendarLookup: boolean;
  hasCalendarWrite: boolean;
  hasManagerHandoff: boolean;
  hasAdminHandoff: boolean;
  hasKnowledgeBaseLookup: boolean;
}

export const EMPTY_TRACE: ToolTraceLite = {
  hasCalendarLookup: false,
  hasCalendarWrite: false,
  hasManagerHandoff: false,
  hasAdminHandoff: false,
  hasKnowledgeBaseLookup: false,
};

// ── Evidence sources the verifier is allowed to use ──────────────────────────
export type EvidenceSource = "tool_trace" | "context" | "business_config" | "user_confirmation";

export const ALL_EVIDENCE_SOURCES: EvidenceSource[] = [
  "tool_trace",
  "context",
  "business_config",
  "user_confirmation",
];

// ── Claims ───────────────────────────────────────────────────────────────────
export type ClaimType =
  | "booking_confirmation"
  | "availability"
  | "manager_handoff"
  | "admin_handoff"
  | "system_capability"
  | "pii_email"
  | "pii_phone";

export type ClaimStatus = "supported" | "unsupported" | "contradicted" | "unverifiable";
export type ClaimSeverity = "low" | "medium" | "high" | "critical";

export interface ExtractedClaim {
  id: string;
  type: ClaimType;
  text: string; // the matched span
  severity: ClaimSeverity;
  status: ClaimStatus;
  requiresEvidence: boolean;
  evidenceRequiredFrom: EvidenceSource[];
  rationale: string;
  matchIndex: number;
}

export interface ClaimPipelineInput {
  agentOutput: string;
  context: string[];
  trace: ToolTraceLite;
  evidenceSources: EvidenceSource[];
}

export interface ClaimSummary {
  total: number;
  bySeverity: Record<ClaimSeverity, number>;
  byStatus: Record<ClaimStatus, number>;
}

export interface ClaimPipelineResult {
  mode: EvaluatorMode;
  claims: ExtractedClaim[];
  summary: ClaimSummary;
}

// ── Deterministic checks ─────────────────────────────────────────────────────
export type CheckType =
  | "pii_leakage"
  | "false_confirmation"
  | "output_length_limit"
  | "booking_requires_calendar_write"
  | "manager_request_requires_handoff"
  | "language_match";

export type CheckSeverity = "info" | "warning" | "error" | "critical";

export interface DeterministicCheck {
  id: string;
  type: CheckType;
  label: string;
  passed: boolean;
  severity: CheckSeverity;
  blocksRelease: boolean;
  reason: string;
  expected?: string;
  actual?: string;
}

export type SupportedLanguage = "en" | "es" | "ru" | "unknown";

export interface DeterministicInput {
  agentOutput: string;
  expectedBehavior: string;
  expectedLanguage?: SupportedLanguage;
  trace: ToolTraceLite;
  enabledChecks: CheckType[];
  maxLength?: number;
}

export interface DeterministicResult {
  mode: EvaluatorMode;
  overallPass: boolean;
  blocking: boolean;
  checks: DeterministicCheck[];
  summary: { total: number; passed: number; failed: number; blocking: number };
}

// ── Demo examples ────────────────────────────────────────────────────────────
export interface DemoExample {
  id: string;
  title: string;
  description: string;
  agentOutput: string;
  expectedBehavior: string;
  expectedLanguage?: SupportedLanguage;
  context: string[];
  trace: ToolTraceLite;
}
