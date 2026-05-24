# Regression Evaluation

How the tool compares two runs, what counts as a regression, and how to avoid the common ways teams accidentally lie to themselves with comparison data.

---

## 1. What "regression" means here

A regression is a measurable drop in quality between two evaluation runs, on the same dataset, scored by the same rubric version, where exactly one variable changed.

The keywords: **measurable**, **same dataset**, **same rubric**, **one variable**. If any of those is missing, the comparison is not a regression check; it is a vibe.

## 2. What the tool requires for a valid comparison

The tool refuses to compute a regression report unless:

- Run A and Run B use the same dataset (same case ids).
- Run A and Run B use the same rubric version.
- Each case ran on the same retrieved context (or both ran without context).
- Metadata explicitly tags the changed variable (model, prompt id, retrieval strategy, etc.).

This is enforced at the API level. There is no "compare anyway" button.

## 3. Variables a team might change

Common things changed between A and B:

- Model swap.
- Prompt version swap.
- Retrieval pipeline change (new chunker, new embedding model, new k).
- System prompt or persona change.
- Temperature / parameters.
- Tool definitions.
- Safety filter changes.

The tool stores the variable name in the comparison record. A reader of the report knows which knob moved.

## 4. What the tool reports

For a comparison of Run A → Run B:

- **Aggregate deltas**: per-dimension mean delta, overall mean delta, median delta.
- **Distribution shift**: histogram per dimension for A and B overlaid.
- **Regressed cases**: cases where A passed and B failed.
- **Recovered cases**: cases where A failed and B passed.
- **Stable cases**: cases where the status did not change.
- **Score-delta-only cases**: cases where pass/fail did not change but the score moved by more than a configurable threshold.
- **Net effect**: regressed count minus recovered count, with a confidence band.

## 5. When is a change "a regression"?

The tool flags Run B as a regression if **any** of these are true:

- Any dimension's mean dropped by more than 5 points on a 100-scale (configurable per project).
- More than 2% of cases regressed (configurable).
- A new safety finding appeared in any case that did not previously have one.
- A dimension that was passing-on-average is now failing-on-average.

A regression flag is a *prompt to investigate*, not a verdict. The team reads the regressed cases and decides.

## 6. What "the overall went up" does not prove

A frequent trap: B's overall score is higher than A's, so B is shipped. Then a specific capability silently degraded.

Examples of this trap the tool surfaces:

- **Trade-off masking.** Tone fit went up 8 points; accuracy went down 4 points. Overall is +1. Team ships. Users notice.
- **Sample bias.** B handled the easy cases better but failed the hard ones. Mean is up; tail is worse.
- **Variance illusion.** LLM-judge variance produced a +2 mean delta within noise. Team ships a non-change.

The regression report always shows per-dimension deltas, not just overall. The overall delta alone is treated as suspect until the per-dimension story confirms it.

## 7. The same-dataset rule

A team that changes the dataset between A and B is no longer measuring a regression. They are reporting two unrelated runs.

The tool enforces this. Adding cases to the dataset creates a *new* dataset version. A comparison across dataset versions is allowed but labeled *non-comparable*; the report banner says so.

The right pattern: keep the dataset stable for the duration of a model/prompt iteration. Grow the dataset on its own schedule. Re-run A on the new dataset to re-establish a baseline before evaluating B.

## 8. The same-rubric rule

Editing the rubric between A and B changes the unit of measure. A score of 78 under rubric v1.1 is not comparable to a score of 78 under rubric v1.0.

The tool refuses cross-rubric comparisons. The right pattern: when changing a rubric, lock A under the new rubric (re-run A) before evaluating B. This costs one extra run; it is worth it.

## 9. LLM-judge noise

If a dimension is scored by an LLM judge, repeated evaluations of the same case give different scores. The tool reports an estimated standard deviation per dimension from a calibration set, and treats deltas smaller than 2σ as **not significant**.

A team that ships on a 1-point overall improvement when 2σ is 3 points is shipping noise.

The tool helps with two patterns:

- **Judge averaging.** Run the LLM judge N times per case (default 3), take the mean. Cuts variance.
- **Deterministic fallback.** Where possible, replace an LLM-judge dimension with a deterministic check. Eliminates noise at the cost of subjectivity capture.

## 10. Patterns to investigate when a regression is flagged

The regression report shows *which* cases regressed. The team's job is to look at them. Common patterns:

- **All regressions are in one category.** The model swap is worse at, say, technical questions. Specific failure mode.
- **Regressions cluster at long inputs.** The new model has a smaller usable context window.
- **Regressions cluster at the end of outputs.** New model truncates or rambles.
- **Regressions appear only in a specific tone-fit failure.** New model is more formal or less formal than the previous; rubric needs revisit.
- **Regressions co-occur with safety findings.** New model has weaker guardrails on a specific category.

A team that does not look at the failing cases will draw the wrong conclusion.

## 11. Multi-version comparison (A → B → C)

The tool supports comparing more than two runs. Limitations:

- Same dataset, same rubric remain required.
- Reports become harder to read above three runs. Default UI tops out at three.
- For longer time series, the recommended view is the **trend chart**: per-dimension mean over time across N runs. The tool offers this view at V1.

## 12. Comparison vs. monitoring

The tool's regression comparison is offline. It is not a live monitor. The expected workflow:

- Before shipping a change → run the dataset → compare against the last shipped run.
- After shipping → log production traces.
- Periodically → sample production traces into the dataset (V2) → re-baseline.

Continuous live monitoring belongs in an observability stack. The tool is the gate, not the watch tower.

## 13. What the report looks like

A regression report includes:

- Header: A version, B version, dataset, rubric, what changed.
- Verdict: regression flagged / no regression.
- Aggregate table: per-dimension means for A, B, delta, significance.
- Top regressed cases (default 10): input, A output, B output, A scores, B scores, evidence.
- Top recovered cases (default 5).
- Safety delta.
- Recommendation: ship / do not ship / human review required.

The recommendation is advisory. The decision is human.

## 13a. Variance-aware comparison

Comparing two runs without accounting for LLM-judge noise is the most common way to ship a non-change. The tool surfaces two variance controls:

- **Per-dimension σ from a calibration set.** Each LLM-judge dimension has an estimated standard deviation, computed by running the judge multiple times on a held-out calibration set. Deltas below 2σ are flagged "within noise" in the comparison report.
- **Judge averaging (N samples).** Per the variance-reduction recipe in the LLM-as-Judge survey, averaging N independent judge calls reduces standard error by ~√N. A regression-critical run typically uses N=3; an exploratory run uses N=1 and is labeled "high variance".

Practical implication: a 1-point overall improvement on a 100-scale, against a per-dimension σ of ~3, is not an improvement. The tool's verdict in that case is "no significant change".

## 13b. Variable-isolation discipline

The same-dataset / same-rubric rule is one half of variable isolation; the other half is changing only one thing at a time. Common violations:

- Swapping the model and editing the prompt in the same iteration. The regression delta now has two causes.
- Changing the retrieval pipeline (chunker + embedding + k) at the same time as the generator prompt. The retrieval failure surface and the answer failure surface are now tangled.
- Adding cases to the dataset for the new run. Now it's not even a comparison — it's two different experiments.

The tool stores the `changed_variable` field per comparison record and refuses to compute a comparison when it cannot identify a single named change. The intended workflow is: lock baseline → change one variable → run → compare → repeat.

## 14. Common mistakes the report exists to prevent

- Comparing different datasets.
- Comparing different rubrics.
- Trusting a small overall delta.
- Ignoring per-dimension trade-offs.
- Skipping the failed-case list because the aggregate looked fine.
- Re-running until the numbers look favorable. (The tool stores every run; a team that does this leaves an audit trail.)
- Conflating "improvement on the eval set" with "improvement in production". Eval is a hypothesis about production.

---

## Source-backed concepts

- **Same dataset, same grader.** OpenAI Evals and LangSmith both treat the dataset and the grader as part of the experiment's identity. Changing either creates a new experiment, not a comparable run. The tool's refusal to compute a regression report across mismatched datasets or rubrics is the operational form of that rule.
- **Per-dimension deltas, not a single overall delta.** Stanford HELM's stance — a single score hides axis-specific failures — applies just as strongly to regression. A +1 overall delta that hides a −5 accuracy delta is a regression masquerading as an improvement. The tool's regression report makes per-dimension deltas the first table, not an appendix.
- **LLM-judge noise is real and must be bounded.** The MT-Bench judge paper and the LLM-as-Judge survey both document inter-run variance: scoring the same case twice produces different numbers. The tool's 2σ rule (deltas smaller than 2× the calibration-set standard deviation are not significant) and the optional judge-averaging (N samples) are responses to that finding.
- **Deterministic checks reduce variance.** IFEval shows that verifiable instruction-following constraints can be checked deterministically with zero variance. The tool's recommendation to replace LLM-judge dimensions with deterministic checks where possible (and to do so for regression-critical dimensions) follows directly.
- **Online vs offline.** LangSmith distinguishes offline evaluation (frozen dataset, batch run) from online observation (production traces). The tool is offline by design; live monitoring belongs in an observability stack. This article makes the boundary explicit.

## Applied in this tool

- The Compare view (`/compare/[runA]/[runB]`) enforces same-dataset / same-rubric at the API level. There is no "compare anyway" button.
- The per-dimension delta table in the comparison report is the HELM stance made operational: every dimension has a delta, a 2σ band, and a "significant?" flag.
- The "judge-averaging" toggle on a run (N samples per LLM-judge call) is the variance-reduction recipe from the LLM-as-Judge survey.
- The advisory recommendation (ship / do not ship / human review required) is derived from thresholds + safety gate; it is not invented by an LLM editorial layer.

## Sources used

- OpenAI Evals — same dataset, same grader for comparison.
- LangSmith Evaluation Concepts — offline vs online evaluation; pinned configuration.
- Stanford HELM — per-dimension deltas, no global score.
- MT-Bench / Chatbot Arena judge paper — LLM-judge variance per run.
- LLM-as-Judge survey — calibration drift and variance bounds.
- IFEval — deterministic checks reduce variance.

---

## Related topics

- [Evaluation Principles](./evaluation-principles.md) — principles 9 ("comparable only against itself"), 12 (reproducibility), and 16 (calibration drift) ground this workflow.
- [Scoring Rubrics](./scoring-rubrics.md) — why rubric versions are immutable and how cross-rubric comparison is reported.
- [LLM-as-Judge](./llm-as-judge.md) — variance per judge, judge-averaging, and the 2σ rule.
- [Evaluation Reports](./evaluation-reports.md) — how the regression report is structured (verdict, per-dimension deltas, regressed cases).
- [Human Review](./human-review.md) — how regression-flagged cases enter the review queue.
