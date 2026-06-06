# Roadmap — AI Evaluation Tool

Versioning here is a product roadmap, not a release schedule. Each band describes a coherent capability bundle.

---

## MVP — "An honest score, with evidence"

**Goal:** A user can evaluate a single AI output against a structured rubric, get a per-dimension score breakdown, see hallucinated claims, and export a markdown report.

### In scope

- **Rubric Builder** with 14 reference dimensions (10 core: accuracy, relevance, completeness, task completion, hallucination risk, groundedness, safety, consistency, tone fit, actionability — plus 4 extended: helpfulness, emotional nuance, non-judgmental tone, useful next step).
- **Evaluation Runner** — single case and assisted batch runs.
- **Scoring Engine** with five methods: deterministic, semantic similarity, LLM-as-judge, claim pipeline, human.
- **Hallucination Heat Map** at span level over the AI output.
- **Groundedness Audit** when retrieved context is supplied.
- **Safety Layer** — implemented checks: PII, false-confirmation, booking-requires-calendar-write, language-match, manager-handoff, output-length. (General policy/toxicity/self-harm classifiers remain roadmap.)
- **Evaluation Report** as exportable markdown / plain text.
- **Results Storage** in Supabase (PostgreSQL); read-only mock fallback when env absent.
- **5 project profiles** with starter rubrics: Shadow daily reflection, RAG QA, booking assistant, customer support, AI planner.
- **In-product wiki** that documents the evaluation philosophy and how to use the tool responsibly.

### Out of scope for MVP

- Authentication or multi-tenant.
- Production traffic ingestion.
- A live dashboard with auto-refresh.
- Cross-model arena comparison.
- LLM judge auto-calibration.
- Real-time / streaming evaluation.

### What "MVP done" looks like

- A user can complete every flow in `product-brief.md § 7 Flow A` without writing code.
- A run produces a report a non-engineer can read.
- Re-running the same case against the same rubric produces a comparable report. Numeric LLM-judge variance is acknowledged and reported, not hidden.
- The wiki is complete and surfaced in-product.

---

## V1 — "Compare runs and trust the verdict"

**Goal:** A team can compare two runs (e.g. before and after a model swap) and trust the regression verdict.

### Capabilities

> Several V1 items are already shipped — marked ✅ below.

- ✅ **Assisted batch runner** — generate questions from a rubric, generate candidate answers, evaluate as one multi-case run.
- ✅ **Dataset Manager** (`/datasets`) — save, version, and reuse evaluation datasets per project.
- ✅ **Regression Comparison** (`/compare`) — aggregate deltas, regressed/recovered cases, regression flag.
- ✅ **Human Review Queue** (`/review`) — priority by safety findings and judge uncertainty.
- ✅ **Override Store** — per-dimension override with required reason.
- **Judge Calibration Log** showing systematic human-vs-judge gaps over time. *(data captured; dashboard pending)*
- **Project Profiles** become editable, not just starter content.
- **Report templates** become themeable per project.
- **PDF export** in addition to markdown / plain text. *(not implemented)*

### Why this version is the credibility moment

V1 is the version where the tool stops being a single-case scorer and starts being an *evaluation system*. A team that adopts V1 will keep using it. A team that only sees the MVP may treat it as a novelty.

### What "V1 done" looks like

- Every release of a customer-facing AI feature attaches a V1 report.
- The review queue is worked, not abandoned.
- Calibration data shows the LLM judge drifting and the team responding.

---

## V2 — "Evaluation lives next to production"

**Goal:** Evaluation is no longer offline. Production traffic feeds evaluation. Evaluation drives dataset growth.

### Capabilities

- **Production trace import** from an observability backend. Sample traces become evaluation cases automatically.
- **Cross-model arena**: same dataset against multiple models, comparative report.
- **Dataset growth from traces.** Surfaced low-confidence production outputs are proposed as candidates for the dataset.
- **Active sampling.** The review queue prioritizes cases the judge is least confident on, growing a calibration set.
- **API access** for evaluation from CI / test suites.
- **Webhook reports.** A passing or failing run can notify Slack / a deploy bot.
- **Custom dimension types** beyond the 14 reference dimensions, with shareable definitions.

### What "V2 done" looks like

- The dataset for each project grows weekly from production traces, with reviewer input.
- A model swap can be evaluated overnight, with a Slack-ready summary by morning.
- The tool runs in CI for AI-impacting code changes.

---

## Future — Beyond V2

These are valuable, expensive, and require V2 in place first. Listed to keep direction visible, not to commit.

### Streaming evaluation

Score outputs as they are produced, with a soft-real-time view. Useful for staging environments under load test.

### Evaluator-of-evaluators

A meta-evaluator that scores LLM judges against the human-override log. Continuous bias monitoring with alerts.

### Red-team rubric library

Curated adversarial datasets and rubrics per failure pattern (jailbreaks, prompt injection, PII leakage, refusal calibration). Bundled with the tool.

### Multi-modal evaluation

Image, audio, and video output evaluation. Requires non-trivial extensions in the input layer and the claim extractor.

### Team-grade collaboration

Comment threads on cases. Review assignments. SLAs on the review queue. Audit reports for compliance teams.

### Cross-project meta-views

A leadership view that aggregates quality across all projects, with drill-down to the report level.

### Open rubric registry

A community / org-wide rubric library where teams share dimension definitions and reference test cases.

### Cost-aware judge routing

Each dimension is automatically routed to the cheapest judge that hits a target accuracy on a calibration set. Cost per evaluated case drops as the calibration set grows.

---

## Sequencing notes

- **MVP must not bundle V1 features.** Resisting "just add comparison" is the discipline that keeps the MVP shippable.
- **V1 is the version that proves the product.** If V1 ships without batch + comparison + review queue, the tool will be perceived as a calculator, not a platform.
- **V2 requires real production access.** Without it, V2 is a slide; with it, V2 is the durable version.
- **"Future" items should be re-evaluated before each version**, not promised on a calendar.

---

## What I will not do, ever

These belong in the roadmap to set expectations.

- Re-implement PromptOps inside this tool. The boundary stays.
- Auto-fine-tune from review data. Override data is logged; it is not training data without an explicit human decision.
- Replace human review with a more confident LLM judge. Judges get faster; humans stay decisive on safety.
- Score a single output across multiple rubrics into one "true" score. A score is always relative to a rubric version.

These are not "later" items. They are out.
