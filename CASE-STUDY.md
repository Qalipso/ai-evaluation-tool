# Case Study — AI Evaluation Tool

A portfolio-grade walkthrough of how this product was scoped, the decisions behind it, and what success would look like in production.

---

## Problem

The honest state of AI quality assurance at most companies shipping LLM features in 2024–2025:

> "We reviewed 20 outputs in a Notion doc and they felt good. We shipped."

I mapped the failure modes across teams I observed and talked to:

1. **Quality is invisible.** There is no shared definition of "good." A PM thinks it means helpful. An engineer thinks it means factually correct. A reviewer thinks it means safe. They are all right but they are not measuring the same thing.
2. **Hallucinations slip through.** Fluent confident prose is the most dangerous kind of AI output: it reads well, it sounds authoritative, and it may be completely wrong. Reviewers without structured claims-vs-sources tooling miss them almost every time.
3. **Regressions are discovered by users.** A prompt change that improves relevance by 15% can silently degrade safety by 30%. Nobody runs a comparison. The regression surfaces as a support ticket.
4. **Eval results are ephemeral.** Last month's spreadsheet is in someone's Drive. This month's results are in a different format. You cannot compare them because no one kept the schema consistent.
5. **Human reviewers burn out.** Manual review is the entire QA strategy. It does not scale. Reviewers cycle through outputs without a rubric and their judgments drift. After a month of review-as-a-job, they are marking everything "acceptable."

The result: AI features ship with no honest quality signal. When something goes wrong, the team blames "the model" rather than the absence of measurement.

---

## Solution

A product that treats AI evaluation as an engineering discipline, not a vibe check.

Three core bets:

1. **Rubrics are first-class objects.** A rubric is a named, versioned collection of dimensions with weights. It can be templated, imported, and shared. When the rubric is the artifact, "what does quality mean for this product?" becomes a question with a durable, auditable answer.
2. **Groundedness is measured, not assumed.** For RAG use cases, the tool extracts claims from the AI output and matches them against source chunks. Each claim gets a label: supported, unsupported, or contradicted. The result is a heat map over the output, not a number.
3. **Runs are immutable.** A run is a snapshot: rubric version, inputs, outputs, scores, groundedness audit, human overrides. Stored as append-only. Comparing two runs is always possible, even months later.

The evaluation pipeline:

```
Input (case / batch / trace)
  → Rubric Engine (dimension weights, version pinned)
    → Scoring Engine (deterministic + semantic + LLM-as-judge)
    → Groundedness Audit (claim extraction + source matching)
    → Safety Layer (PII + false-confirmation + policy)
      → Human Review Queue (flag + override)
        → Report Generator (markdown / PDF)
          → Immutable Run Store
```

---

## User Flow

A typical evaluation cycle for an AI engineer on a RAG product:

1. **Open a project profile.** The engineer picks "RAG QA" from 5 starter profiles. The rubric loads with dimensions: accuracy, groundedness, completeness, relevance, hallucination risk.
2. **Adjust the rubric.** They reduce the weight on tone-fit (their use case is technical) and add a custom dimension for citation format. Save as `v2`.
3. **Run a batch evaluation.** They paste 12 (question, answer, context) tuples from production logs. The runner scores all 12 against the rubric in one job.
4. **Review groundedness.** Two answers have `hallucination_risk: high`. They click the heat map. Three claims are labeled `unsupported` — the answer referenced a version number that does not appear in any source chunk. They file a bug against the prompt.
5. **Human review the flagged cases.** Safety layer flagged one answer for a PII leak (an email address appeared in the response). They mark it `fail` and override the score.
6. **Export the report.** Markdown report with scores, groundedness audit, and human overrides. Attached to the release PR. Three weeks later, after a prompt change, they re-run the same batch and diff the reports.

---

## System Logic

### Why rubrics are versioned like code

The temptation is to make a rubric a configuration form that overwrites itself. Two problems: (1) you lose the ability to compare runs across rubric versions, and (2) teams drift — the rubric you used to approve last quarter's release may not be the one active today. Versioning makes the question "what were we measuring when we shipped this?" always answerable.

### Why three scoring methods instead of one

Deterministic checkers (regex, schema validation) are fast and cost-free. Semantic similarity catches paraphrase. LLM-as-judge handles nuanced dimensions (tone fit, actionability, completeness). Running all three and weighting by dimension is more accurate than any single method — and it makes the failure mode visible: if deterministic and LLM-judge disagree on a case, that case is interesting.

### Why groundedness needs claim-level resolution

A passage-level groundedness score ("does this answer seem to be based on the context?") is easy to game and hard to act on. A claim-level audit ("this specific claim is not supported by any retrieved chunk") tells the engineer exactly what to fix. Span-level labeling is the minimum resolution that makes the audit actionable.

### Why the report is append-only

Mutable eval results are untrustworthy. If a run's scores can be edited after the fact, they mean nothing as evidence. Append-only storage with human overrides as explicit events (not score edits) preserves the audit trail. The override event records who, when, and why.

### Why a human review queue, not just scores

LLM-as-judge is wrong on a predictable fraction of cases. Building a human queue is not a concession — it is the calibration surface. Over time, the cases where human judgment diverges from LLM-judge become the training signal for improving the judge. Without the queue, that signal is lost.

---

## Product Decisions

| Decision | Alternative considered | Why I chose this |
|----------|------------------------|------------------|
| Rubrics are versioned objects | Rubrics as a settings form | Enables run comparison; makes "what did we measure?" auditable |
| Claim-level groundedness, not passage-level | Passage similarity score | Claim-level is actionable; passage-level is just a number |
| Three scoring methods, weighted by dimension | One scoring method | Accuracy is higher; failure modes are visible |
| Immutable run store | Mutable scores | Append-only is the only model that survives a compliance review |
| Human review as a queue with events | Score override button | Events preserve the calibration signal for LLM-judge improvement |
| 5 project profiles (starter rubrics) | Generic blank rubric | Reduces time-to-first-useful-run from hours to minutes |
| In-product wiki (8 articles) | External docs | Eval methodology is opinionated; keeping it in-product reduces context switching |
| Mock data in production deploy | Empty state | A demo-ready tool is always more convincing than an empty state |

---

## Metrics

| Metric | Baseline (no eval tool) | Target |
|--------|-------------------------|--------|
| Time from "we need to evaluate this" to first structured report | 3–5 days | < 2 hours |
| % AI releases with documented eval results | < 20% | ≥ 90% |
| Hallucination detection rate (compared to expert human review) | N/A | ≥ 85% overlap |
| Time to detect a regression after a prompt change | Days to weeks | < 1 hour |
| Rubric consistency across reviewers (inter-rater agreement) | Low (no shared rubric) | ≥ 0.80 Cohen's kappa |

---

## What I Learned

- **A rubric is a product decision disguised as a configuration.** Asking a team to define what "good" means forces a conversation that most teams have never had. The rubric is where product, engineering, and trust & safety find shared language.
- **Groundedness audit is the most valuable thing the tool does.** Teams that have seen the claim-level heat map change how they review AI output — permanently. The first time you see "this claim is unsupported by any source" labeled in the output, you cannot un-see it.
- **Human review is not a fallback, it is the calibration loop.** LLM-as-judge is directionally good and occasionally wrong. The queue is how you find the wrong cases. The cases where the judge is wrong are the most interesting ones — they reveal where your rubric needs refinement.
- **Immutability is a trust feature, not a technical constraint.** When stakeholders know that eval results cannot be edited after the fact, they trust them more. The extra discipline of append-only + override events pays off in credibility.
- **Demo data is product strategy.** A tool that ships with realistic mock data (projects, runs, rubrics, reports) converts browsers faster than an empty state. For a portfolio tool, it is the difference between "I can see what this does" and "I have no idea what to do next."
