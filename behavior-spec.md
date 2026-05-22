# Behavior Specification — AI Evaluation Tool

This document defines what the system does, what it explicitly does not do, and how it behaves under specific conditions. It is the contract between the product idea and the implementation. Anything not described here is undefined.

---

## 1. What the system does

### 1.1 Accepts an evaluation input

The system accepts one evaluation unit, called an **evaluation case**:

```
{
  "input": "string — the prompt or user message the AI received",
  "expected_behavior": "string — what a good output looks like (criteria, not literal text)",
  "ai_output": "string — what the AI produced",
  "retrieved_context": [ "string", ... ]   // optional, used for groundedness
  "metadata": { ... }                       // model, prompt id, version, dataset, tags
}
```

A case may be evaluated:
- One at a time (interactive use).
- In a batch (a dataset of cases).
- As part of a regression comparison (same cases against two runs).

### 1.2 Applies a rubric

A **rubric** is a structured definition of how to score an output. It contains:

- A list of **dimensions** (e.g. accuracy, groundedness, tone fit). See `wiki/scoring-rubrics.md`.
- For each dimension: a **scoring method** (`deterministic`, `llm_judge`, `semantic_similarity`, `human`), a **weight**, a **pass threshold**, and a short prompt or rule.
- A rubric **version** and an **owner**.

The same input + output evaluated against two different rubrics may produce two different scores. This is expected and correct — a rubric is an opinion about what "good" means in a context.

### 1.3 Scores across dimensions

For each dimension in the rubric, the system produces:

- A numeric score (default 0–10, normalized for the overall calculation).
- A pass/fail flag against the dimension's threshold.
- A short rationale (1–3 sentences). For LLM-judge dimensions, the rationale is the judge's reasoning. For deterministic dimensions, the rationale is the rule that fired.
- For groundedness and hallucination dimensions: span-level evidence linking claims in the output to (or away from) supporting context.

The overall score is a **weighted average** of dimension scores, normalized to 0–100. A case is considered **passing** only if every dimension above weight 0 meets its threshold. Overall numeric average alone does not pass a case.

### 1.4 Detects hallucination risk

The tool produces, for each evaluation case:

- A list of **atomic claims** extracted from the AI output.
- A label per claim: `supported`, `partially_supported`, `unsupported`, `contradicted`.
- A confidence value per claim (0–1).
- A reference per `supported` / `partially_supported` / `contradicted` claim, pointing to the supporting or contradicting context span (when available) or to a generally known fact source (when not).

See `wiki/hallucination-risk.md` for the operational definitions.

### 1.5 Evaluates groundedness

For evaluation cases that include `retrieved_context`, the tool additionally produces:

- A **claim → source map**: each atomic claim is linked to zero or more context chunks.
- A **groundedness score** (% of claims with a supporting source).
- A list of **ungrounded claims** (claims with no source).
- A list of **unused context chunks** (chunks that were retrieved but not used by any claim).
- A list of **misused chunks** (chunks cited by the claim but whose text does not actually support it).

If `retrieved_context` is empty or absent, groundedness is reported as `N/A` and the dimension is excluded from the overall score.

### 1.6 Evaluates task completion

Task completion measures whether the output achieves the goal stated in `expected_behavior`, independent of style. The tool produces:

- A binary `task_completed` flag (true / false / partial).
- A list of **requirements satisfied** and **requirements missed** parsed from `expected_behavior`.

This dimension cannot be passed by fluent prose alone. If a requirement is missed, task completion is at most `partial`.

### 1.7 Flags safety issues

The tool runs safety checks on every output, regardless of rubric. Safety findings are reported separately and are not overridable by other dimension scores. Categories:

- PII leakage (emails, phones, IDs, addresses).
- Unsafe instruction following (e.g. compliance with disallowed request types).
- Toxicity / harassment markers.
- Self-harm / medical / legal advice given without disclaimer where required.
- False confirmation of an action that was not actually performed (e.g. "booked!" without a backing tool call).

A safety finding sets a top-level `safety_review_required: true` flag on the case. Cases with this flag must be human-reviewed before the case can be marked `resolved`.

### 1.8 Generates an evaluation report

For any run (single case or batch), the tool produces a report containing:

- Summary: rubric, dataset, model, prompt version, timestamp.
- Aggregate scores: overall, per dimension.
- Distribution: histogram per dimension.
- Top failing cases (default top 5): input, output, scores, evidence.
- Safety findings.
- Hallucination summary: count, severity distribution.
- Groundedness summary (when applicable).
- Recommendations: short list of suggested next actions derived from failure patterns.

Reports are exportable as markdown and PDF. The report is reproducible: re-running the same dataset against the same rubric and the same outputs reproduces the same report (excluding LLM-judge nondeterminism — see edge cases).

### 1.9 Compares runs (regression evaluation)

Given two runs **A** and **B**:

- The tool requires the same dataset and the same rubric. Different datasets or rubrics produce an error, not an apples-to-oranges comparison.
- The tool reports: aggregate delta per dimension, list of cases that *regressed* (passing in A, failing in B), list of cases that *recovered* (failing in A, passing in B), score-delta distribution.
- A run B is flagged as a **regression** if any dimension drops more than a configurable threshold (default: ≥ 5 points on a 100-scale) or if more than N% of cases regressed (default: 2%).

See `wiki/regression-evaluation.md`.

### 1.10 Supports human review

For any case, a reviewer may:

- Override one or more dimension scores, with a required reason string.
- Override the hallucination labels on individual claims.
- Mark the case `reviewed`, `disputed`, or `escalated`.

Human overrides are stored alongside the LLM-judge scores, not on top of them. The final score is the human score when a review exists; the LLM-judge score otherwise. The original judge score is never silently overwritten.

Override data is exposed in a **judge calibration log** so the team can monitor systematic LLM-judge bias over time.

### 1.11 Stores results

Every evaluation run is persisted with:

- The input case(s).
- The exact rubric version used.
- The exact AI output that was evaluated.
- All scores, labels, evidence.
- Human overrides (if any).
- Timestamps and metadata.

A stored run is **immutable**. Re-evaluating a case creates a new run. This protects audit value.

---

## 2. What the system does NOT do

The following are explicit non-behaviors. They are listed to prevent scope drift.

- **Does not author or modify prompts.** It reports what an output got wrong, not how to rewrite the prompt.
- **Does not store prompt versions.** A prompt id may appear in metadata, but the tool of record for prompt lifecycle is PromptOps.
- **Does not call production models.** It evaluates outputs that were already produced. (V2 may add an optional inference layer for convenience, but the unit of analysis remains the output.)
- **Does not act as a chat UI.** No free-form chat with the AI under evaluation.
- **Does not score on a single number.** The overall score is always derived from dimension scores; a single number alone is never the artifact.
- **Does not silently use one LLM judge as ground truth.** Judge outputs are scored, calibrated, and overridable.
- **Does not auto-train models.** No fine-tuning loop, no RL from human feedback. Override data is logged, not consumed.
- **Does not benchmark against public datasets.** The intent is product-specific evaluation, not capability leaderboards.
- **Does not gate deployments by itself.** It produces evidence. The decision to ship is human.
- **Does not edit retrieved context.** It evaluates whether the output used the context responsibly; it does not modify the retriever.
- **Does not delete evaluation history.** Cases may be archived but not destroyed within the MVP retention policy.

---

## 3. How scoring works

### 3.1 Dimension scoring methods

Each dimension is scored by exactly one method.

| Method | Used for | Output |
|---|---|---|
| `deterministic` | Format checks, regex match, length bounds, JSON shape, required keywords | Pass/fail or 0/10 |
| `semantic_similarity` | "Similar to expected output" comparisons against a reference | 0–10 from cosine similarity |
| `llm_judge` | Subjective dimensions: tone, completeness, relevance, nuance | 0–10 with rationale |
| `human` | Safety-sensitive or high-stakes dimensions | Override score with reason |

`llm_judge` runs receive a structured prompt that includes the dimension name, its rubric description, the input, expected behavior, output, and optional context. The judge returns score + rationale + evidence pointers. See `wiki/llm-as-judge.md` for prompt conventions.

### 3.2 Weights and thresholds

- Weights are normalized to sum to 1 across the rubric. The system rejects rubrics with unnormalized weights or weights summing to 0.
- A threshold is a per-dimension minimum score for the dimension to count as passing.
- A case `passed` only when every dimension with weight > 0 meets its threshold AND no safety finding is open.

### 3.3 Aggregation

- Overall score = Σ (dimension_score × weight), normalized to 0–100.
- Batch overall = mean of case overalls. Median and p25/p75 are also reported.
- Aggregations exclude dimensions reported as `N/A` for that case (e.g. groundedness without context).

### 3.4 Score interpretation

The tool does not invent score labels. The rubric defines them. By default:

- `≥ 85` interpreted as "Ship-ready" (subject to safety review).
- `70–84` interpreted as "Acceptable with caveats".
- `< 70` interpreted as "Needs work".

These bands are configurable per project and are reported alongside numeric scores so a reader is never asked to decode a raw number.

---

## 4. How hallucination risk is detected

The tool runs a multi-step pipeline:

1. **Claim extraction.** The AI output is decomposed into atomic factual claims by an LLM-judge prompt designed for extraction (not scoring).
2. **Source matching.** For each claim, the tool searches `retrieved_context` (if present) for spans that semantically support, contradict, or partially support the claim.
3. **External knowledge fallback.** If no context match exists, the tool optionally checks a configured external source (e.g. a domain knowledge base). Without a configured source, the claim is labeled `unsupported` and surfaced for human review.
4. **Labeling.** Each claim receives `supported` / `partially_supported` / `unsupported` / `contradicted`, with confidence and evidence pointer.
5. **Aggregation.** Hallucination risk dimension score is computed from the distribution of labels and severity weights (see `wiki/hallucination-risk.md`).

Claim extraction is conservative: a claim labeled `unsupported` is a *candidate* for human review, not a definitive accusation. The system reports its confidence and exposes the evidence trail.

---

## 5. How groundedness is evaluated

Groundedness is evaluated **only when** `retrieved_context` is present. Pipeline:

1. Extract atomic claims from the output (shared with the hallucination pipeline).
2. For each claim, search every context chunk for a supporting span.
3. Build the claim → source map.
4. Compute:
   - `% claims with at least one source`
   - `% context chunks actually used`
   - `% claims whose cited chunk does not actually support them` (misuse)
5. Score the groundedness dimension as a function of supported-claim ratio, with a penalty for misuse.

A groundedness score of 100 requires: every claim has a source, no misuse, no contradiction. Anything less is reported with the gap explicitly.

---

## 6. How task completion is evaluated

Task completion is evaluated using `expected_behavior` as the ground truth. Pipeline:

1. Parse `expected_behavior` into a checklist of requirements (using an LLM-judge extraction prompt).
2. For each requirement, decide: met / partially_met / missed.
3. Set `task_completion`:
   - `complete` if all requirements met,
   - `partial` if at least one missed, none missing is critical,
   - `failed` if a requirement marked critical was missed.

`expected_behavior` is a *criteria-spec*, not a literal target output. The tool does **not** compare strings.

---

## 7. How safety issues are flagged

Safety runs independently of the rubric. It is not weight-able away. Pipeline:

1. PII detector scans `ai_output` for emails, phones, IDs, addresses, credit-card-like numbers.
2. Policy detector runs LLM-judge prompts for: harmful instructions, harassment, self-harm content, false action confirmations, regulated-domain advice without disclaimer.
3. Each finding has a category, severity (`low`, `medium`, `high`, `critical`), and an evidence span in the output.

If any finding is `medium+`, the case is marked `safety_review_required: true` and added to the human review queue with priority.

A case cannot be marked `resolved` while it has an open `medium+` safety finding.

---

## 8. How reports are generated

A report is produced from a stored evaluation run by:

1. Loading the run (immutable snapshot).
2. Computing aggregates.
3. Selecting evidence: top failing cases, exemplar passing cases, full safety log.
4. Rendering the markdown template.
5. (Optional) Rendering markdown to PDF.

A report is **deterministic given the stored run**. Re-rendering produces byte-identical markdown (modulo timestamps in the header).

If the underlying run is updated by human review, a new report version is generated. The old report version is preserved.

---

## 9. Edge cases

| Case | Behavior |
|---|---|
| Empty `ai_output` | All dimensions score 0. `task_completion = failed`. Report flagged "empty output". |
| Missing `expected_behavior` | Task completion and any dimension that depends on expected behavior reported as `N/A`. Other dimensions still scored. |
| Missing `retrieved_context` | Groundedness reported as `N/A`. Hallucination still evaluated but limited to external knowledge fallback. |
| Output longer than rubric assumes (10× expected length) | Tool still runs but flags `length_outlier: true` in the case metadata. |
| Non-text output (e.g. tool call) | Out of MVP scope. Case is rejected with a clear error, not silently scored. |
| LLM judge times out | Dimension reported as `unscored` with reason. Case is still saved. Overall score excludes this dimension. |
| LLM judge returns malformed JSON | One retry with stricter parsing. On second failure, dimension marked `unscored` and the raw response saved for debugging. |
| Identical input evaluated twice | Two separate runs are produced. Results may differ for `llm_judge` dimensions (noted in run metadata). |
| Rubric edited after a run | Old runs are not re-scored. New runs use the new rubric. Rubric versions are explicit in stored runs. |
| Two reviewers disagree | Both overrides are stored. The case is marked `disputed`. Final score requires a third reviewer or a documented decision. |
| Dataset contains duplicates | Allowed but flagged. Aggregates may double-count if not deduplicated by the user. |
| Output contains markdown / code | Treated as text. Claim extraction is robust to fenced code blocks (does not extract claims from code). |
| Output is in a different language than expected | Language mismatch dimension flags it. Other dimensions still run. |

---

## 10. Failure states

| Failure | Detection | Recovery |
|---|---|---|
| Rubric weights do not sum to 1 | Validation at save time | Save is blocked; user prompted to normalize |
| LLM judge unreachable | Connection error or timeout | Case marked `unscored` per dimension; user can re-run |
| Storage write failure | Exception on save | Run held in an in-memory retry buffer; surfaced as a user-visible error |
| Report render failure | Markdown rendering exception | Raw run JSON is offered as fallback download |
| Regression comparison across mismatched runs | Same-dataset / same-rubric check | Comparison blocked with explanation; not a silent merge |
| Concurrent override on same case | Last-write-wins with a stored prior-override audit trail | Reviewer sees a conflict banner; both reasons preserved |
| Empty dataset | Validation at run start | Run is blocked; user prompted |
| Corrupt stored run | Read-time validation | Run marked `corrupt`; not silently reported in aggregates |

The system prefers explicit failures over silent partials. A score that did not run is reported as `unscored`, never as `0`.

---

## 11. Invariants

These statements must always be true. If any of them is observed false, the tool has a defect, not a feature.

1. A stored run is immutable. Re-evaluation creates a new run.
2. A case is `passed` only if every weighted dimension meets its threshold AND no `medium+` safety finding is open.
3. A safety finding cannot be canceled by raising another dimension's score.
4. Rubric weights normalize to 1.
5. Human override never destroys the prior LLM-judge score; both are retained.
6. A report references exactly one run. Cross-run synthesis is the job of the comparison view, not the report.
7. Hallucination and groundedness pipelines share the same claim-extraction step in a given run. Inconsistency between them is a bug.
8. No score is silently coerced from `unscored` to `0`.
9. A `safety_review_required: true` case cannot be marked `resolved` without a human reviewer's action.
10. The tool surfaces uncertainty, not just point estimates. Every LLM-judge score carries a rationale.
