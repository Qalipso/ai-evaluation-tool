# AI Evaluation — Wiki + Tool

> **Status: the evaluation engine is real and data flows end-to-end** (Next.js 15 + Supabase + OpenAI).

## Demo

<video src="https://github.com/Qalipso/ai-evaluation-tool/raw/main/video/out/ai-eval-film.mp4" controls width="100%"></video>

▶ [Watch the walkthrough](./video/out/ai-eval-film.mp4)

>

> **Live features:**
> - **Assisted batch runner** (`/runs/new`) — set a master prompt, let the rubric generate test questions, generate candidate answers with the chosen model, then evaluate all as one run (N cases). Per-run model selection (project default or override).
> - **Real scoring methods, no fabrication** — LLM-as-judge (one structured call), **claim pipeline** (atomic claim extraction + verification against context → groundedness; persisted claims drive the heat map), **real semantic cosine** (embeddings vs the expected behavior), and deterministic checks that are genuinely real: PII, false-confirmation, language-match, and cost-efficiency (conciseness). Dimensions with no real scorer (`human`, generic deterministic) are left **unscored**, never given a placeholder number.
> - **Evaluators hub** (`/evaluators`) — live, local pattern-based playground for the claim pipeline and deterministic checks: tool-trace editor, evidence sources, results tables, detail drawers, demo examples.
> - **Safety gates** — a finding whose category is listed in the rubric's safety gates **blocks the verdict** even at a high score. Text-detectable gates: `pii_leakage`, `false_confirmation`, `admin_data_leak_to_client`, `operator_command_from_client`, `prompt_injection_followed`, `unsupported_price_claim`. Calendar/booking gates need a tool trace (see the data-skeleton plan).
> - **Human review** (`/review/[case]`) and **inline scoring** — reviewers score `human` dimensions from the case text; the run page's **expandable dimension breakdown** shows per-case scores, judge rationales, and the claim/evidence chain, and lets you score human dimensions inline.
> - **Datasets** (`/datasets`) — versioned test sets. Save the questions a rubric generates as a dataset, then re-run it across model/prompt versions for apples-to-apples regression.
> - **Per-case run with progress** — the runner scores each case as a short request with a live progress bar (prod-timeout-safe), not one long action.
> - **Command palette** (`Cmd/Ctrl+K`) — search and jump across nav, projects, rubrics, runs, and cases. **Cost meter** in the top bar (today's LLM spend vs the daily cap) and a **recent-activity** bell.
> - **Demo auth gate** (opt-in) — public read by link, but evaluations/edits require a code at `/enter`; per-IP rate limit + server-side model whitelist + daily budget cap protect the cost surface.
> - **Input validation** — garbage outputs (keyboard mashing, repeats, mostly non-letters) are rejected before any LLM call.
> - **Reports** — structured `.txt` export per run; **theme toggle** (cream / dark), a macOS-style bottom dock, and a first-visit guided tour.
> - Persistence in Supabase; graceful fallback to bundled mock data (read-only) when env is absent.
>
> **Setup:** `cd app && cp .env.local.example .env.local` (fill `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) → apply `supabase/migrations/0001_init.sql`, `0002_eval_settings.sql`, `0003_datasets.sql` in the Supabase SQL editor → `npm run seed` → `npm run dev`.
>
> **Public deploy:** set `DEMO_ACCESS_CODE` + `DEMO_SESSION_SECRET` (gate on), `MAX_DAILY_LLM_USD=2`, and rotate keys before going live.

**An internal AI quality platform for teams shipping LLM-powered products.**

> Most AI products fail not because the model is weak, but because the team has no honest way to answer one question:
> *"Is this output any good?"*
>
> This tool answers that question — systematically, repeatably, and with evidence.

---

## What this is

A documentation-first design for an **AI Evaluation Tool** that scores LLM outputs against structured rubrics, flags hallucinations and ungrounded claims, surfaces regression risk over time, and produces evaluation reports a product team can act on.

This is the **evaluation half** of an AI quality stack. It looks at outputs *after* they are generated.

## What this is NOT

- **Not PromptOps.** It does not version prompts, manage prompt diffs, or run release pipelines. That belongs to a separate tool.
- **Not a prompt library.** Prompts are inputs to evaluation, not the subject.
- **Not a benchmark suite.** Public benchmarks measure model capability. This measures *your* product behavior on *your* data.
- **Not an observability dashboard.** Production logs go elsewhere. This tool is for offline, structured quality runs.

| | This tool | PromptOps | Logs/Observability |
|---|---|---|---|
| Question | "Is this output any good?" | "Will my prompt change break things?" | "What happened in prod last hour?" |
| Time | After output is generated | Before deploy | Continuous |
| Artifact | Scored evaluation report | Versioned prompt + test suite | Trace timeline |

---

## Problem

Teams shipping LLM-powered features almost always reach the same wall:

1. *Vibes-based QA.* "It looks good." There is no shared definition of "good."
2. *Hallucination blind spots.* Confident, fluent answers that are factually wrong slip past review.
3. *No regression signal.* A new prompt or model lands; nobody notices that one capability quietly degraded.
4. *No groundedness audit.* RAG systems cite sources that the answer does not actually use.
5. *No way to compare runs.* Last week vs this week. v1 vs v2. Human vs AI judge. Apples and oranges.

Evaluation is treated as a one-off spreadsheet, not as a product surface.

## What this tool does about it

- Defines **rubrics as first-class assets** — versioned, reusable, project-scoped.
- Runs **structured scoring across 10 dimensions** (accuracy, groundedness, hallucination risk, completeness, task completion, safety, consistency, tone fit, actionability, relevance).
- **Detects unsupported claims** at the span level, with a heat map over the output text.
- Combines **deterministic checks + LLM-as-judge + human review** in one pipeline.
- Compares runs and **flags regressions** between versions, datasets, and models.
- Produces a **shareable evaluation report** that engineers, PMs, and reviewers can all read.

---

## Target users

| User | Why they care |
|---|---|
| AI Product Manager | Needs a defensible quality story before launch. Needs to spot regressions before users do. |
| AI Engineer / Prompt Engineer | Wants fast feedback on whether a prompt or model change made things worse. |
| QA / AI Reviewer | Needs a structured queue of outputs to review, not a Notion list. |
| Compliance / Trust & Safety | Needs evidence that safety, groundedness, and accuracy were measured. |
| Engineering leadership | Needs one number to look at per project. And the receipts behind it. |

---

## Core features

1. **Rubric Builder** — define dimensions, weights, scoring methods (deterministic / LLM-judge / human), and pass thresholds. Save rubrics per project.
2. **Evaluation Runner** — submit (input, expected behavior, AI output, optional retrieved context) tuples. Run against a rubric. Get per-dimension scores.
3. **Hallucination Heat Map** — span-level highlighting in the output text: supported / partially supported / unsupported / contradicted by context.
4. **Groundedness Audit** — for RAG outputs, show which retrieved chunks each claim is anchored in, and which claims have no source.
5. **Output Reviewer Queue** — a human-in-the-loop view for borderline cases, with override and reason capture.
6. **Report Generator** — markdown / PDF export with score breakdown, failed cases, sample evidence, recommendations.
7. **Regression Comparison** — run the same evaluation set against two versions or two models. Surface "was passing, now failing" and score deltas.
8. **Project Profiles** — preloaded rubrics for common LLM product shapes (RAG, classification, agent, conversational, generative).

---

## Example use cases

### 1. Shadow — daily reflection analysis

A personal life-analytics app generates reflective summaries of a user's day from journal entries. Evaluation focuses on:
- **Life-area classification accuracy** (career, relationships, health, etc.)
- **Emotional nuance** — does it pick up grief, frustration, hope without overclaiming?
- **Non-judgmental tone** — no moralizing, no advice-giving the user did not ask for.
- **Useful next step** — actionable and proportional, not "you should meditate more."
- **Memory relevance** — does it correctly pull from prior reflections?

Outcome: a weekly evaluation run that catches when a model update starts producing toxic-positivity outputs.

### 2. RAG answer groundedness

A documentation assistant retrieves chunks from internal docs and answers questions. Evaluation focuses on:
- **Grounded in retrieved context** — every claim traces to a source chunk.
- **No unsupported claims** — model does not invent API names or argument types.
- **Correct use of sources** — answer does not misrepresent what the doc says.
- **Context relevance** — were the retrieved chunks actually useful for this question?
- **Citation quality** — citations point to the chunks that actually carry the claim.

Outcome: a groundedness report per retrieval strategy. Switching the retriever now has a measurable quality consequence.

### 3. Small business booking assistant

A WhatsApp bot for a hair salon detects booking intent, picks a time slot, confirms with the client. Evaluation focuses on:
- **Intent detection** — booking vs FAQ vs complaint.
- **Clear answer** — no robotic preamble, no over-explaining.
- **Booking readiness** — does it have all required slots (service, date, time, stylist)?
- **No false confirmation** — never says "booked" without a calendar write.
- **Proper human handoff** — when confused, routes to a human, does not improvise.

Outcome: a quality gate before pushing a new prompt or model to the live bot.

### 4. AI planning assistant

An agent decomposes a high-level objective into a step plan, dispatches sub-tasks, and produces a final report. Evaluation focuses on:
- **Task completion** — was the original objective actually accomplished?
- **Plan coherence** — do the steps make sense together?
- **No invented tools / files / facts** — the plan does not reference things that do not exist.
- **Safety** — does not silently take destructive actions.
- **Actionability** — final report is usable, not just descriptive.

Outcome: an evaluation harness that catches "plausible-looking but useless" outputs that pass vibes-based review.

---

## Roadmap (summary)

- **MVP** — Rubric Builder, Evaluation Runner, Hallucination Heat Map, basic report.
- **V1** — Regression Comparison, Human Review Queue, Project Profiles, export.
- **V2** — Cross-model evaluation, dataset management, automated dataset growth from production traces.
- **Future** — Live evaluation hooks for streaming production traffic, evaluator-of-evaluators (LLM judge calibration), red-team rubric library.

Full version in [`roadmap.md`](./roadmap.md).

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

## Reading order

If you have 10 minutes: `README.md` → `product-brief.md` → `architecture.md`.
If you have 30 minutes: add `behavior-spec.md` and any two wiki pages.
If you are evaluating this for hiring: read `wiki/evaluation-principles.md`, `wiki/llm-as-judge.md`, and `acceptance-criteria.md`. That is where the opinions live.
