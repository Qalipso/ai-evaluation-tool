# AI Evaluation Tool

**Evidence-backed quality control for LLM outputs.**

AI products should not ship because an answer "looks good".
This tool scores AI outputs against rubrics, checks claims against evidence, catches safety failures, and produces launch-ready evaluation reports.

> **Evaluate AI with evidence, not vibes.**

<p align="center">
  <img src="./docs/media/teaser15.gif" alt="AI Evaluation Tool cinematic teaser" width="100%" />
</p>

---

## Why this exists

LLM outputs are fluent by default.
That does not make them correct, safe, grounded, or ready for production.

A single confident answer can hide:

- an unsupported claim
- a hallucinated fact
- a false confirmation
- a broken business rule
- a safety issue
- a regression from the previous model or prompt version

**AI Evaluation Tool** turns subjective review into a measurable quality-control loop:

```txt
AI Output → Rubric → Claim Pipeline → Safety Gates → Verdict → Report
```

---

## What it does

AI Evaluation Tool helps answer one simple question:

> **Is this AI output good enough to ship?**

It evaluates outputs through multiple layers:

* **Rubric scoring** — define what "good" means for each use case
* **LLM judge** — score subjective dimensions like tone, helpfulness, and conversation quality
* **Claim pipeline** — extract factual claims and check them against retrieved evidence
* **Safety gates** — block high-risk failures before users see them
* **Human review** — inspect, override, and learn from edge cases
* **Reports** — export run summaries with scores, failures, rationales, and evidence

---

## Product film

The visual story of the product:

```txt
Confidence → Evidence → Gates → Verdict
```

| Stage              | What happens                                 |
| ------------------ | -------------------------------------------- |
| **Rubrics**        | Define the evaluation rules                  |
| **Claim Pipeline** | Break answers into claims and check evidence |
| **Safety Gates**   | Block failures that should never reach users |
| **Verdict**        | Decide whether the output is ship-ready      |

▶ [Watch the walkthrough film](./video/out/ai-eval-film.mp4)

---

## Rubric breakdown

Rubrics define what quality means for a specific AI use case.

<p align="center">
  <img src="./docs/media/ChartRubric.gif" alt="Rubric breakdown animation" width="100%" />
</p>

Example dimensions:

```txt
Accuracy
Conversation quality
Hallucination risk
Tone fit
Multilingual behavior
State management
Handoff intelligence
```

Each dimension can have:

* scoring method
* weight
* threshold
* rationale
* pass/fail behavior

This avoids the classic problem of judging AI output by vibes.

---

## Claim pipeline

Every confident answer is decomposed into claims.

<p align="center">
  <img src="./docs/media/ChartPipeline.gif" alt="Claim pipeline animation" width="100%" />
</p>

The claim pipeline checks whether each factual statement is:

```txt
SUPPORTED
PARTIAL
UNSUPPORTED
CONTRADICTED
```

This is the core idea:

> **Every claim needs proof.**

Instead of asking "does this answer sound good?", the system asks:

```txt
What did the AI claim?
Where is the evidence?
Is the claim supported?
Should this affect the verdict?
```

---

## Safety gates

Some failures should not be averaged into a score.
They should block the run.

<p align="center">
  <img src="./docs/media/ChartGates.gif" alt="Safety gates animation" width="100%" />
</p>

Safety gates can catch:

* PII exposure
* false confirmations
* prompt injection behavior
* unsupported pricing
* language mismatch
* policy violations
* unauthorized actions

A high average score should not hide a critical safety issue.

---

## Verdict score

Every evaluation run ends with a launch verdict.

<p align="center">
  <img src="./docs/media/ChartScore.gif" alt="Verdict score animation" width="100%" />
</p>

Example output:

```txt
Verdict: Ship-ready
Score: 0.94 / 1.0
Pass rate: 100%
Safety findings: 0
Claims processed: 9
```

Verdicts make evaluation actionable:

| Verdict      | Meaning                                       |
| ------------ | --------------------------------------------- |
| `ship-ready` | Output passed quality and safety requirements |
| `acceptable` | Good enough, but with minor review points     |
| `needs-work` | Quality issues require iteration              |
| `blocked`    | Critical safety or evidence failure           |

---

## How it works

```txt
Input
  ↓
Rubric Engine
  ↓
LLM Judge
  ↓
Claim Extraction
  ↓
Evidence Matching
  ↓
Deterministic Safety Checks
  ↓
Human Review
  ↓
Report Generator
```

### 1. Input

A test case includes:

```txt
user input
expected behavior
AI output
retrieved context
metadata
```

### 2. Rubric engine

The rubric defines dimensions, weights, thresholds, and scoring methods.

### 3. Scoring

The system can combine:

* LLM-as-judge scoring
* semantic checks
* deterministic safety checks
* claim-level groundedness checks
* human review

### 4. Aggregation

The run is aggregated into:

```txt
overall score
dimension scores
safety findings
claim verdicts
rationale
final launch verdict
```

### 5. Report

Each run can produce an exportable report for QA, product review, or prompt/model iteration.

---

## Example use case

### AreaMosa Assistant

A WhatsApp booking assistant replies:

```txt
"Your appointment is confirmed for 18:00."
```

But the evidence says:

```txt
No available calendar slot found at 18:00.
```

The evaluation catches:

```txt
False confirmation
Unsupported claim
Safety gate failure
Verdict: blocked
```

After the assistant is fixed, it asks a clarifying question, checks availability, and confirms only after evidence exists.

```txt
Verdict: ship-ready
```

---

## Quick start

```bash
git clone https://github.com/Qalipso/ai-evaluation-tool.git
cd ai-evaluation-tool/app
npm install
```

Create environment variables:

```bash
cp .env.local.example .env.local
```

Required for full live evaluation:

```bash
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Apply the migrations in the Supabase SQL editor:

```txt
supabase/migrations/0001_init.sql
supabase/migrations/0002_eval_settings.sql
supabase/migrations/0003_datasets.sql
```

Seed and run locally:

```bash
npm run seed
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Local demo mode

The app can be explored with demo/fallback data before connecting real providers.
When env is absent it falls back to bundled mock data (read-only).

Useful routes:

```txt
/                         Dashboard
/evaluators               Configure evaluators
/runs/new                 Start a new run
/datasets                 Versioned test sets
/reports                  Reports
/review                   Human review
/safety                   Safety layer
/wiki                     Evaluation knowledge base
```

---

## Tech stack

```txt
Next.js 15
React 19
TypeScript
Tailwind CSS
Supabase
OpenAI SDK
Zod
Vitest
```

---

## Project structure

```txt
app/
  src/
    app/                  Next.js routes
    lib/
      eval/               Evaluation engine
      evaluators/         Evaluator definitions
      llm/                LLM judge integration
      validation/         Zod schemas
      wiki/               Knowledge base utilities
    components/           UI components
    tests/                Unit tests
```

---

## Core concepts

### Rubric

A structured definition of quality.

```txt
dimension
weight
threshold
scoring method
rationale
```

### Claim

A factual statement extracted from an AI output.

```txt
"The appointment is confirmed for 18:00."
```

### Evidence

Retrieved context used to verify claims.

```txt
Calendar availability
Policy text
Source documents
Business rules
```

### Safety gate

A blocking rule for high-risk behavior.

```txt
false confirmation
PII exposure
prompt injection
unauthorized action
```

### Verdict

The final launch decision.

```txt
ship-ready
acceptable
needs-work
blocked
```

---

## Why not just use an LLM judge?

An LLM judge is useful, but it is not enough.

This tool combines multiple evaluation layers:

```txt
LLM judgment      → subjective quality
Claim checking    → factual grounding
Safety gates      → non-negotiable risk checks
Human review      → calibration and judgment
Reports           → repeatability and accountability
```

The goal is not just to produce a score.
The goal is to explain:

```txt
what passed
what failed
why it failed
whether it is safe to ship
what should be fixed next
```

---

## Roadmap

* [ ] Better run comparison
* [ ] Golden dataset support
* [ ] Judge calibration dashboard
* [ ] Prompt/model regression tracking
* [ ] More deterministic safety checks
* [ ] Video report generation from evaluation runs
* [ ] CI integration for AI output regression tests
* [ ] Public demo dataset
* [ ] More test coverage for scoring and reports

---

## Motion assets

Asset paths used in this README:

```txt
docs/media/teaser15.gif
docs/media/ChartRubric.gif
docs/media/ChartPipeline.gif
docs/media/ChartGates.gif
docs/media/ChartScore.gif
docs/media/teaser15.mp4
video/out/ai-eval-film.mp4
```

They explain the product flow visually:

```txt
Rubric → Claim Pipeline → Safety Gates → Verdict
```

---

## Development

Run tests:

```bash
npm run test
```

Run linting:

```bash
npm run lint
```

Build:

```bash
npm run build
```

---

## Security notes

Do not expose server-side keys to the browser.
Recommended checks before deploying publicly:

* keep `SUPABASE_SERVICE_ROLE_KEY` server-only
* review RLS policies
* avoid logging raw private user data
* redact sensitive input/output from reports when needed
* separate demo data from production data
* set `DEMO_ACCESS_CODE` + `DEMO_SESSION_SECRET` (auth gate on), `MAX_DAILY_LLM_USD=2`, and rotate keys before going live

---

## Documentation map

| File | Purpose |
|---|---|
| [`product-brief.md`](./product-brief.md) | Problem, users, JTBD, MVP scope, success metrics |
| [`behavior-spec.md`](./behavior-spec.md) | What the system does, does not do, and how it handles edge cases |
| [`architecture.md`](./architecture.md) | System layers + Mermaid diagram |
| [`roadmap.md`](./roadmap.md) | MVP / V1 / V2 / Future |
| [`acceptance-criteria.md`](./acceptance-criteria.md) | Pass/fail criteria for documentation, logic, and portfolio readiness |
| [`wiki/`](./wiki) | Practical evaluation knowledge base |
| [`diagrams/`](./diagrams) | Mermaid diagrams: pipeline, scoring, human review, regression |

---

## Positioning

```txt
AI Evaluation Tool is evidence-backed quality control for LLM outputs.
```

Short version:

```txt
Score it. Ground it. Gate it. Ship it.
```

Brand line:

```txt
Evaluate AI with evidence, not vibes.
```

---

## Author

Built by **Eduard Shatalov** as part of an AI automation / AI product engineering portfolio.
