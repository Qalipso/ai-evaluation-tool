# Product Brief — AI Evaluation Tool

## 1. Problem

Teams shipping LLM-powered features lack a defensible, repeatable way to answer:
*"Is this AI output any good?"*

Specifically:

- **Quality is invisible.** Outputs are reviewed by feel, in chat threads, without shared criteria.
- **Hallucinations slip through.** Confident fluent prose hides factual errors and unsupported claims.
- **Groundedness is unverified.** RAG outputs cite sources that the answer does not actually use, or skip sources entirely.
- **Regressions are discovered by users.** A prompt or model change degrades one capability while improving another; nobody notices until support tickets arrive.
- **Eval results are ephemeral.** Last week's spreadsheet is gone. There is no diff between runs.
- **Reviewers burn out.** Manual review is the entire QA strategy, scaling linearly with traffic.

The result: AI features ship with no honest quality signal, and post-launch incidents are blamed on "the model" rather than on the absence of a measurement system.

## 2. Target users

| Role | Primary need | Time spent in tool |
|---|---|---|
| **AI Product Manager** | Defend launch decisions with evidence. Spot regressions before users. | Weekly: reports, comparisons. |
| **AI Engineer** | Get fast feedback after a prompt/model change. | Per change: targeted runs. |
| **QA / AI Reviewer** | Work a structured queue, not a chat thread. | Daily: human review queue. |
| **Trust & Safety / Compliance** | Evidence that safety + groundedness were measured. | Per release: safety reports. |
| **Engineering Lead** | One quality number per project, plus drill-down. | Weekly: dashboard. |

## 3. Jobs To Be Done

When a user comes to this tool, they are hiring it to do one of these jobs:

1. *When I change a prompt or model, help me see what got worse so I can ship safely.*
2. *When I run an evaluation, give me a per-dimension breakdown so I can defend the score.*
3. *When an output looks fine but feels wrong, help me find the unsupported claims so I can prove it.*
4. *When I review AI outputs, give me a structured queue so I do not have to invent my own workflow.*
5. *When I report to leadership, give me a one-page artifact so I do not have to manually summarize.*
6. *When I onboard a new project, give me a starting rubric so I do not have to design from zero.*

## 4. MVP scope

**In scope for MVP:**

- Rubric Builder with the 10 core dimensions (see `wiki/scoring-rubrics.md`), customizable weights and thresholds, save per project.
- Evaluation Runner that accepts `(input, expected behavior, AI output, retrieved context)` tuples.
- Scoring Engine combining:
  - Deterministic checks (regex / contains / length / JSON-shape).
  - LLM-as-judge for subjective dimensions.
- Hallucination Heat Map at span level: supported / partial / unsupported / contradicted.
- Groundedness Audit: per-claim source mapping for RAG outputs.
- Evaluation Report: markdown export with scores, failed cases, evidence snippets.
- Storage of past evaluation runs.
- 5 preloaded project profiles: Shadow daily reflection, RAG QA, booking assistant, customer support, AI planner.

**Out of scope for MVP (deferred):**

- Real LLM execution (MVP uses mock or pre-generated outputs).
- Authentication, multi-user, multi-tenant.
- Real-time / streaming evaluation.
- Cross-model arena comparison.
- Active learning from human review back into the LLM judge.
- Dataset versioning.

## 5. Non-goals

These are explicitly *not* the purpose of this tool. They are valid problems; they belong elsewhere.

- **Prompt versioning, prompt diff, prompt release management.** That is PromptOps. See the companion tool.
- **Public benchmark scores** (MMLU, HumanEval, etc.). This tool measures your product on your data, not general model capability.
- **Production traffic observability and tracing.** Logs, traces, latency — that belongs in an observability stack.
- **Model fine-tuning.** Evaluation results may inform fine-tuning, but training pipelines are out of scope.
- **Prompt suggestion or auto-fix.** This tool reports; it does not write prompts.
- **Generic LLM playground.** This is a structured evaluation surface, not a chat sandbox.

## 6. Success metrics

The tool itself is successful if it changes the team's behavior. Concretely:

| Outcome | Metric | Target after 1 quarter of use |
|---|---|---|
| Quality is named, not vibes | % of AI-related launch decisions backed by a stored evaluation run | > 80% |
| Regressions caught pre-launch | Regressions caught in evaluation vs reported by users (ratio) | > 4:1 |
| Hallucinations surfaced | % of evaluated outputs with at least one unsupported claim flagged | Tracked as baseline, then reduced over time |
| Reviewer efficiency | Avg time per human-reviewed output | < 90 seconds in the review queue (vs ~5 min in ad-hoc tools) |
| Cross-team reuse | Number of projects with at least one saved rubric | ≥ 3 active projects |
| Audit-readiness | % of releases with a one-click evaluation report attached | 100% for safety-relevant releases |

Tool quality is **not** measured by user delight in the UI. It is measured by whether the team makes different, better-informed decisions.

## 7. Core user flows

### Flow A — One-off output evaluation

1. User selects a project (or default).
2. Picks a rubric (or uses the project default).
3. Pastes / submits `(input, expected behavior, output, optional context)`.
4. Clicks Evaluate.
5. Sees per-dimension scores, hallucination heat map, groundedness audit, overall score.
6. Saves the run.

### Flow B — Batch evaluation against a dataset

1. User selects a saved dataset of test cases.
2. Picks a rubric.
3. Optionally tags the run (e.g. "model = gpt-4o", "prompt = v3").
4. Runs the full batch.
5. Sees aggregate scores, distribution per dimension, failing-case list.
6. Exports a report.

### Flow C — Regression comparison

1. User selects two prior runs (typically same dataset + rubric, different model or prompt).
2. Tool shows side-by-side aggregate scores and a list of cases where the second run got worse.
3. User drills into a regressed case, sees both outputs, both score breakdowns.
4. User exports a regression report or queues failing cases for human review.

### Flow D — Human review

1. Reviewer opens the review queue (filtered by rubric or score range).
2. Sees one output at a time with the original LLM-judge score breakdown.
3. Optionally overrides one or more dimensions, writes a reason.
4. Marks reviewed. Next item appears.
5. Override data feeds the run's final score and an LLM-judge calibration log.

### Flow E — Report generation

1. User opens a completed run.
2. Clicks Generate Report.
3. Tool produces a markdown document with: summary, aggregate scores, dimension breakdown, top 5 failing cases with evidence, recommendations.
4. User exports as PDF or copies to a doc.

## 8. Key risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| **LLM judge bias** | An LLM judge can systematically over-rate fluent answers and miss factual errors. | Combine deterministic + LLM judge + human review. Calibrate judge on a human-graded gold set. |
| **Rubric creep** | Teams keep adding dimensions until rubrics are unscorable. | Cap at ~10 dimensions per rubric. Enforce weight normalization. |
| **Vanity scoring** | Teams game the score by tuning rubrics until everything passes. | Lock rubric versions; track score *and* rubric version together. |
| **Eval blindspots** | Test cases reflect what the team already thought of, not real user inputs. | V2: import datasets from production traces. |
| **Reviewer fatigue** | Human review queue becomes a backlog nobody clears. | Cap queue size. Prioritize by score uncertainty, not chronology. |
| **Misuse as PromptOps** | Users try to manage prompt versions inside this tool. | Hard product boundary; in-product link to PromptOps tool. |
| **Hallucinated groundedness** | LLM judge claims an output is grounded when it is not. | Span-level evidence required; judge must cite the supporting chunk, not just rate. |

## 9. Out-of-the-box content

The tool ships with:

- 10 reference dimensions (see `wiki/scoring-rubrics.md`).
- 5 project profiles with starter rubrics and sample test cases.
- 4 evaluator types: deterministic, LLM-as-judge, semantic similarity, human.
- Markdown report template.
- A wiki, surfaced inside the tool, that documents how to evaluate responsibly.

The wiki is part of the product. A team that adopts this tool also adopts its evaluation philosophy.
