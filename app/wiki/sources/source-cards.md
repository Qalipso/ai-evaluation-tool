# Source Cards

Compact reference cards for every primary source used to back claims in this Wiki. Each card explains what the source is, what concepts it contributes, and where those concepts land in the tool. Sources are paraphrased; no quote is longer than one sentence.

If a URL is unreachable when you visit it, the source ID is still resolvable from arXiv, NIST, or the project's official repository.

---

## Stanford HELM

- ID: `helm`
- Type: research framework + benchmark
- URL: https://crfm.stanford.edu/helm/
- Used for: `evaluation-principles`, `scoring-rubrics`

Key ideas (paraphrased):
- A single accuracy number hides catastrophic failures on other axes.
- LLMs should be evaluated on multiple dimensions in parallel: accuracy, calibration, robustness, fairness, bias, toxicity, efficiency.
- Benchmarks should be transparent: every scenario, metric, and model output should be inspectable.

Applied in this tool:
- Justifies the rule that the tool never displays an overall score without the per-dimension breakdown that produced it.
- Justifies the rubric's reference dimensions (accuracy, hallucination risk, groundedness, tone fit, consistency, actionability) being scored separately, not collapsed into one number.

---

## OpenAI Evals

- ID: `openai-evals`
- Type: official framework + documentation
- URL: https://github.com/openai/evals
- Used for: `start-here`, `evaluation-principles`, `scoring-rubrics`, `regression-evaluation`, `evaluation-reports`

Key ideas:
- Evals are first-class artifacts: a dataset, a runner, and one or more graders.
- Graders can be deterministic (string match, JSON schema), model-graded (LLM-as-judge), or human.
- Repeated evaluation across versions is how you detect drift; the dataset and grader configuration must be pinned for the comparison to mean anything.

Applied in this tool:
- Maps directly to the tool's three scoring methods (deterministic, semantic similarity, LLM-as-judge, plus human).
- Justifies the rule that a stored run is immutable and that comparison runs must reuse the same dataset and rubric version.
- Justifies the "evaluation is a first-class workflow, not a script" framing in `start-here`.

---

## Anthropic Evaluation Documentation

- ID: `anthropic-evals`
- Type: official documentation
- URL: https://docs.claude.com/en/docs/test-and-evaluate/develop-tests and https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/define-success
- Used for: `start-here`, `evaluation-principles`, `scoring-rubrics`

Key ideas:
- Define success criteria before iterating on prompts; otherwise prompt engineering is hill-climbing toward an undefined target.
- Build the eval first, then optimize against it. Without an eval, "better" is rationalization.
- Success criteria should be specific, measurable, and ideally automatable, with human review reserved for what cannot be automated.

Applied in this tool:
- Justifies the rule that a rubric must exist before an output is scored.
- Justifies the tool's refusal to evaluate prompts directly: prompt iteration is PromptOps, not evaluation.
- Justifies the "good evaluation vs bad evaluation" table in `start-here`.

---

## LangSmith Evaluation Concepts

- ID: `langsmith`
- Type: official documentation
- URL: https://docs.smith.langchain.com/evaluation/concepts
- Used for: `start-here`, `regression-evaluation`, `evaluation-reports`

Key ideas:
- Evaluations have three primitives: dataset, evaluator, run.
- Offline evaluation runs on a held-out dataset against a frozen rubric; online evaluation observes production traces.
- Comparing two runs requires identical datasets and identical evaluators, or the comparison reports two different experiments, not a regression.

Applied in this tool:
- Maps to the tool's Project → Rubric → Case → Run → Review → Report path.
- Justifies the same-dataset / same-rubric rule for regression comparison.
- Justifies the report's "configuration appendix" section.

---

## G-Eval (NLG Evaluation with GPT-4)

- ID: `g-eval`
- Type: research paper (Liu et al., 2023)
- URL: https://arxiv.org/abs/2303.16634
- Used for: `scoring-rubrics`, `llm-as-judge`

Key ideas:
- A structured LLM-as-judge prompt with chain-of-thought reasoning produces scores that correlate better with humans than ad-hoc rating prompts.
- The judge should emit both a score and a rationale; the rationale is the actual evaluation, the score is its summary.
- LLM judges still systematically over-rate fluent outputs and need calibration against human scores.

Applied in this tool:
- Justifies the rule that every LLM-judge output must include `score`, `rationale`, and (where applicable) evidence.
- Justifies the "judge prompt conventions" section in `llm-as-judge`.
- Justifies the calibration log requirement.

---

## MT-Bench / Chatbot Arena ("Judging LLM-as-a-Judge")

- ID: `mt-bench-judge`
- Type: research paper (Zheng et al., 2023)
- URL: https://arxiv.org/abs/2306.05685
- Used for: `llm-as-judge`, `human-review`, `evaluation-principles`

Key ideas:
- LLM judges show measurable position bias (favor first or last option in a pairwise comparison) and verbosity bias (favor longer responses).
- Self-enhancement bias: a judge from the same model family as the model under test rates that model higher.
- LLM judges roughly agree with crowd humans at ~80% for strong models, but disagreement clusters in interpretable failure modes — not noise.

Applied in this tool:
- Justifies the explicit list of judge failure modes in `llm-as-judge` (position bias, verbosity bias, self-preference, sycophancy).
- Justifies the recommendation to use a judge from a different model family than the model under test.
- Justifies the role of human review as ground truth for ambiguous or high-stakes cases.

---

## LLM-as-a-Judge Survey

- ID: `llm-judge-survey`
- Type: survey paper (Gu et al., 2024)
- URL: https://arxiv.org/abs/2411.15594
- Used for: `llm-as-judge`, `evaluation-principles`

Key ideas:
- LLM-as-judge spans pointwise (score one output), pairwise (compare two), and listwise (rank a set) modes; failure modes differ per mode.
- Meta-evaluation — judging the judge — is necessary; correlation with humans must be measured on a calibration set per dimension.
- Calibration drift over time is real; judges that worked last quarter may not work this quarter without re-checking.

Applied in this tool:
- Justifies the rule that LLM judges must be calibrated against humans on a rolling basis.
- Justifies treating the LLM judge as a tool, not a court (Principle 7 in `evaluation-principles`).
- Justifies the calibration view and the drift alert in `human-review`.

---

## RAGAS

- ID: `ragas`
- Type: open-source framework + paper (Es et al., 2023)
- URL: https://arxiv.org/abs/2309.15217 / https://docs.ragas.io
- Used for: `groundedness`, `scoring-rubrics`

Key ideas:
- A RAG output has four practical evaluation dimensions: faithfulness (claims supported by context), answer relevancy (output addresses the question), context precision (retrieved chunks are on-topic), context recall (retrieval covers what was needed).
- These dimensions are diagnostic: a low score on one tells the team which layer to fix (retriever vs generator).
- Evaluation should not collapse the RAG stack into one number; it should expose where the failure lives.

Applied in this tool:
- Justifies the separation between `groundedness_score`, `chunks_used / chunks_retrieved` utilization, and the hallucination layer.
- Justifies the rule that groundedness is about the answer, retrieval quality is about the retriever, and the two must be reported separately.
- Justifies the `context_relevance` dimension in the RAG starter rubric.

---

## ARES

- ID: `ares`
- Type: research paper (Saad-Falcon et al., 2023)
- URL: https://arxiv.org/abs/2311.09476
- Used for: `groundedness`

Key ideas:
- A small set of human-annotated examples is enough to train a lightweight RAG judge that approximates GPT-4-class judges at a fraction of the cost.
- Evaluation should cover context relevance, answer faithfulness, and answer relevance — the same three axes that show up in TruLens's RAG triad.
- Confidence intervals on judge scores matter: a single judge run on a single example is a point estimate, not a verdict.

Applied in this tool:
- Justifies the structure of the groundedness pipeline (claim → chunk → entailment, with confidence).
- Justifies the "low confidence run" advisory: aggregated scores without confidence are misleading.
- Justifies offering judge-averaging (N samples) as a variance-reduction strategy.

---

## TruLens RAG Triad

- ID: `trulens-triad`
- Type: open-source framework documentation
- URL: https://www.trulens.org/getting_started/core_concepts/rag_triad/
- Used for: `groundedness`

Key ideas:
- A RAG system has three failure surfaces, each a different question:
  - context relevance: is the retrieved context relevant to the query?
  - groundedness: is the answer supported by the context?
  - answer relevance: does the answer address the query?
- A pipeline can fail any of the three independently. Diagnosing where the failure lives requires measuring all three.

Applied in this tool:
- Justifies the three-way split in the groundedness layer: claim support, chunk utilization, and answer relevance.
- Justifies surfacing `chunks_used / chunks_retrieved` as a retrieval-quality signal even when groundedness is high.

---

## FActScore

- ID: `factscore`
- Type: research paper (Min et al., 2023)
- URL: https://arxiv.org/abs/2305.14251
- Used for: `hallucination-risk`, `groundedness`

Key ideas:
- Long-form factuality should be measured at the atomic claim level, not at the document level.
- Each atomic claim is checked against a source; the score is the fraction of claims that are supported.
- A claim being "supported" by a source is a well-defined entailment question; "the output sounds correct" is not.

Applied in this tool:
- Justifies the claim extraction pipeline and the four-label system (`supported`, `partially_supported`, `unsupported`, `contradicted`).
- Justifies the per-claim evidence requirement in the report's hallucination summary.
- Justifies the rule that a citation must be checked against the cited chunk, not assumed.

---

## TruthfulQA

- ID: `truthfulqa`
- Type: benchmark + paper (Lin et al., 2021)
- URL: https://arxiv.org/abs/2109.07958
- Used for: `hallucination-risk`

Key ideas:
- Models reproduce common misconceptions from their training data; "imitative falsehoods" are a separate failure class from random invention.
- Larger models can be more truthful on average but also more confidently wrong on the misconceptions they did absorb.
- Truthfulness and informativeness can trade against each other; a hedged "I do not know" is not the same as a confident wrong answer.

Applied in this tool:
- Justifies the "false confidence" hallucination flavor as distinct from "invented fact".
- Justifies the rule that detected abstentions are tracked separately, not assumed to be stable.

---

## SelfCheckGPT

- ID: `selfcheckgpt`
- Type: research paper (Manakul et al., 2023)
- URL: https://arxiv.org/abs/2303.08896
- Used for: `hallucination-risk`

Key ideas:
- Hallucinations can be detected black-box (no access to model internals) by sampling the model multiple times for the same input and measuring inconsistency.
- High inconsistency across samples is a hallucination signal: the model does not have a stable belief.
- This signal is complementary to evidence-based checks; together they cover more failure modes.

Applied in this tool:
- Supports the advisory-only "low confidence run" flag when judge-averaging (N samples) produces high variance per case.
- Justifies routing high-variance cases to the human review queue.

---

## IFEval

- ID: `ifeval`
- Type: benchmark + paper (Zhou et al., 2023)
- URL: https://arxiv.org/abs/2311.07911
- Used for: `scoring-rubrics`, `regression-evaluation`

Key ideas:
- Many instruction-following requirements are verifiable: word counts, banned-word lists, mandatory keywords, JSON schema, formatting, length bounds.
- Verifiable requirements should be checked by code, not by an LLM judge — both for cost and for noise.
- Combining deterministic verifiable checks with LLM-judge subjective checks gives a more honest score than either alone.

Applied in this tool:
- Justifies the "deterministic" scoring method and its recommended use cases (JSON shape, required keywords, length bounds, banned-word lists).
- Justifies the rule that an LLM judge is the wrong method for deterministic dimensions.

---

## NIST AI Risk Management Framework / GenAI Profile

- ID: `nist-ai-rmf`
- Type: standard / framework
- URL: https://www.nist.gov/itl/ai-risk-management-framework and https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- Used for: `evaluation-principles`, `human-review`, `evaluation-reports`

Key ideas:
- AI risk management has four functions: govern, map, measure, manage. Evaluation is the "measure" function; without it the others are aspirational.
- Trustworthy AI requires evidence: explanations, documentation, and traceability of how a system behaves and why.
- Red-teaming and adversarial evaluation are part of the GenAI profile: a system that has not been probed for failure modes has not been measured.

Applied in this tool:
- Justifies the principle that safety findings are a gate, not a weighted dimension.
- Justifies the rule that reports are evidence artifacts: timestamped, reproducible, immutable.
- Justifies the human review queue's priority on open safety findings.

---

## OWASP Top 10 for LLM Applications

- ID: `owasp-llm-top10`
- Type: industry standard / threat taxonomy
- URL: https://genai.owasp.org/llm-top-10/
- Used for: `human-review`, `evaluation-principles`

Key ideas:
- LLM applications face a recurring set of risks, including: prompt injection, sensitive information disclosure, insecure output handling, excessive agency, system prompt leakage, supply-chain attacks on training data.
- Each risk needs a specific control: input/output filters, scoped tool access, data minimization, output validation.
- These risks are categorical, not numerical; averaging them into a quality score hides them.

Applied in this tool:
- Justifies the safety layer as separate from the quality dimensions.
- Justifies treating PII leakage, false confirmation, and prompt injection as gate conditions, not weights.
- Informs the categories used in the safety findings section of reports.

---

## MITRE ATLAS

- ID: `mitre-atlas`
- Type: standard / threat knowledge base
- URL: https://atlas.mitre.org/
- Used for: `human-review`, `evaluation-principles`

Key ideas:
- ATLAS catalogs real-world adversarial tactics against AI systems: evasion, model extraction, prompt injection, training-data poisoning, model denial-of-service.
- Tactics are grouped into ATT&CK-style chains so defenders can reason about end-to-end attacks, not isolated incidents.
- Adversarial evaluation should be intentional: tests should target specific tactics, not be a free-form red team.

Applied in this tool:
- Informs the advisory recommendation to run adversarial cases against safety dimensions, not only nominal cases.
- Justifies treating adversarial findings (e.g. a prompt injection that succeeds in the eval) as gate-blocking, not score-affecting.

---

## How to cite a new source

When adding a source, create a new card here with:

- ID (kebab-case, stable; used as `id` in `lib/wikiSources.ts`).
- Type: paper / official docs / standard / framework / benchmark.
- URL (primary source, not a blog).
- Used for: list of Wiki slugs.
- Key ideas: 3 paraphrased bullets; no direct quotes longer than 15 words.
- Applied in this tool: 2–3 bullets connecting the source to specific product behavior.

If a source cannot be located or its claim cannot be verified, mark it `Needs verification` in the card and leave it out of `lib/wikiSources.ts` until checked.
