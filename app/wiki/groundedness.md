# Groundedness

How the tool decides whether an answer is supported by its retrieved context, and why "grounded" and "true" are different questions.

---

## 1. What groundedness means here

Groundedness is **faithfulness to the source material**. An output is grounded if every claim in it can be traced to a chunk in `retrieved_context`. It is **not** the same as truth: a grounded output can still be wrong if the source is wrong, and a true output can still be ungrounded if the model produced it from training data instead of the supplied context.

In a RAG product, ungroundedness is usually the bigger operational problem. Truth depends on the source corpus. Groundedness depends on the model. The tool focuses on what the team can control.

## 2. The three things the tool checks

For each evaluation case with `retrieved_context` supplied:

1. **Is every claim sourced?** Each atomic claim → at least one supporting chunk. Claims without one are *ungrounded*.
2. **Is the cited chunk actually supportive?** A claim that points to a chunk whose text does not say what the claim says is *misused*. Misuse is worse than no citation; it creates false confidence.
3. **Was the supplied context used?** A retrieval that pulled five chunks and the model ignored four of them is a *retrieval quality* signal, even if the answer was fine. The tool reports unused-chunk counts.

The three findings are separate metrics. A team that confuses them will optimize the wrong layer.

## 3. The metric

The groundedness dimension produces:

- `claims_total`
- `claims_supported`
- `claims_unsupported`
- `claims_misused` (the cited chunk does not actually support)
- `chunks_used` / `chunks_retrieved` (utilization)
- `groundedness_score` (0–100)

The score formula penalizes misuse more than unsupported claims, because misuse signals false trust:

```
groundedness_score =
    100 * (supported - 2 * misused) / claims_total,
    clamped to [0, 100].
```

The penalty constant (default 2) is configurable per project.

## 4. Procedure (how the tool computes this)

1. Run claim extraction on `ai_output`. (Same extracted claim set as the hallucination layer — invariant.)
2. For each claim, score each context chunk for semantic match.
3. For chunks where the model explicitly cited a source (e.g. `[1]`, `[doc-id]`), check the *actual* support score of the cited chunk, not the highest-matching chunk. This is the misuse check.
4. Compute the metrics above. Build the claim → source map for the UI.

## 5. What "supported" means in practice

A claim is `supported` by a chunk if the chunk *contains the information needed to entail the claim*. This is not the same as keyword overlap. Examples:

| Claim | Chunk text | Supported? |
|---|---|---|
| "The customer canceled on 2024-03-14." | "Order #4521 was canceled by the customer on March 14, 2024." | Yes |
| "The customer canceled in March." | "Cancellations spiked in Q1." | No — vague, no specific customer. |
| "The customer canceled because of pricing." | "The customer canceled on March 14, 2024." | No — reason not in source. |
| "The customer did not cancel." | "Order #4521 was canceled by the customer on March 14, 2024." | Contradicted. |

The judge is prompted with both the claim and the chunk and asked: "does the chunk entail the claim?" — not "are the words similar?".

## 6. Common failure patterns

The tool surfaces these patterns in reports because they recur.

- **Stitched facts.** Two true claims from two chunks combined into a third claim that neither chunk supports. Example: chunk A says "the API is rate-limited", chunk B says "rate limits apply to /v3"; the model outputs "the /v3 API is rate-limited to 100 RPS". Neither chunk gave 100 RPS.
- **Generalized particulars.** A chunk reports one instance; the model generalizes to a rule. "User X had a refund" → "Refunds are common".
- **Citation drift.** The model produces text that paraphrases chunk A but cites chunk B because B sounds more authoritative.
- **Ghost numbers.** A specific number appears in the output that does not appear in any chunk. Often invented to feel precise.
- **Reverse direction.** A chunk says "X reduces Y"; the output says "Y reduces X". Semantic match is high; entailment is wrong.

## 7. When groundedness should be weighted high

- **Documentation Q&A.** Users will copy-paste the answer; ungrounded claims become bug reports.
- **Compliance assistants.** Ungrounded claims are legal risk.
- **Internal knowledge-base bots.** False answers compound across the organization.
- **Medical / legal / financial assistants.** Ungrounded claims are not tolerable.

## 8. When groundedness is `N/A`

If the case has no `retrieved_context`, groundedness is reported as `N/A`. It is excluded from the overall score and from the report's groundedness section. The hallucination layer still runs (it uses the external knowledge fallback or simply labels claims `unsupported`), but groundedness is silent.

This separation matters because a generative-writing prompt (where there is no source corpus) is not "ungrounded"; it is "groundedness-irrelevant". Conflating them creates fake scores.

## 9. Groundedness vs. retrieval quality

Groundedness is a property of the **answer**. Retrieval quality is a property of the **retriever**. They are easy to confuse.

- A perfect retriever + a lazy model can score badly on groundedness (the answer ignored the chunks).
- A weak retriever + a careful model can score well on groundedness (the answer faithfully reflected the weak chunks — even though the chunks were not the right ones).

The tool surfaces both signals — `groundedness_score` and `chunks_used / chunks_retrieved`. Reading them together is how a team diagnoses where the problem lives.

## 10. What the tool does **not** do

- It does not validate the source corpus. If the corpus is wrong, the tool will mark a confidently wrong answer as grounded. Source-truth is upstream.
- It does not enforce citation style or format. Whether the model uses `[1]` or `(doc-3.md)` is out of scope.
- It does not penalize useful synthesis that integrates multiple chunks, as long as the integrated claims are entailed by the chunks. Synthesis is a feature; fabrication is not.
- It does not assume citations imply support. It checks them.

## 10a. The RAG triad in practice

TruLens's RAG triad gives a concrete decision matrix when a RAG output is unsatisfactory. The three questions to ask, in order:

1. **Is the context relevant to the query?** If retrieval returned chunks that are off-topic, the problem is upstream (chunker, embeddings, k, or index). The answer-side metrics are confounded.
2. **Is the answer grounded in the retrieved context?** If retrieval looks fine but the answer drifts into ungrounded territory, the problem is the generator (prompt, decoding, model behavior).
3. **Is the answer relevant to the query?** If context and grounding both look fine but the answer does not address the query, the prompt is failing to use the retrieved material — or the model is dodging.

The tool surfaces all three signals on the case page:

- `chunks_used / chunks_retrieved` and `chunks_relevant_to_query` → answers question 1.
- `groundedness_score` and the misuse breakdown → answers question 2.
- The `relevance` dimension score → answers question 3.

A team that reads only one of the three is diagnosing in the dark.

## 10b. RAGAS dimensions, mapped to this tool

For teams familiar with RAGAS, here is the mapping:

| RAGAS dimension | Tool surface |
|---|---|
| Faithfulness | `groundedness_score`; claim-level labels (`supported`, `partially_supported`, `unsupported`, `contradicted`). |
| Answer relevancy | Rubric `relevance` dimension (`llm_judge`, with a prompt that asks "does the answer address every part of the question?"). |
| Context precision | `chunks_used / chunks_retrieved` utilization, plus an upstream `context_relevance` dimension when configured. |
| Context recall | Not measured directly in V1 (requires a ground-truth-answer dataset); advisory recommendation to compare retrieved chunks against an oracle set during dataset construction. |

Naming is RAGAS's; the operational surface is this tool's. Teams that came from RAGAS should find the dimensions familiar.

## 11. A small worked example

Output:
> The customer canceled the subscription on 2024-03-14 [1]. The cancellation was due to pricing [2]. Customers often cancel in March.

`retrieved_context`:
- `[1]` "Order #4521 was canceled by the customer on March 14, 2024. Reason: not stated."
- `[2]` "Cancellations spiked in Q1 2024."

Tool output:
- Claim "canceled on 2024-03-14" → `supported` (chunk 1).
- Claim "due to pricing" → `misused` (cites chunk 2; chunk 2 does not give a reason).
- Claim "customers often cancel in March" → `partially_supported` (chunk 2 mentions Q1 cancellations; "March" is plausible but not specified).
- Groundedness score: with default penalty, ~17/100.
- Hallucination flavor: confabulated detail (pricing).
- Recommendation in report: investigate retrieval coverage for cancellation reasons; tighten prompt to prohibit unsupported reason inference.

That is the kind of report a team can act on. "Groundedness: 17" alone is not.

---

## Source-backed concepts

- **Three RAG failure surfaces, not one.** TruLens's RAG triad frames RAG evaluation as three separable questions: is the context relevant to the query, is the answer grounded in the context, and is the answer relevant to the query. Failing any one of the three is its own diagnostic. This Wiki adopts the same separation: groundedness is one axis, retrieval quality (`chunks_used / chunks_retrieved`) is another, and answer relevance is a third dimension in the rubric.
- **Faithfulness, answer relevancy, context precision, context recall.** RAGAS defines these four axes as the practical evaluation surface for a RAG system. The tool maps `groundedness_score` to faithfulness, treats the rubric's `relevance` dimension as answer relevancy, and surfaces retrieval-quality signals (utilization and unused chunks) as a proxy for precision and recall.
- **Atomic claim → cited chunk entailment, not keyword overlap.** FActScore measures whether a claim is entailed by a source, not whether the source contains overlapping keywords. The "supported / not supported" examples in this article (specifically the contrast between keyword match and actual entailment) follow that operational definition.
- **Citation correctness must be checked, not assumed.** ARES emphasizes that lightweight judges should explicitly verify that the cited source supports the cited claim, with a confidence interval, not a single boolean. The misuse check in this Wiki (the cited chunk does not actually support the claim) is the operational form: confidence is reported per claim, and high-misuse runs flag for review.
- **Variance and confidence intervals.** ARES additionally argues that a single judge call on a single case is a point estimate. The tool's optional judge-averaging (N samples per claim or per case) and the per-claim confidence value implement that practice.

## Applied in this tool

- The case page (`/cases/[id]`) shows each claim with: label, cited chunk (if any), supporting chunk (the one the tool selected as best), and confidence.
- The report's groundedness section shows `claims_supported / total`, `chunks_used / chunks_retrieved`, and a representative misuse example (the TruLens-style triad surfaced as evidence).
- The `groundedness_score` formula penalizes misuse 2× compared to unsupported claims, because misuse is the false-trust failure mode the RAGAS / ARES literature is built to catch.
- If a case has no `retrieved_context`, groundedness is reported as `N/A` and excluded from the overall score. This is the TruLens "context relevance is not always applicable" stance applied to scoring.

## Sources used

- TruLens RAG Triad — three RAG failure surfaces, separable diagnosis.
- RAGAS — faithfulness, answer relevancy, context precision/recall as separate axes.
- FActScore — claim-level entailment, atomic claim extraction.
- ARES — citation correctness check, confidence intervals on judge scores.

---

## Related topics

- [Hallucination Risk](./hallucination-risk.md) — the upstream layer; groundedness reuses the same atomic claim extraction.
- [Scoring Rubrics](./scoring-rubrics.md) — how `groundedness`, `citation_correctness`, and `context_relevance` appear in the RAG starter rubric.
- [LLM-as-Judge](./llm-as-judge.md) — how the entailment judge is structured and calibrated.
- [Human Review](./human-review.md) — how misuse findings are routed to review.
- [Evaluation Reports](./evaluation-reports.md) — how the groundedness summary is rendered in the report.
