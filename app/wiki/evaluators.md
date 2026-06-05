# Evaluators: Methods That Actually Run

A rubric dimension is only as honest as the method behind it. This tool ships
four scoring methods. Three run automatically; one is human. Nothing is
fabricated — a dimension with no real scorer is left **unscored** and routed to
review, never filled with a placeholder number.

Configure and live-test all of them on the **Evaluators** page (`/evaluators`).

## 1. LLM judge (`llm_judge`, `semantic_similarity`)

GPT-as-evaluator. One structured call scores **every** LLM dimension of a rubric
at once (cheaper and lower-latency than one call per dimension), at temperature 0
for stability. Scores are returned 1–5 and normalized to 0–1, each with a cited
rationale.

- Configurable model (Evaluators page or per-run on `/runs/new`).
- Variance is real even at temperature 0 — treat a single run as one sample.

## 2. Claim pipeline (`claim_pipeline`)

Groundedness, done properly:

1. Extract every atomic factual claim from the AI output.
2. Classify each claim against the retrieved context — *supported*,
   *partially supported*, *unsupported*, or *contradicted* — with a confidence
   and the source chunk used.
3. Score = weighted fraction grounded. The extracted claims are **persisted** and
   drive the span-level heat map on the case page.

If the output makes no factual claims, nothing is ungrounded and the dimension
scores full marks.

## 3. Deterministic checks (`deterministic`)

Code, no LLM:

- **PII detection** — emails, phone-like, card-like, SSN-like patterns.
- **False-confirmation** — phrases that assert a completed action ("you're
  booked", "confirmed") with no backing system action.
- **Length / proportionality** heuristic against the expected behavior.

PII and false-confirmation detectors can be toggled on the Evaluators page and
also feed the safety gate.

## 4. Human (`human`)

No automated scorer exists, by design. Cases with `human` dimensions are marked
**pending** and appear in the **Human Review Queue**. A reviewer opens the case,
reads the input / expected / output / context, scores each human dimension with a
rationale, and submits — which persists the scores and recomputes the case
overall.

## Verdict and safety

Overall score is the weighted mean over **scored** dimensions only (weights are
renormalized when some dimensions are unscored). Safety gates are not averaged:
a critical PII or false-confirmation finding can block a run regardless of score.

## Where to go next

- **LLM-as-Judge** — failure modes and calibration of the judge.
- **Groundedness** — why claim verification matters for RAG.
- **Human Review** — how reviewer overrides calibrate the automated judge.
