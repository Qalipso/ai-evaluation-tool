# Scoring Rubrics

How to design a rubric, the ten reference dimensions, the scoring rules, and starter rubrics per product shape.

A rubric is a versioned product artifact. Designing one is a deliberate act, not a configuration step.

---

## 1. What a rubric is

A rubric is the structured definition of what "good" means for a given AI product. It contains:

- A name and a version.
- An owner.
- A list of dimensions.
- For each dimension: a description, a scoring method, a weight, a pass threshold, and a short prompt or rule.
- A safety policy reference (which safety checks are enabled).

Two outputs evaluated against two rubrics will get different scores. This is expected. The rubric is the opinion; the score is its application.

## 2. The ten reference dimensions

The tool ships with these dimensions. A rubric does not have to use all of them. It must not have more than ten (cap to prevent rubric creep).

| Dimension | One-line definition | Catches | Default method | Default weight | Default threshold |
|---|---|---|---|---|---|
| **Accuracy** | The output's factual claims are correct in the world | Wrong facts, wrong arithmetic, wrong names | `llm_judge` + optional ground-truth | 0.15 | 70 |
| **Relevance** | The output addresses the input | Off-topic answers, generic boilerplate | `llm_judge` | 0.10 | 70 |
| **Completeness** | The output covers every requirement in `expected_behavior` | Missing required steps, partial answers | `llm_judge` + requirement-checklist | 0.10 | 70 |
| **Task completion** | The output achieves the user's goal, not just answers the surface question | "Plausible but useless" outputs | `llm_judge` | 0.10 | 70 |
| **Hallucination risk** | Probability the output contains invented or unsupported claims | Confidently-stated fictions | Claim pipeline | 0.15 | 80 |
| **Groundedness** | Every claim is anchored in retrieved context (RAG) | Stitched facts, ghost numbers, citation drift | Claim pipeline | 0.10 (only when context is supplied) | 75 |
| **Safety** | The output is free of PII leakage, harmful instruction following, false confirmation | High-severity policy violations | Safety layer | gate (not weighted) | n/a |
| **Consistency** | The output does not contradict itself or prior outputs in the same conversation | Inner contradictions, multi-turn drift | `llm_judge` | 0.05 | 70 |
| **Tone fit** | The output matches the project's voice and audience expectations | Wrong register, toxic positivity, off-brand voice | `llm_judge` | 0.05 | 60 |
| **Actionability** | The output gives a user something they can act on, when action is the goal | Vague answers when specific ones were needed | `llm_judge` | 0.05 | 65 |

Weights here sum to 0.85 because `safety` is a gate, not a weight. Other 0.15 is reserved for project-specific dimensions.

## 3. Scoring methods

A rubric assigns one method per dimension. Mixing methods within a rubric is normal and encouraged.

### Deterministic

Rule-based. Cheap. Fully reproducible. Use for:

- JSON-shape validation.
- Required keywords / phrases.
- Length bounds.
- Banned-word lists.
- Format checks (e.g. presence of a specific section).

Output: pass/fail mapped to 0/10 or partial credit per rule. Always 100% reproducible.

### Semantic similarity

Embedding-based. Mid-cost. Use for:

- "The output paraphrases the expected output."
- "The output stays on topic."
- "The output is similar to a known-good reference."

Output: 0–10 from cosine similarity normalized to a rubric-defined range. Reproducible up to the embedding model.

### LLM-as-judge

LLM call with a structured prompt. Higher cost. Use for:

- Subjective dimensions: tone, completeness, relevance, nuance.
- Anything that needs a *rationale*, not just a number.

Output: score + rationale + (where applicable) evidence pointers. Non-deterministic; the tool reports variance estimates and supports judge-averaging.

### Human

Reviewer override. Use for:

- High-stakes safety dimensions.
- Cases the LLM judge marks low-confidence.
- Calibration samples.

Output: score + reason. Stored alongside (never on top of) the LLM-judge score.

## 4. Rules a rubric must follow

The tool enforces these at save time. A rubric that violates any of them cannot be activated.

1. **Weights normalize to 1** across dimensions with weight > 0. Safety is a gate, not a weight.
2. **At most 10 dimensions.** Beyond 10, reviewers stop scoring and start guessing.
3. **Every dimension has a description.** "Accuracy = accuracy" is rejected.
4. **Every dimension has a method.** No implicit defaults.
5. **Every dimension has a threshold.** A dimension with no threshold cannot fail, which makes it noise.
6. **A rubric version is immutable once used.** A new rubric version is created by branching.

## 5. Designing a rubric

A 30-minute exercise.

1. **Pick the failure modes.** Write down five outputs the team has *already seen* and disliked. What was wrong with each? Each is a candidate dimension.
2. **Group failure modes into dimensions.** Aim for 4–8 dimensions. Reject "everything matters equally" — that produces a rubric nobody scores.
3. **Pick the method per dimension.** Start deterministic where possible. LLM-judge where subjectivity matters. Human where stakes are highest.
4. **Set weights.** Force ranking: which dimension matters most? Twice as much as the next? Avoid 0.10 across the board; that hides priorities.
5. **Set thresholds.** A threshold is the minimum the team will defend at launch. Lower thresholds are lies told to feel better.
6. **Name the rubric.** Tie it to the product version: `shadow-daily-reflection-v1.0`. Not `final` or `current`.

## 6. Use-case-specific rubrics

These are the starter rubrics the tool ships. Each is a list of dimensions with weights and any extra dimensions beyond the ten reference ones.

### Shadow — daily reflection

| Dimension | Weight | Threshold | Notes |
|---|---|---|---|
| Life-area classification accuracy | 0.15 | 80 | Deterministic checklist against project taxonomy. |
| Emotional nuance | 0.10 | 70 | LLM-judge with explicit "does it pick up grief, frustration, hope without overclaiming?" |
| Non-judgmental tone | 0.10 | 75 | LLM-judge with banned-tone list (advice-giving without invitation, moralizing). |
| Useful next step | 0.10 | 65 | Actionability dimension, narrowed to proportional small actions. |
| Memory relevance | 0.10 | 70 | Groundedness against the user's prior reflections. |
| Completeness | 0.10 | 70 | Did it cover the day's entries the user logged? |
| Hallucination risk | 0.15 | 80 | The model must not invent events the user did not log. |
| Safety | gate | n/a | PII leakage, no medical/clinical advice. |
| Tone fit | 0.05 | 70 | Shadow-specific voice: warm, observational, not advisor-y. |
| Consistency | 0.05 | 70 | Does not contradict a recent reflection. |

### RAG — answer with retrieved context

| Dimension | Weight | Threshold | Notes |
|---|---|---|---|
| Groundedness | 0.20 | 80 | The defining dimension. |
| Hallucination risk | 0.15 | 85 | Tight because ungrounded RAG = lost trust. |
| Citation correctness | 0.10 | 80 | Misused-citation check (deterministic + judge). |
| Context relevance | 0.10 | 70 | Did the retriever pull useful chunks? Separate metric for upstream. |
| Accuracy | 0.10 | 75 | World-truth where verifiable. |
| Completeness | 0.10 | 70 | Did the answer cover every part of the question? |
| Actionability | 0.05 | 65 | For how-to questions. |
| Tone fit | 0.05 | 60 | Documentation voice. |
| Safety | gate | n/a | No internal-only data leaking to external user. |

### Small business booking assistant

| Dimension | Weight | Threshold | Notes |
|---|---|---|---|
| Intent detection | 0.20 | 90 | Deterministic test cases. Failing this is unacceptable. |
| Booking readiness | 0.15 | 85 | All required slots present (service, date, time, stylist). |
| No false confirmation | gate | n/a | Safety: "booked" only when a tool call actually wrote to calendar. |
| Proper human handoff | 0.10 | 80 | When confused, routes to a human, does not improvise. |
| Clear answer | 0.10 | 75 | Concise, no robotic preamble. |
| Tone fit | 0.10 | 70 | Friendly, brand voice. |
| Hallucination risk | 0.10 | 85 | No invented stylists, no invented services. |
| Safety | gate | n/a | PII handled per policy. |
| Actionability | 0.10 | 70 | User leaves with a next step. |
| Consistency | 0.05 | 70 | Same answer to the same question across the session. |

### AI planner

| Dimension | Weight | Threshold | Notes |
|---|---|---|---|
| Task completion | 0.20 | 75 | Highest weight: did the original objective get done? |
| Plan coherence | 0.10 | 70 | Do the steps make sense together? |
| Hallucination risk | 0.15 | 85 | No invented tools, files, or facts. |
| Safety | gate | n/a | No silent destructive actions. |
| Accuracy | 0.10 | 75 | Where facts are involved. |
| Actionability | 0.10 | 70 | Final report is usable, not descriptive. |
| Completeness | 0.10 | 70 | Every sub-task addressed. |
| Tone fit | 0.05 | 60 | Operator voice; concise. |
| Consistency | 0.05 | 70 | The plan and the report do not contradict. |

### Customer support reply

| Dimension | Weight | Threshold | Notes |
|---|---|---|---|
| Accuracy | 0.15 | 80 | Wrong policy = real-world cost. |
| Completeness | 0.10 | 75 | Every customer concern addressed. |
| Safety | gate | n/a | No PII leak across customers. |
| Hallucination risk | 0.15 | 85 | No invented policy clauses. |
| Tone fit | 0.10 | 75 | Empathetic, brand-consistent. |
| Actionability | 0.10 | 70 | Next step the customer can take. |
| Relevance | 0.10 | 75 | Answers what was actually asked. |
| Consistency | 0.05 | 70 | Aligned with prior ticket history. |
| Groundedness | 0.15 | 75 | Where a knowledge base was retrieved. |

## 7. Worked rubric example (Shadow daily reflection)

```json
{
  "id": "shadow-daily-reflection-v1.0",
  "owner": "shadow-team",
  "version": "1.0",
  "dimensions": [
    { "id": "life_area_accuracy", "method": "deterministic",
      "weight": 0.15, "threshold": 80,
      "rule": "All detected areas must be in project taxonomy." },
    { "id": "emotional_nuance", "method": "llm_judge",
      "weight": 0.10, "threshold": 70,
      "prompt": "Did the output pick up emotional nuance accurately, without overclaiming feelings the user did not express?" },
    { "id": "non_judgmental_tone", "method": "llm_judge",
      "weight": 0.10, "threshold": 75,
      "prompt": "Did the output avoid advice-giving the user did not request and avoid moralizing?" },
    { "id": "useful_next_step", "method": "llm_judge",
      "weight": 0.10, "threshold": 65,
      "prompt": "Was the suggested next step small, specific, and proportional to the journal content?" },
    { "id": "memory_relevance", "method": "groundedness",
      "weight": 0.10, "threshold": 70 },
    { "id": "completeness", "method": "llm_judge",
      "weight": 0.10, "threshold": 70 },
    { "id": "hallucination_risk", "method": "claim_pipeline",
      "weight": 0.15, "threshold": 80 },
    { "id": "tone_fit", "method": "llm_judge",
      "weight": 0.05, "threshold": 70 },
    { "id": "consistency", "method": "llm_judge",
      "weight": 0.05, "threshold": 70 },
    { "id": "actionability", "method": "llm_judge",
      "weight": 0.10, "threshold": 65 }
  ],
  "safety_gates": ["pii_leakage", "medical_advice_without_disclaimer"]
}
```

## 7a. Decision: which scoring method per dimension?

A working heuristic, derived from IFEval (deterministic) + G-Eval (judge) + ARES/RAGAS (RAG-specific) + HELM (multi-method):

```
Can the requirement be expressed as a rule a parser can check?
  yes → deterministic
  no  → Is there a known-good reference output to compare against?
          yes → semantic similarity (embedding cosine, threshold)
          no  → Does the dimension need natural-language reasoning to evaluate?
                  yes → LLM-as-judge with structured prompt (score + rationale + evidence)
                  no  → human-only (safety-critical or genuinely ambiguous)
```

Practical examples:
- "Output is valid JSON matching schema X" → deterministic.
- "Output is similar in meaning to a reference answer" → semantic similarity.
- "Output addresses every part of a multi-part question" → LLM-judge with requirement-list step.
- "Output does not leak PII" → deterministic detector + human review on flags, never LLM-judge alone.

This decision is per-dimension, not per-rubric. A single rubric can and usually does mix three methods.

## 7b. Per-dimension cost is a rubric design constraint

Cost is not visible on the rubric form by default; the tool reports it after a run. A few guidelines learned the hard way:

- A `llm_judge` dimension with `N=3` averaging on a 1000-case dataset is 3000 judge calls per run. At frontier-model pricing, that is the bulk of the run's bill.
- Demoting an LLM-judge dimension to a smaller judge model (or to deterministic where possible) is often the highest-ROI rubric change.
- Per-dimension cost should be checked after the first run of a new rubric, not after the tenth.
- The report's appendix surfaces per-dimension cost so teams cannot pretend a $0.10/case rubric is the same as a $0.01/case rubric.

The rubric editor surfaces an estimated cost preview when a method or judge model is changed; this is advisory, not blocking.

## 8. Versioning a rubric

A rubric version is immutable once used. Editing produces a new version. The recommended cadence:

- **Patch** (1.0 → 1.1): wording, judge prompt clarification, threshold tweak by ≤ 5 points.
- **Minor** (1.0 → 2.0): add or remove a dimension, re-weight materially.
- **Major** (2.0 → 3.0): change the scoring philosophy (e.g. start using human review for safety).

A run carries the exact rubric version. Comparison across rubric versions is allowed but reported with a banner: *not apples-to-apples*.

---

## Source-backed concepts

The rubric design above is opinionated; the underlying choices are not invented here. Each maps to a primary source.

- **Separate dimensions, never collapsed.** Stanford HELM evaluates models across multiple dimensions in parallel precisely because a single score hides axis-specific failures. The rubric here inherits that stance: 4–10 dimensions, weighted, but reported separately as well.
- **Deterministic checks for verifiable requirements.** IFEval defines instruction-following as a set of verifiable constraints (word counts, banned phrases, mandatory keywords, format rules). The tool's `deterministic` scoring method is the operational form of that paper's recommendation: if a requirement can be checked by code, code is cheaper and less noisy than a judge.
- **LLM-as-judge with structured prompts.** G-Eval shows that a judge prompt with chain-of-thought reasoning correlates better with humans than ad-hoc rating prompts. The `llm_judge` method's required `score + rationale + evidence` JSON shape encodes that finding.
- **RAG-specific dimensions.** RAGAS proposes faithfulness, answer relevancy, context precision, and context recall as separate dimensions of RAG quality. The RAG starter rubric in this Wiki maps `groundedness`, `citation_correctness`, and `context_relevance` to those axes, keeping each axis individually inspectable.
- **Method per dimension, not per rubric.** OpenAI Evals treats graders as configurable per metric — deterministic, model-graded, or human. The rubric design here follows the same per-dimension method assignment, rather than locking all dimensions to one grader.
- **Rubric before output.** Anthropic's prompt-engineering documentation makes "define success criteria first" a prerequisite step. The tool enforces that order: a rubric must be created and activated before its scores are computed.

## Applied in this tool

- The deterministic / semantic-similarity / LLM-judge / human method picker on `/rubrics/[id]` is the IFEval + G-Eval recommendation made operational.
- The rule that weights sum to 1 across non-gate dimensions and that safety is a gate (no weight) is the OWASP + NIST + HELM stance combined into one validator.
- The RAG starter rubric in this article is RAGAS expressed as the product's defaults; the booking-assistant starter rubric is OWASP risk categories (false confirmation, PII handling) expressed as gates.
- The judge prompt template stored per `llm_judge` dimension follows the G-Eval structure: dimension name, definition, inputs, "identify the flaw first" step, JSON response with `score`, `requirements` (or `evidence`), `rationale`.

## Sources used

- Stanford HELM — separate dimensions, multi-axis evaluation.
- IFEval — deterministic checks for verifiable requirements.
- G-Eval — structured judge prompt with rationale.
- RAGAS — RAG-specific dimensions (faithfulness, context precision/recall).
- OpenAI Evals — method per dimension, deterministic / model-graded / human graders.
- Anthropic Evaluation Documentation — rubric before output.

---

## Related topics

- [Evaluation Principles](./evaluation-principles.md) — the opinions a rubric encodes (no global score, safety as gate, rubric before output).
- [LLM-as-Judge](./llm-as-judge.md) — when the `llm_judge` method is appropriate and how the prompt is structured.
- [Hallucination Risk](./hallucination-risk.md) — how the `hallucination_risk` dimension is computed via the claim pipeline.
- [Groundedness](./groundedness.md) — how the `groundedness` dimension is computed for RAG outputs.
- [Regression Evaluation](./regression-evaluation.md) — why rubric versions are immutable and how cross-version comparison is handled.
- [Evaluation Reports](./evaluation-reports.md) — how rubric metadata appears in the report header and appendix.
