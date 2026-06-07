import type {
  ClaimPipelineInput,
  ClaimStatus,
  ClaimType,
  CheckType,
  DeterministicInput,
} from "../evaluators/types";

// A reusable, runnable evaluation scenario. Each scenario is wired to a real
// engine (deterministic checks or claim pipeline) plus the outcome the engine
// must produce. The library doubles as documentation and as a test corpus —
// every scenario is asserted in tests/unit/scenarios.test.ts, so the dataset
// can never drift away from the engine's actual behavior.

export type ScenarioCategory = "hallucination" | "safety" | "format";

// What a claim-pipeline scenario must produce: a claim of `type` ending in
// `status`. Verifies hallucination/grounding behavior.
export interface ClaimExpectation {
  type: ClaimType;
  status: ClaimStatus;
}

export interface ClaimScenario {
  id: string;
  kind: "claim";
  category: ScenarioCategory;
  title: string;
  description: string;
  input: ClaimPipelineInput;
  // Each entry must be present in the pipeline output.
  expectClaims: ClaimExpectation[];
  // Total contradicted+unsupported claims expected (grounding failures).
  expectFailingClaims: number;
}

export interface DeterministicScenario {
  id: string;
  kind: "deterministic";
  category: ScenarioCategory;
  title: string;
  description: string;
  input: DeterministicInput;
  // Engine-level expectations.
  expectOverallPass: boolean;
  expectBlocking: boolean;
  // Check types that must FAIL in this scenario (empty = none fail).
  expectFailingChecks: CheckType[];
}

export type Scenario = ClaimScenario | DeterministicScenario;
