# Acceptance Criteria — AI Evaluation Tool

This document defines the pass/fail bar for the artifact (documentation and the system it describes). Criteria are grouped so a reviewer can score each area independently.

The bar is binary per item: each criterion is either met or not. Partial-credit interpretations are explicitly rejected — that habit is what this tool exists to fight.

---

## 1. Documentation completeness

The artifact passes documentation review if **all** of the following hold.

- [ ] `README.md` exists, opens with a hook, positions the tool, draws an explicit boundary against PromptOps, lists target users, lists at least four concrete example use cases, and ends with a documentation map.
- [ ] `product-brief.md` covers: problem, target users, jobs to be done, MVP scope (in + out), non-goals, success metrics, core user flows, and key risks.
- [ ] `behavior-spec.md` defines what the system does, what it does not do, how scoring works, how hallucination detection works, how groundedness is evaluated, how task completion is evaluated, how safety is flagged, how reports are generated, edge cases, failure states, and a list of invariants.
- [ ] `architecture.md` describes all eight layers (input, rubric, scoring, hallucination/groundedness, safety, human review, report, storage), includes a Mermaid diagram showing the layers and the direction of data flow, and explains the design choices.
- [ ] `roadmap.md` splits into MVP, V1, V2, Future, and includes "what I will not do" items.
- [ ] `acceptance-criteria.md` (this file) exists and is referenced from `README.md`.
- [ ] `wiki/` contains all required pages: `evaluation-principles.md`, `hallucination-risk.md`, `groundedness.md`, `scoring-rubrics.md`, `regression-evaluation.md`, `llm-as-judge.md`, `human-review.md`, `evaluation-reports.md`.
- [ ] `diagrams/` contains: `evaluation-pipeline.md`, `scoring-flow.md`, `human-review-flow.md`, `regression-evaluation-flow.md`, each with a Mermaid diagram and a short explanation.
- [ ] No file is generic filler. Every page makes a claim that could be argued with.

## 2. Evaluation logic

The artifact passes logic review if all of the following hold.

- [ ] The tool distinguishes hallucination risk from groundedness and explains the distinction in `wiki/hallucination-risk.md` and `wiki/groundedness.md`.
- [ ] The tool uses three named scoring methods (deterministic, semantic similarity, LLM-as-judge) and explains when each is appropriate.
- [ ] A case is documented as passing only when every weighted dimension meets its threshold **and** no medium-or-higher safety finding is open. This rule is repeated in the behavior spec and the invariants list.
- [ ] LLM-judge outputs are required to carry a rationale; "just a score" is not acceptable judge output.
- [ ] Human overrides never destroy the original LLM-judge score; both are retained.
- [ ] A stored run is immutable. Re-evaluation creates a new run. This is stated as an invariant.
- [ ] An unscored dimension is reported as `unscored`, never coerced to `0`.
- [ ] Regression detection has a defined threshold (default: 5-point per-dimension drop or > 2% of cases regressing), and a regression cannot be silently masked by a higher overall mean.

## 3. Rubric quality

The artifact passes rubric review if all of the following hold.

- [ ] Ten reference dimensions are defined in `wiki/scoring-rubrics.md`: accuracy, relevance, completeness, task completion, hallucination risk, groundedness, safety, consistency, tone fit, actionability.
- [ ] Each dimension has: a name, a one-sentence definition, the kind of failure it catches, a recommended scoring method, a default weight, and a default threshold.
- [ ] At least one example pass and one example fail are documented per high-impact dimension (groundedness, hallucination risk, task completion, safety).
- [ ] Use-case-specific rubrics are documented for Shadow, RAG, and small business automation, each highlighting which dimensions matter most and why.
- [ ] Rubric weights are required to normalize to 1. Unnormalized rubrics are rejected at save time.

## 4. Architecture clarity

The artifact passes architecture review if all of the following hold.

- [ ] The Mermaid diagram in `architecture.md` is readable on a single screen and labels every layer.
- [ ] Each layer has a single-sentence responsibility statement.
- [ ] Each layer lists its inputs, outputs, and the layer it depends on (or that depends on it).
- [ ] The architecture document explains *why this shape and not a single LLM call*.
- [ ] External dependencies (judge model, embedding provider, PII detection) are listed with their fallbacks.
- [ ] Performance and cost model are addressed at the level of "how many model calls per case".

## 5. Wiki quality

The wiki passes review if all of the following hold.

- [ ] `evaluation-principles.md` takes positions, not surveys. It is willing to call common practices wrong.
- [ ] `hallucination-risk.md` defines hallucination operationally (supported / partially supported / unsupported / contradicted) rather than philosophically.
- [ ] `groundedness.md` distinguishes "the claim has a source" from "the source actually supports the claim".
- [ ] `scoring-rubrics.md` is usable as a template; a new rubric can be designed by filling in its sections.
- [ ] `regression-evaluation.md` explains the apples-to-apples requirement: same dataset, same rubric version, change one variable.
- [ ] `llm-as-judge.md` states when LLM judges are appropriate and when they are not. It lists known judge failure modes.
- [ ] `human-review.md` defines when human review is mandatory (not "nice to have").
- [ ] `evaluation-reports.md` shows the structure of a useful report and explains why each section exists.
- [ ] No wiki page is purely academic. Every page maps to an action a product team can take this week.

## 6. Diagrams

The diagrams folder passes review if all of the following hold.

- [ ] Each diagram file contains exactly one Mermaid diagram.
- [ ] Each diagram file includes a short prose explanation (~2 paragraphs) of what it shows and what it implies.
- [ ] The four required diagrams exist: evaluation pipeline, scoring flow, human review flow, regression evaluation flow.
- [ ] Diagrams are consistent with the architecture document. Naming and arrows do not contradict each other.

## 7. Portfolio readiness

The artifact passes portfolio review if all of the following hold.

- [ ] A reader who spends 10 minutes (README + product brief + one diagram) understands the product position.
- [ ] A reader who spends 30 minutes understands the system architecture and the evaluation philosophy.
- [ ] A hiring reader can answer, from this artifact alone:
  - "How does this person think about LLM evaluation?"
  - "How does this person separate evaluation from prompt management?"
  - "How does this person handle the hallucination problem?"
  - "How does this person reason about LLM-as-judge bias?"
  - "How does this person think about human-in-the-loop?"
- [ ] The artifact takes opinions visible on the surface. A reader can disagree with at least three of them. (If there is nothing to disagree with, there is nothing to be impressed by either.)
- [ ] The boundary against PromptOps is explicit and repeated, not implied.
- [ ] The artifact does not promise things it does not deliver in MVP. Future work is labeled as future, not implied as present.

## 8. Non-criteria (intentionally excluded)

These are deliberately not in the bar. Including them would distort the artifact away from its purpose.

- Working UI implementation.
- Working LLM-judge calls against a real model.
- Real datasets.
- Tests, benchmarks, or coverage reports.
- Pixel-perfect mockups.
- A production deployment.

This is a documentation artifact. The bar is documentation quality and the seriousness of the product thinking behind it.
