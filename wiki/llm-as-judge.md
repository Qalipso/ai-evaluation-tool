# LLM-as-Judge

When to use an LLM as the scoring engine, when not to, and how to keep it honest.

The tool uses LLM judges extensively. It also does not trust them without calibration. Both stances are deliberate.

---

## 1. When LLM judges are appropriate

LLM-as-judge is the right method when the dimension being scored is:

- **Subjective but well-defined.** "Is the tone empathetic and brand-consistent?" — a human can do this; a model can approximate it.
- **Compositional.** "Does the output address every part of a multi-part question?" — checklists are tractable.
- **Requiring natural language reasoning.** "Is this claim entailed by this context?" — the judge produces a rationale, which is the actual output.
- **Cheap to verify against a human gold set.** If a human reviewer can label 50 cases in an hour and the judge agrees with them most of the time, the judge can fan out to 500.

In these cases, the judge is faster than a human and more consistent than a vibe.

## 2. When LLM judges are inappropriate

LLM-as-judge is the wrong method when:

- **The dimension is deterministic.** "The output is valid JSON" is not a judge question; it is a parser question. Asking an LLM doubles the cost and adds noise.
- **The dimension is safety-critical.** A judge with a 5% false-negative rate on PII leakage is a liability. Use deterministic detectors plus humans.
- **The dimension is the same as the model under test.** If the model being evaluated and the judge are the same model (or family), the judge will reproduce the model's biases. This is the most under-discussed failure mode.
- **There is no ground truth.** "Is this the best possible answer?" — there is no answer; the question is malformed.
- **The output space is closed.** Classification accuracy is computed by comparing labels, not by asking a judge.

## 3. Known LLM-judge failure modes

These are documented failure patterns. The tool's design assumes all of them.

### 3.1 Fluency bias

Judges over-rate fluent, confident-sounding outputs. Hallucinations stated well score higher than awkward truth. Mitigation: separate hallucination scoring from any other dimension; pair every judge score with claim-level evidence.

### 3.2 Position bias

In pairwise comparisons (A vs B), judges over-pick whichever option came first (or last, depending on model). Mitigation: randomize order; for V2 arena, run each comparison twice with order swapped.

### 3.3 Length bias

Judges over-rate longer outputs as "more complete". Mitigation: add a length-normalization step in the completeness prompt; cap aggregation.

### 3.4 Sycophancy

Judges agree with whatever framing the prompt gives them. If the prompt says "evaluate this likely-bad output", the judge finds problems; if it says "evaluate this output", scores rise. Mitigation: judge prompts are kept neutral and standardized; the prompt does not pre-frame the verdict.

### 3.5 Self-preference

A judge from the same family as the model under test rates that model's outputs higher than competitors'. Mitigation: prefer a judge from a different family than the model under test; rotate judges.

### 3.6 Inconsistency

The same case scored twice gets different numbers. Mitigation: judge-averaging (N samples per case, take mean) and 2σ noise rule (see regression evaluation wiki).

### 3.7 Confident wrongness

The judge produces a plausible rationale for a wrong score. The rationale fools readers into trusting the score. Mitigation: every rationale carries an evidence pointer; human review samples low-confidence rationales.

### 3.8 Sycophantic agreement with the output

Some judges, asked "is this output good?", default to "yes" with a polite rationale. Mitigation: prompts that require the judge to *first identify the worst flaw*, then score. "Find the flaw" elicits more honest evaluation than "rate the quality".

## 4. Judge prompt conventions

Every LLM-judge prompt in the tool follows the same shape:

1. **Identify the dimension** explicitly.
2. **Quote the rubric definition** of the dimension.
3. **Provide the input, expected behavior, output, and (where relevant) retrieved context.**
4. **Ask the judge to identify the most significant flaw first, then score.**
5. **Require a JSON response** with `score`, `rationale`, and (for claim-level work) `evidence`.

A bad judge prompt looks like: "Rate this output 1-10 for completeness." A good judge prompt looks like:

```
Dimension: completeness.
Definition: the output covers every requirement explicitly stated in expected_behavior.

Input: ...
Expected behavior: ...
Output: ...

Step 1: list every requirement from expected_behavior.
Step 2: for each requirement, mark met / partially_met / missed and quote the supporting span.
Step 3: produce a score from 0–10 where missing a requirement drops the score proportionally.
Respond as JSON:
{ "score": <int>, "requirements": [...], "rationale": "<one paragraph>" }
```

The judge that produces a list of requirements *before* scoring is harder to fool with fluency.

## 5. Calibration against humans

A judge that has never been compared to a human is unmeasured. The tool maintains a **calibration log** that, per dimension, tracks human-vs-judge deltas over time.

The procedure:

1. A sample (default 5%) of evaluated cases enters the human review queue.
2. Humans score the same dimension, with reason.
3. The tool records the delta per dimension per judge per project.
4. The calibration view shows: mean delta, distribution of deltas, drift over time.

A judge with a mean delta above a configurable threshold (default ±0.5 on a 0–10 scale) is flagged. The team either:

- Adjusts the judge prompt.
- Swaps the judge model.
- Demotes the dimension from `llm_judge` to `human`.

Calibration is a process, not a one-time exercise.

## 6. Judge selection

The tool does not pin a judge model. A rubric specifies the judge model per dimension. Defaults:

- A small/fast model for cheap dimensions (tone fit, relevance).
- A larger model for high-stakes dimensions (accuracy, hallucination, groundedness).
- A different family from the model under test, where possible.

Cost reporting in the tool surfaces the per-dimension judge cost. Teams see the trade-off and choose.

## 7. Judge-averaging

For LLM-judge dimensions, the tool supports running the judge N times and averaging (default N=3). Trade-offs:

- N=1: cheapest, noisiest.
- N=3: 3× cost, ~1.7× lower variance (square-root law).
- N=5+: diminishing returns; consider human review instead.

For comparison-critical runs (regression evaluation), N=3 is the default. For exploratory runs, N=1 is acceptable but the tool labels them "high variance".

## 8. The judge is never the only signal

A team that runs only LLM-judge dimensions has built a sophisticated confirmation machine. The tool's design forces:

- At least one deterministic dimension where possible.
- A safety layer that is not judge-based.
- A human review queue priority that surfaces judge-uncertain cases.
- A calibration log that quantifies judge drift.

Combined, these turn the LLM judge into a useful approximation rather than an unchecked oracle.

## 9. What "good judge behavior" looks like in the calibration log

The tool surfaces these qualities as healthy:

- Mean delta within ±0.5 of human, stable over time.
- Variance per case below 2 points.
- Failure cases (where judge disagreed strongly with human) cluster in *interpretable* patterns — e.g. judge over-rates long outputs — not in random places.
- The judge's rationales make sense to reviewers, even when the score is wrong.

These qualities are not optional. A judge that lacks them is unsuitable for production evaluation.

## 9a. Pointwise vs pairwise vs listwise judging

The LLM-as-Judge survey distinguishes three modes; each has its own failure characteristics and best use:

| Mode | What it does | When to use | Main risk |
|---|---|---|---|
| Pointwise | Score one output on a scale (e.g. 0–10 for accuracy). | Default for rubric scoring; required when there is no second candidate. | Score calibration drift; "all 8s" compression toward the middle. |
| Pairwise | Pick the better of two outputs (A vs B). | A/B testing two prompts or models on the same input. | Position bias (favor first or last) and length bias. |
| Listwise | Rank N outputs against each other. | Tournament comparison; ablation studies. | Combinatorial position-bias surface; expensive. |

The tool uses pointwise judging by default. The Compare view uses pairwise judging for the regression triage report, with order swapped on every comparison to neutralize position bias. Listwise is V2.

## 9b. Decision: when not to use an LLM judge at all

A practical checklist drawn from IFEval, HELM, and the LLM-as-Judge survey:

- The dimension is verifiable by code (length, format, banned words, JSON schema) → **deterministic**, not judge.
- The dimension has a known-good reference output → **semantic similarity** (embedding cosine), not judge.
- The dimension is safety-critical (PII, harmful content, false confirmation) → **deterministic detector + human**, not judge alone.
- The output space is closed (classification, multiple choice) → **label match**, not judge.
- The judge and the model under test are from the same family → **swap the judge** (self-preference), or accept the bias explicitly.

A rubric whose dimensions all default to `llm_judge` is signalling that the team has not asked these questions. The rubric editor surfaces a warning when more than 75% of weight is on judge-based dimensions.

## 10. Anti-pattern: the "LLM as a service" judge

A common temptation is to call a third-party "LLM evaluation" API that does all the scoring with no visibility into the rubric, the prompt, or the calibration data. This is not evaluation; it is a vibe outsourced to a vendor.

The tool refuses to integrate with judges that do not expose: the rubric used, the prompt sent, the rationale returned, and a per-dimension cost. If a vendor cannot show those four, the team is buying a number, not a measurement.

---

## Source-backed concepts

- **Structured judge prompts beat ad-hoc rating.** G-Eval shows that an LLM-judge prompt with chain-of-thought reasoning (identify criteria, evaluate against each, then score) correlates more closely with human judgment than a simple "rate 1-10" prompt. The judge prompt convention in this Wiki — quote the dimension definition, list requirements first, score last, return JSON — is that finding expressed as a template.
- **Position bias, verbosity bias, self-preference.** The MT-Bench / Chatbot Arena judge paper ("Judging LLM-as-a-Judge") measures and names these biases directly: judges over-pick the first option in a pairwise comparison, over-rate longer responses, and rate models from their own family higher. The failure-mode list in section 3 of this article is the operational form of those findings; the order-swap mitigation and the cross-family-judge recommendation are the mitigations that paper recommends.
- **Calibration is a process, not a one-time exercise.** The LLM-as-Judge survey shows that meta-evaluation (judging the judge) must run continuously: a judge that agreed with humans last quarter may drift this quarter as models or prompts change. The calibration view, the drift alert, and the demote-to-human path in this Wiki are the survey's recommendation made operational.
- **Sampling reduces variance.** SelfCheckGPT uses repeated sampling as a signal for hallucination; the inverse use — averaging N judge samples to reduce noise — is standard practice in the same literature. The tool's `N=3` default for judge-averaging is the variance-reduction recipe.
- **LLM judge is not the only signal.** Stanford HELM and OpenAI Evals both treat the LLM judge as one grader among several (deterministic, model-graded, human). The rule in section 8 — at least one deterministic dimension, a separate safety layer, human review priority on uncertainty — composes those sources into a single product stance.

## Applied in this tool

- The judge prompt editor on `/rubrics/[id]/dimensions/[dim]` enforces the G-Eval structure: dimension name, definition, "identify the worst flaw first" step, JSON response with `score`, `rationale`, and `evidence`.
- The calibration view on `/review` shows the MT-Bench-style human-vs-judge delta, mean and distribution per dimension, with drift over time.
- The "judge family ≠ model family" recommendation surfaces as a soft warning on rubric creation when the model under test and the configured judge come from the same vendor family.
- The judge-averaging setting (N samples per call) is configurable per dimension; a run with N=1 is labeled "high variance" in the report.

## Sources used

- G-Eval — structured judge prompt; chain-of-thought reasoning in the judge.
- MT-Bench / Chatbot Arena judge paper — position bias, verbosity bias, self-preference bias.
- LLM-as-Judge survey — meta-evaluation, calibration drift, drift response.
- SelfCheckGPT — sampling variance as a hallucination signal (inverse used for noise reduction).
- Stanford HELM — judge as one grader among several.
- OpenAI Evals — graders are configurable per metric, not locked to one method.

---

## Related topics

- [Scoring Rubrics](./scoring-rubrics.md) — the decision framework for choosing the `llm_judge` method vs deterministic vs semantic.
- [Evaluation Principles](./evaluation-principles.md) — principle 7 ("the judge is a tool, not a court") in full.
- [Human Review](./human-review.md) — the calibration loop that keeps the judge honest.
- [Hallucination Risk](./hallucination-risk.md) — judge-level fluency bias and how it interacts with claim labeling.
- [Regression Evaluation](./regression-evaluation.md) — judge variance, judge-averaging, and the 2σ significance rule.
- [Groundedness](./groundedness.md) — the entailment judge used in the claim → chunk check.
