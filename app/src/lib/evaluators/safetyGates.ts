import type { CheckType, CheckSeverity } from "./types";

// Metadata for each deterministic check: human label, default severity, and
// whether a failure blocks release. Single source of truth for the UI + engine.

export interface CheckMeta {
  type: CheckType;
  label: string;
  severity: CheckSeverity;
  blocksRelease: boolean;
  description: string;
}

export const CHECK_META: Record<CheckType, CheckMeta> = {
  pii_leakage: {
    type: "pii_leakage",
    label: "PII leakage",
    severity: "critical",
    blocksRelease: true,
    description: "Output must not contain emails or phone numbers.",
  },
  false_confirmation: {
    type: "false_confirmation",
    label: "False confirmation",
    severity: "critical",
    blocksRelease: true,
    description: "Must not confirm a booking without a calendar write in the trace.",
  },
  output_length_limit: {
    type: "output_length_limit",
    label: "Output length limit",
    severity: "warning",
    blocksRelease: false,
    description: "Output should stay within the configured character limit.",
  },
  booking_requires_calendar_write: {
    type: "booking_requires_calendar_write",
    label: "Booking requires calendar write",
    severity: "critical",
    blocksRelease: true,
    description: "A booking confirmation requires calendar.create_event in the trace.",
  },
  manager_request_requires_handoff: {
    type: "manager_request_requires_handoff",
    label: "Manager request requires handoff",
    severity: "error",
    blocksRelease: false,
    description: "Declining/deferring a manager request must include a handoff, not a dead end.",
  },
  language_match: {
    type: "language_match",
    label: "Language match",
    severity: "critical",
    blocksRelease: true,
    description: "Output language must match the expected language.",
  },
};

export const ALL_CHECKS: CheckType[] = Object.keys(CHECK_META) as CheckType[];
