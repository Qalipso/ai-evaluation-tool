# Evaluation Reports

The structure of a useful evaluation report, what each section does, and what to leave out.

A report is the artifact a stakeholder reads. Engineers see the tool's UI; everyone else sees the report. If the report is unreadable, the work is invisible.

---

## 1. What a report is for

A report exists to let a reader who was not in the team's QA discussion answer three questions:

1. Is the AI behavior good enough to ship?
2. Where does it fail, and how badly?
3. What changed since last time?

If the report cannot answer those, it is not a report; it is a printout.

## 2. The report template

Every report has the same structure. Consistency makes reports comparable; deviation makes them anecdote.

```
1. Header
2. Verdict
3. Summary
4. Aggregate scores
5. Dimension breakdown
6. Safety findings
7. Hallucination summary
8. Groundedness summary (when applicable)
9. Failing cases (top N with evidence)
10. Exemplar passing cases (small N)
11. Overrides (if any)
12. Recommendations
13. Appendix: configuration
```

The order matters. A reader who stops after section 3 still has the headline. A reader who reads section 9 has the evidence. A reader who reads to section 12 has the call to action.

## 3. Section-by-section purpose

### 3.1 Header

- Project name, rubric id and version, dataset id, model under test, prompt id and version.
- Timestamp.
- Author / run id.

The header is the audit trail. A report without these fields cannot be referenced later.

### 3.2 Verdict

A one-line statement: `Ship-ready`, `Acceptable with caveats`, `Needs work`, `Blocked: safety review required`.

The verdict is derived, not editorial. It maps from the per-dimension thresholds plus the safety gate. The tool produces it; the writer does not invent it.

### 3.3 Summary

Three sentences. No more.

- What was evaluated.
- The headline result.
- The single most important caveat.

Example: *"Evaluated 120 daily reflection outputs against rubric `shadow-daily-reflection-v1.1`. Overall 81/100, passing for ship. Memory relevance dropped 7 points vs last run — investigate prior-reflection retrieval."*

Three sentences is a forcing function. A team that cannot write the summary in three sentences does not understand its own result yet.

### 3.4 Aggregate scores

- Overall score with reference band (e.g. 81 → "Acceptable with caveats").
- Pass rate (% of cases passing all dimensions + safety).
- Number of cases evaluated.

Aggregates are necessary but not sufficient. They go above the dimension breakdown; the breakdown is where reading actually happens.

### 3.5 Dimension breakdown

A table:

| Dimension | Mean | Threshold | Pass rate | Notes |
|---|---|---|---|---|
| Accuracy | 82 | 75 | 88% | — |
| Hallucination risk | 71 | 80 | 64% | Below threshold; see § 7 |
| Tone fit | 88 | 70 | 96% | — |
| ... | | | | |

The notes column points to deeper sections. A dimension below threshold links to the failing cases.

### 3.6 Safety findings

If empty: `No safety findings.` (One line.)
If non-empty: a list with category, severity, evidence span, status (open / resolved by reviewer X).

Safety findings are never hidden. A report with safety findings is not a passing report regardless of other numbers.

### 3.7 Hallucination summary

- Total claims extracted.
- Distribution: supported / partial / unsupported / contradicted.
- Top 3 unsupported or contradicted claims, with the cases they appeared in.

The distribution number matters more than the score. A team that sees 14 contradicted claims across 120 outputs has a model that argues with its own context — a specific actionable signal.

### 3.8 Groundedness summary (when applicable)

- `claims_supported / total`
- `chunks_used / chunks_retrieved`
- `claims_misused` count
- A representative misuse example.

If `retrieved_context` was not supplied for the dataset, this section is omitted, not faked.

### 3.9 Failing cases (top N)

For each failing case in the top N (default 5–10):

- Case id.
- Input.
- Expected behavior.
- AI output (with heat map applied in HTML / PDF; with annotated text in markdown).
- Per-dimension scores.
- The judge's rationale on the failing dimensions.
- Any human override.

This section is the largest. It is the section a reader actually engages with. Skimping here makes the report decorative.

### 3.10 Exemplar passing cases

Two or three short examples of outputs that did well. Purpose: anchor what "good" looks like for this run, prevent the report from reading as purely negative.

### 3.11 Overrides

If any human overrides were applied:

- A table of overridden dimensions, with reviewer id and reason.
- A summary of judge-vs-human deltas observed in this run.

Stakeholders see this section as evidence of process integrity. A run with zero overrides on a high-stakes rubric raises eyebrows, not approval.

### 3.12 Recommendations

A short list, derived from failure patterns. Examples:

- "Hallucination risk below threshold on 36% of cases. Tighten judge prompt for claim-level grounding."
- "Memory relevance dropped 7 points. Investigate the prior-reflection retriever; consider re-baseline."
- "Tone fit is stable; consider lowering its weight in the next rubric version to recover budget for harder dimensions."

Recommendations are advisory. They are not the team's roadmap; they are inputs to it.

### 3.13 Appendix: configuration

- Full rubric JSON for this run.
- Judge model versions.
- Embedding model.
- Tool version.

The appendix is for reproducibility. A reader who wants to re-run this report in six months should not have to spelunk through chat history.

## 4. What a report should not contain

The temptation to add things must be resisted. None of these go in the report:

- Speculation about why the model produced a given output. The team can discuss; the report cannot.
- Marketing language. "Significantly improved." Reports use numbers and deltas, not adjectives.
- A single overall score with no breakdown. The breakdown is the report; the overall is the headline.
- Cherry-picked exemplar cases without the failing-case section. Both, or neither.
- Promises about future runs. "We will fix this next sprint." That is the team's plan, not the report's content.
- Configuration tweaks made after running. Reports are not editable.

## 5. Reproducibility

A report is reproducible: re-rendering from the stored run produces byte-identical markdown (modulo timestamps in the header). This is the audit guarantee. If a stakeholder later asks "what did the run say?", the answer is a file, not a memory.

When the underlying run gets a new human override, the tool generates a new report version. The old report is preserved. Both are retrievable. Reports never overwrite reports.

## 6. Length and format

- Markdown is the canonical format. PDF is generated from markdown.
- Length depends on dataset size, but the report should be readable in 10–15 minutes.
- Failing cases dominate the page count. A report with 200 failing cases needs a pagination strategy, not a longer attention span.

## 7. Audience patterns

The report is consumed by multiple audiences. Each section is tuned for a different reader.

- **PM / leadership.** Reads sections 1–3 (header, verdict, summary), maybe 4 (aggregates). Wants the headline and the call to action.
- **AI engineer.** Reads sections 5, 7, 8, 9 (breakdown, hallucination, groundedness, failing cases). Wants the failure patterns.
- **QA / reviewer.** Reads sections 9, 11 (failing cases, overrides). Wants the queue and the disagreement signal.
- **Compliance.** Reads sections 6, 11 (safety, overrides). Wants the audit trail.
- **Reader six months later.** Reads section 13 (appendix). Wants to reproduce.

A report that serves all five audiences is what the template is built for.

## 7a. Reports as NIST-style evidence artifacts

The NIST AI Risk Management Framework treats AI decisions as needing a documented evidence chain: who decided what, when, on what basis, with what data. The evaluation report is the operational form of that chain for a specific run.

What makes the report serve that purpose:

- **Provenance** — header carries run id, dataset id (with version), rubric id (with version), model under test, prompt id (with version), judge configuration, timestamp.
- **Reproducibility** — the report re-renders byte-identically from the stored run snapshot. The appendix has the full rubric JSON; the run's outputs and scores are immutable.
- **Traceability** — every score links to its evidence (rationale, evidence span, source chunk). Every override links to its reviewer id and reason.
- **Non-overwrite** — a new override creates a new report version. Old reports are retained, not replaced.

Without these four, a report is documentation, not evidence. The distinction matters the moment someone asks "what did the run say six months ago?"

## 7b. Section consumption patterns, by audience

A report serves multiple readers; each reads a different slice. The table is descriptive, not prescriptive:

| Reader | Sections they read | What they want |
|---|---|---|
| PM / leadership | Header, verdict, summary, aggregates | Headline + call to action |
| AI engineer | Dimension breakdown, hallucination summary, groundedness summary, failing cases | Where it failed, by pattern |
| QA / reviewer | Failing cases, overrides | Queue + disagreement signal |
| Compliance / audit | Safety findings, overrides, appendix | Audit trail + categorical risks |
| Reader six months later | Header, appendix | Reproduce the run |

The fact that the same artifact serves all five audiences is the point of the template. A report that serves only one audience is a brief, not a report.

## 8. The bad report

The recognizable shape of a bad evaluation report:

- One number, large, at the top.
- No dimension breakdown.
- No examples.
- "Looks good." in a paragraph at the bottom.
- No reference to the rubric.
- No timestamp.

This is not an evaluation report; it is a vibe sealed in a document. The tool's templates make this report shape unreachable.

---

## Source-backed concepts

- **Reports are evidence, not narrative.** The NIST AI Risk Management Framework's "Manage" function requires that AI decisions be traceable and reproducible. The audit-trail header (run id, rubric version, dataset id, model, timestamp) and the reproducibility guarantee (byte-identical re-render) are the operational form of that requirement.
- **Pinned configuration in the appendix.** OpenAI Evals stores the dataset, the grader configuration, and the model under test alongside every run; the report's role is to expose that bundle to a reader. The "Appendix: configuration" section in the template is that practice made visible.
- **Dataset / evaluator / run primitives.** LangSmith's evaluation model treats those three as the irreducible primitives. The report header carries all three; without them, a report cannot be referenced or re-run later.
- **Failure cases dominate the page count.** The MT-Bench judge paper and the LLM-as-Judge survey both emphasize that aggregate scores hide where the system actually fails. The failing-cases section is the largest section by design; the aggregate is a headline, not the evidence.
- **Safety findings are not aggregated.** OWASP Top 10 for LLM Applications enumerates categorical safety risks; they cannot be averaged into a score. The safety section is unconditional: a report with safety findings is not a passing report regardless of the dimension scores. NIST AI RMF reinforces this stance: safety is documented separately, with evidence.

## Applied in this tool

- The report header on `/reports/[id]` includes: project name, rubric id + version, dataset id, model under test, prompt id + version, run id, timestamp, author. Missing any of these blocks save.
- The "Recommendations" section is derived from failure-pattern detection, not generated as commentary; the report cannot ship without traceable, source-derived recommendations.
- The "Overrides" section lists every human change to scores with reviewer id and reason. Audit reviewers consume this section as the process-integrity surface.
- Reports re-render byte-identically from the stored run snapshot. A new human override on the underlying run creates a new report version; the prior report is preserved (NIST audit trail).

## Sources used

- OpenAI Evals — pinned configuration; report as artifact of a specific run + grader bundle.
- LangSmith Evaluation Concepts — dataset / evaluator / run primitives in report metadata.
- NIST AI Risk Management Framework / GenAI Profile — reproducible evidence; audit trail; safety documented separately.
- MT-Bench / Chatbot Arena judge paper — aggregate scores hide failure modes; failing cases must be visible.
- LLM-as-Judge survey — judges and overrides must be inspectable, not just summarized.
- OWASP Top 10 for LLM Applications — categorical safety risks are reported, not averaged.

---

## Related topics

- [Evaluation Principles](./evaluation-principles.md) — principles 10 (reports for someone not in the room) and 12 (reproducibility).
- [Scoring Rubrics](./scoring-rubrics.md) — where the dimension breakdown originates.
- [Regression Evaluation](./regression-evaluation.md) — the comparison report variant of this template.
- [Human Review](./human-review.md) — where the overrides section gets its data.
- [Hallucination Risk](./hallucination-risk.md) — the source of the hallucination summary.
- [Groundedness](./groundedness.md) — the source of the groundedness summary (when applicable).
- [LLM-as-Judge](./llm-as-judge.md) — the source of the judge rationales attached to failing cases.
