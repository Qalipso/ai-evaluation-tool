# Source → Wiki Map

Cross-reference between primary sources and the Wiki pages they back. Use this when adding a new claim: find the source first, then attach it here.

Each row answers: which Wiki page is this source backing, what product concepts does it support, and what tradeoffs or caveats matter when invoking it.

---

## Master map

| Source | Wiki pages | Product concepts supported | Notes |
|---|---|---|---|
| Stanford HELM | `evaluation-principles`, `scoring-rubrics` | Multi-dimensional evaluation; no single global score; per-dimension thresholds | Use to justify the refusal to display an overall score without dimension breakdown. |
| OpenAI Evals | `start-here`, `evaluation-principles`, `scoring-rubrics`, `regression-evaluation`, `evaluation-reports` | Datasets + graders + runs as first-class artifacts; deterministic / model-graded / human graders; pinned configuration for comparison | Strongest source for "evaluation is a workflow, not a script". |
| Anthropic Evaluation Documentation | `start-here`, `evaluation-principles`, `scoring-rubrics` | Define success criteria before iterating; build the eval first; rubric as prior, score as posterior | Use to justify the rule that the rubric is created before scoring. |
| LangSmith Evaluation Concepts | `start-here`, `regression-evaluation`, `evaluation-reports` | Dataset / evaluator / run primitives; offline vs online evaluation; same-dataset rule for comparison | Use to ground the Project → Rubric → Case → Run → Review → Report workflow. |
| G-Eval | `scoring-rubrics`, `llm-as-judge` | Structured judge prompts; score + rationale; chain-of-thought reasoning in the judge | Use to justify the JSON judge response shape (`score`, `rationale`, `evidence`). |
| MT-Bench / Chatbot Arena judge paper | `llm-as-judge`, `human-review`, `evaluation-principles` | Position bias; verbosity / length bias; self-preference bias; human agreement is partial, not absolute | Strongest source for the "LLM-as-judge failure modes" list. |
| LLM-as-Judge survey | `llm-as-judge`, `evaluation-principles` | Pointwise / pairwise / listwise judge modes; meta-evaluation; rolling calibration | Use to justify the calibration loop and the drift alert. |
| RAGAS | `groundedness`, `scoring-rubrics` | Faithfulness, answer relevancy, context precision, context recall as separate dimensions | Use to justify treating retrieval quality and answer faithfulness as different metrics. |
| ARES | `groundedness` | Lightweight RAG judges; confidence intervals on judge scores; small human-annotated calibration sets | Use to justify judge-averaging and the "low confidence run" advisory. |
| TruLens RAG Triad | `groundedness` | Three RAG failure surfaces: context relevance, groundedness, answer relevance | Use to explain why groundedness alone is not a complete RAG eval. |
| FActScore | `hallucination-risk`, `groundedness` | Atomic claim extraction; claim-level support labels; per-claim evidence | Strongest source for the four-label system (`supported`, `partially_supported`, `unsupported`, `contradicted`). |
| TruthfulQA | `hallucination-risk` | Imitative falsehoods; truthfulness vs informativeness tradeoff; confident wrongness | Use to justify the "false confidence" flavor of hallucination. |
| SelfCheckGPT | `hallucination-risk` | Consistency-based hallucination detection; sampling-based variance as a signal | Use to justify the "low confidence run" advisory and judge-averaging variance signal. |
| IFEval | `scoring-rubrics`, `regression-evaluation` | Verifiable instruction-following constraints; deterministic checks for measurable requirements | Strongest source for the "use deterministic checks where possible" rule. |
| NIST AI RMF / GenAI Profile | `evaluation-principles`, `human-review`, `evaluation-reports` | Govern / Map / Measure / Manage; evidence artifacts; red-teaming as part of measurement | Use to justify safety-as-gate, immutable reports, and the audit trail requirement. |
| OWASP Top 10 for LLM Applications | `human-review`, `evaluation-principles` | Prompt injection, sensitive info disclosure, insecure output handling, excessive agency, system prompt leakage | Use to justify the categories in safety findings and the gate logic for PII / false confirmation. |
| MITRE ATLAS | `human-review`, `evaluation-principles` | Adversarial tactics against AI systems; targeted red-teaming, not free-form probing | Use to justify intentional adversarial cases in the evaluation dataset. |

---

## Reverse map (Wiki page → sources)

For each Wiki page, the sources currently cited.

### start-here

- OpenAI Evals — overall workflow framing.
- LangSmith Evaluation Concepts — Project / Rubric / Case / Run / Review / Report primitives.
- Anthropic Evaluation Documentation — define success criteria before iterating.

### evaluation-principles

- Stanford HELM — multi-dimensional evaluation, no global score.
- OpenAI Evals — evaluation as an artifact.
- Anthropic Evaluation Documentation — rubric before output.
- NIST AI RMF — evaluation is the "measure" function; safety as evidence.
- MT-Bench judge paper — judges are not ground truth.
- LLM-as-Judge survey — calibration drift is real.

### scoring-rubrics

- Stanford HELM — separate dimensions, not collapsed.
- OpenAI Evals — deterministic / model-graded / human graders.
- IFEval — deterministic checks for verifiable constraints.
- G-Eval — structured LLM-judge prompts with rationale.
- RAGAS — separate dimensions for RAG-flavored rubric.
- Anthropic Evaluation Documentation — define dimensions before measuring.

### hallucination-risk

- FActScore — atomic claims, claim-level labels, evidence.
- TruthfulQA — imitative falsehoods and confident wrongness.
- SelfCheckGPT — sampling-based hallucination signal; variance as a flag.

### groundedness

- RAGAS — faithfulness, context precision, context recall.
- ARES — lightweight judges, confidence intervals.
- TruLens RAG Triad — three failure surfaces.
- FActScore — claim-level support; citation-vs-cited-chunk check.

### regression-evaluation

- OpenAI Evals — same dataset, same grader for comparison.
- LangSmith Evaluation Concepts — dataset / evaluator / run primitives; offline comparison.
- IFEval — deterministic checks reduce variance in regression deltas.

### llm-as-judge

- G-Eval — judge prompt structure.
- MT-Bench judge paper — position bias, verbosity bias, self-preference bias.
- LLM-as-Judge survey — meta-evaluation, calibration drift.

### human-review

- MT-Bench judge paper — LLM judge agreement with humans is partial.
- NIST AI RMF — human-in-the-loop for high-stakes; evidence required.
- OWASP Top 10 for LLM Applications — safety categories to prioritize in review.
- MITRE ATLAS — adversarial cases require targeted review.

### evaluation-reports

- OpenAI Evals — report artifact with pinned configuration.
- LangSmith Evaluation Concepts — report includes dataset, evaluator, run metadata.
- NIST AI RMF — reports are evidence; reproducible and immutable.

---

## Add a new source

When extending the map:

1. Add the source card in `source-cards.md`.
2. Add a row to the master map above, with Wiki pages + concepts + notes.
3. Add the source ID to the relevant page's reverse-map block.
4. Update `lib/wikiSources.ts` with the new source object.
5. Add the source ID to the affected articles' `sourceIds` in `lib/wiki.ts`.

If you cannot do all five, do not add the row. Half-added sources poison the map.
