# Hallucination Risk

A practical operating definition of hallucination, the way this tool detects it, and what teams should do with the findings.

---

## 1. Working definition

A **hallucination** is a claim in the output that is false, invented, or unsupported by what the model could have known.

Three flavors that this tool tracks separately:

| Flavor | Description | Example |
|---|---|---|
| **Invented fact** | A claim that is not true in the world | "The Eiffel Tower is in Berlin." |
| **Confabulated detail** | A plausible-looking detail that the model fabricated | "The API endpoint is `/v3/users/list`" when the real endpoint is `/v2/users`. |
| **False confidence** | A real fact stated with certainty when the model could not have known | "The customer canceled at 14:32" when the model had no timestamp source. |

"Hallucination" without one of these flavors is too vague to act on. The tool always carries a flavor in the label.

## 2. Labels the tool assigns

Per atomic claim extracted from the output:

| Label | Meaning |
|---|---|
| `supported` | The claim is backed by either retrieved context or, via the optional external knowledge layer, a configured source. |
| `partially_supported` | Part of the claim is supported, part is added by the model. Common with mixed citations. |
| `unsupported` | No source backs the claim. The model could not have justifiably known it from inputs. |
| `contradicted` | The retrieved context says the opposite. This is the most severe label. |

A claim's `confidence` (0–1) is how sure the source matcher is of the label. Low confidence → enters the human review queue automatically.

## 3. Pipeline (how the tool gets there)

1. **Claim extraction.** The output is split into atomic claims. "Atomic" means: one subject, one predicate, one truth value. Multi-clause sentences are split.
2. **Search.** Each claim is compared against every chunk of `retrieved_context` for support or contradiction.
3. **External fallback.** If no context match and an external source is configured, the tool checks it. Without a configured source, the claim is `unsupported` by definition.
4. **Label + confidence.** The label is assigned with a confidence value derived from the match score.
5. **Aggregation.** The hallucination dimension score is computed from the distribution, weighted by severity (contradicted > unsupported > partially > supported).

## 4. What teams misread

These are the recurring traps the tool is built to prevent.

- **"The model cited a source, so it is grounded."** A citation is a string. The tool checks whether the cited chunk actually supports the claim. A misused citation is worse than no citation; it is a false signal.
- **"The output sounds right, so it is right."** Fluency is uncorrelated with truth. The tool's heat map exists to break this correlation.
- **"We checked the first sentence; the rest is probably fine."** Hallucinations cluster at the end of outputs (the model runs out of context and improvises). The tool always evaluates the full output.
- **"It said 'I do not know' once, so it would say so when it does not know."** Models do not have stable abstention behavior. Detected abstentions are tracked separately, not assumed.
- **"The judge said it is fine."** A single judge call is exactly the failure mode that produced the hallucination in the first place. The tool requires claim-level evidence.

## 5. When hallucination risk matters most

Some product shapes are more vulnerable than others. The tool's project profiles weight hallucination risk accordingly.

| Product | Hallucination risk weight | Why |
|---|---|---|
| RAG QA | Highest | Users expect citations to be true. False citations destroy trust. |
| AI planner | High | A plan built on invented tools or facts wastes downstream effort. |
| Code generation | High | Invented APIs or arguments break at compile / runtime. |
| Customer support | High | False confirmations create regulatory and PR risk. |
| Generative writing | Medium | Style matters more, but invented facts in named entities still matter. |
| Classification | Low | Output space is closed; hallucination shows up as misclassification instead. |

## 6. Severity model

The default severity is:

- `contradicted` × `high-impact-claim` → critical.
- `unsupported` × `high-impact-claim` → high.
- `partially_supported` × `high-impact-claim` → medium.
- Anything on a `low-impact-claim` (e.g. stylistic filler) → low.

"High impact" is defined per project profile. For a booking assistant, names of services, dates, times, and prices are high impact; opening greetings are not. The tool ships with reasonable defaults per profile; teams adjust them.

## 7. Confidence reporting

Every claim label carries a confidence value. The aggregated dimension score is *not* the only output; the tool also surfaces:

- Number of claims at each label.
- Average confidence per label.
- Lowest-confidence claims (these become high-priority review items).

A run where the average confidence is low is not a passing run, even if the labels happened to come out favorable. The tool emits a "low confidence run" advisory.

## 8. What the tool does **not** claim about hallucination

- It does not claim to detect all hallucinations. Plausible inventions matching the model's prior may pass.
- It does not claim ground truth. It claims auditable evidence.
- It does not assume the retrieved context is correct. If `retrieved_context` itself is wrong, claims supported by it are still labeled `supported`. The tool measures faithfulness to source, not truth in the world. Source quality is a separate concern handled by upstream RAG evaluation.

This last point is important. The tool's hallucination layer answers: "did the model invent something it did not have a basis for?" It does not answer: "is what the model said true?" The latter requires a ground-truth oracle that, by definition, the tool does not have. Teams that need world-truth verification must layer it on top.

## 8a. Atomic claim extraction in practice

FActScore frames the problem precisely: a long-form output is decomposed into atomic claims, each of which can be checked independently. The tool's claim extractor follows the same recipe:

- One subject, one predicate, one truth value per claim. "The customer canceled on 2024-03-14 due to pricing" is two claims: cancellation date, and reason.
- Compound sentences split. "The API is rate-limited to 100 RPS and supports OAuth" → two claims.
- Modifiers preserved with their claim. "The customer canceled in March" is *not* the same claim as "the customer canceled in 2024".
- Hedging is kept verbatim. "It is likely the customer canceled" is a claim about likelihood, not about the cancellation itself.

The result is a list of small claims that can each be labeled `supported / partial / unsupported / contradicted`. Aggregation by document is straightforward; aggregation by case requires only that the labels are correct.

Why this matters: a single judge call on the whole output can rate it "looks fine" while three of its claims are unsupported. Atomic extraction makes the failure local and the evidence concrete.

## 8b. The variance signal (SelfCheckGPT-style)

A complementary signal to evidence-based hallucination detection: if the model answers the same question multiple times and produces inconsistent claims, the model does not have a stable belief — even if any single answer looks plausible.

The tool exposes this two ways:

- **Judge averaging variance.** When the LLM judge runs N times per claim, the variance across runs is reported. High variance on the same claim label indicates the judge is on the fence.
- **Output-level resampling (advisory).** A V2 feature: resample the model under test N times for high-stakes cases and check claim consistency across samples. Inconsistent claims are flagged for review even if each sample's claims look individually supported.

Variance is not a hallucination label by itself. It is a confidence signal that downgrades trust in the label assigned. Combined with FActScore-style evidence checks, it covers more failure modes than either alone.

## 9. How teams should use the findings

- **Per release.** Look at the hallucination dimension distribution. A widening tail is a sign of regression.
- **Per case.** Use the heat map. A red-dense output is a model improvising under context pressure; investigate retrieval coverage.
- **Per pattern.** Use the failing-case list in the report. Patterns ("the model invents IDs") signal upstream changes (prompt update, retrieval index, model swap).
- **Per reviewer.** Use the human review queue. Low-confidence labels are the calibration set.

A team that uses hallucination findings only to file individual incidents has missed the point. The signal is the *distribution*, not the anecdote.

---

## Source-backed concepts

- **Atomic claims, not document-level scores.** FActScore measures long-form factuality by extracting atomic claims and checking each against a source. The score is the fraction of claims that are supported, not a single document rating. The four-label system in this Wiki (`supported`, `partially_supported`, `unsupported`, `contradicted`) is the direct operational form of that approach.
- **Imitative falsehoods are a distinct failure class.** TruthfulQA shows that models can reproduce common misconceptions from their training data; these errors are not random invention but high-confidence reproduction of plausible-sounding falsehoods. The "false confidence" hallucination flavor in this article exists to capture that class separately from "invented fact".
- **Consistency-based detection complements evidence-based detection.** SelfCheckGPT shows that sampling the model multiple times for the same input and measuring inconsistency is itself a hallucination signal. The tool surfaces this via judge-averaging variance: a case with high variance across N judge samples is flagged "low confidence", regardless of the mean.
- **The judge over-rates fluent outputs.** The MT-Bench / Chatbot Arena judge paper documents that LLM judges score fluent, confident-sounding outputs higher than awkward truth. The rule that hallucination scoring requires claim-level evidence (not a single judge call) is a response to that bias.

## Applied in this tool

- The case page (`/cases/[id]`) labels every atomic claim as `supported`, `partially_supported`, `unsupported`, or `contradicted`. The label carries a confidence value; low confidence routes the case to `/review`.
- The hallucination summary in any report shows the distribution across labels — the FActScore-style "fraction supported" view, not a single score.
- The "low confidence run" advisory on a run page fires when judge variance across N samples exceeds a configurable threshold (SelfCheckGPT-style signal).
- The "false confidence" flavor is surfaced explicitly in case labels and report failing-case sections, distinct from "invented fact".

## Sources used

- FActScore — atomic claims, claim-level support labels, per-claim evidence.
- TruthfulQA — imitative falsehoods and the "false confidence" failure class.
- SelfCheckGPT — sampling-based consistency as a hallucination signal.
- MT-Bench / Chatbot Arena judge paper — fluency bias in LLM judges.

---

## Related topics

- [Groundedness](./groundedness.md) — claim-level support against retrieved context (RAG case); the next step after generic hallucination labeling.
- [LLM-as-Judge](./llm-as-judge.md) — how the judge that labels claims is configured and calibrated.
- [Scoring Rubrics](./scoring-rubrics.md) — how the `hallucination_risk` dimension fits into a rubric and what weights are reasonable.
- [Human Review](./human-review.md) — how low-confidence claim labels become review queue items.
- [Regression Evaluation](./regression-evaluation.md) — how a widening hallucination tail across runs is detected as regression.
- [Evaluation Reports](./evaluation-reports.md) — how the hallucination summary is presented in the report.
