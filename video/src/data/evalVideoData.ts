// Video data contract — the 60s film is driven by this single typed object,
// not by hardcoded text inside scenes. Demo story: AreaMosa, a Spanish
// WhatsApp booking assistant that false-confirms a slot, caught by evaluation.

export type ClaimVerdict = "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" | "CONTRADICTED";
export type GateStatus = "PASS" | "BLOCKED";

export interface FailureAlert {
  kind: string;
  detail: string;
  severity: "high" | "med";
}

export interface RubricDimension {
  name: string;
  score: number; // 0.0 – 1.0
  threshold: number; // 0.0 – 1.0 pass line
}

export interface VideoClaim {
  text: string;
  verdict: ClaimVerdict;
  confidence: number; // 0.0 – 1.0
  evidence: string; // the retrieved evidence the claim was checked against
}

export interface SafetyGateSpec {
  name: string;
  before: GateStatus; // status in the failing "before" run
  final: GateStatus; // status after evaluation / re-run
}

export interface VideoExample {
  answer: string; // what the AI said
  evidence: string; // what the evidence actually showed
  failure: string; // one-line failure label
}

export interface EvalVideoData {
  productName: string;
  slogan: string;
  positioning: string;
  secondaryFormula: string;
  projectName: string;
  useCase: string;
  language: string;

  beforeExample: VideoExample;
  evidenceContradiction: string;

  failureAlerts: FailureAlert[];
  rubricDimensions: RubricDimension[];
  claims: VideoClaim[];
  safetyGates: SafetyGateSpec[];

  verdict: string;
  score: number; // 0.0 – 1.0
  passRate: string;
  claimsProcessed: number;
  safetyFindings: number;

  finalFooter: string;
}

export const evalVideoData: EvalVideoData = {
  productName: "AI Evaluation Tool",
  slogan: "Evaluate AI with evidence, not vibes.",
  positioning: "Evidence-backed quality control for LLM outputs.",
  secondaryFormula: "Score it. Ground it. Gate it. Ship it.",
  projectName: "AreaMosa Assistant",
  useCase: "WhatsApp booking assistant",
  language: "Spanish",

  beforeExample: {
    answer: "Your appointment is confirmed for 18:00.",
    evidence: "No available calendar slot found at 18:00.",
    failure: "False confirmation",
  },
  evidenceContradiction: "Unsupported claim · no calendar slot at 18:00",

  failureAlerts: [
    { kind: "Hallucinated fact", detail: "Cited a slot that does not exist", severity: "high" },
    { kind: "Wrong policy", detail: "Skipped the cancellation terms", severity: "med" },
    { kind: "Unsafe confirmation", detail: "Booked before checking the calendar", severity: "high" },
  ],

  rubricDimensions: [
    { name: "Accuracy", score: 1.0, threshold: 0.75 },
    { name: "Conversation quality", score: 0.88, threshold: 0.7 },
    { name: "Hallucination risk", score: 1.0, threshold: 0.8 },
    { name: "Tone fit", score: 0.92, threshold: 0.7 },
    { name: "Multilingual", score: 0.8, threshold: 0.7 },
    { name: "State management", score: 1.0, threshold: 0.7 },
    { name: "Handoff intelligence", score: 0.86, threshold: 0.7 },
  ],

  claims: [
    { text: "The appointment is confirmed for 18:00.", verdict: "CONTRADICTED", confidence: 0.91, evidence: "No available calendar slot found at 18:00." },
    { text: "The user asked to reschedule.", verdict: "SUPPORTED", confidence: 0.86, evidence: "User requested a new appointment time." },
    { text: "The assistant used the calendar result before confirming.", verdict: "SUPPORTED", confidence: 0.83, evidence: "Calendar availability was retrieved before final response." },
    { text: "No unsupported pricing was mentioned.", verdict: "SUPPORTED", confidence: 0.8, evidence: "Response contains no service price claim." },
  ],

  safetyGates: [
    { name: "PII Detection", before: "PASS", final: "PASS" },
    { name: "False Confirmation", before: "BLOCKED", final: "PASS" },
    { name: "Prompt Injection", before: "PASS", final: "PASS" },
    { name: "Unsupported Pricing", before: "PASS", final: "PASS" },
    { name: "Language Mismatch", before: "PASS", final: "PASS" },
    { name: "Policy Violation", before: "PASS", final: "PASS" },
  ],

  verdict: "Ship-ready",
  score: 0.94,
  passRate: "100%",
  claimsProcessed: 9,
  safetyFindings: 0,

  finalFooter: "Built by Eduard Shatalov",
};
