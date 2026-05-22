# Evaluation Principles

This is the opinionated foundation of the tool. Every other wiki page assumes these principles. If a team disagrees with them, they will fight the tool instead of using it.

---

## 1. Evaluation is a product surface, not a side project

Most teams treat evaluation as a spreadsheet that one engineer maintains. This is the first mistake. Evaluation is the surface where the team negotiates what "good" means. It needs a versioned definition, a stable home, an owner, and a calendar slot. If the team never opens the evaluation tool, it does not have a quality strategy.

## 2. There is no global score for an LLM output

A single number across an output is a marketing claim, not a measurement. An output can be fluent and ungrounded. It can be accurate and tone-deaf. It can be safe and useless. The only honest unit is a **dimension**, scored within a rubric that was chosen for this product, in this version.

The tool refuses to display an overall score without the dimension breakdown that produced it.

## 3. Define "good" before measuring it

A rubric must exist before an output is scored. Inventing the rubric after looking at the output is rationalization, not evaluation. The tool stores the rubric version with the run for exactly this reason.

The rubric is the team's prior. The score is the posterior. Mixing them up is the most common evaluation mistake.

## 4. Evidence over verdicts

A score with no evidence is gossip. A score with span-level evidence is auditable. The tool requires LLM-judge outputs to include a rationale and, where claim-level work applies, the evidence span. A score with no rationale is treated as `unscored`.

## 5. Hallucination and ungroundedness are different problems

A hallucination is a claim that is false or invented. An ungrounded claim is one that has no source in the supplied context. A claim can be true *and* ungrounded (the model knew it from training data; the user wanted it cited). A claim can be grounded *and* hallucinated (the model misread the source). The tool measures both, separately, and surfaces the asymmetry.

## 6. Safety is not a dimension you can weight down

A team that puts low weight on safety has not lowered the safety bar; it has hidden it. The tool isolates safety as a separate gate that cannot be score-averaged. A medium-or-higher safety finding blocks `resolved` status regardless of any other dimension.

## 7. LLM-as-judge is a tool, not a court

An LLM judge is good at first-pass triage. It is bad at being the final source of truth. It systematically over-rates fluent answers. It is sycophantic. It hallucinates rationales. It must be calibrated against humans on a rolling basis, and it must be overridable. Anyone who treats their LLM judge as ground truth has imported a new bug surface and called it evaluation.

## 8. Human review is a workflow, not a fallback

The most common pattern is "the LLM judge runs, and we review the failures." This is backwards. Human reviewers should look at: open safety findings first, judge-uncertain cases second, and random samples third. Reviewing only judge failures bakes the judge's blind spots into the dataset and the calibration. The tool's review queue is ordered accordingly.

## 9. Quality is comparable only against itself

A score of 78 is not meaningful on its own. It is meaningful as a delta against the prior run, on the same dataset, with the same rubric version. The tool emphasizes comparison views; absolute numbers are reported but consistently labeled with their reference rubric.

## 10. Reports are written for someone who was not in the room

The internal score is for the team. The report is for a stakeholder who was not in the team's QA discussion. The report shows examples, not just numbers. It surfaces failure patterns, not just aggregates. If the report cannot stand alone as an artifact in a launch decision, the report is incomplete.

## 11. Datasets reflect what the team has thought of, not what users do

A test set written by the team will pass on the day it is written. The interesting evaluation cases live in production traffic. Until evaluation pulls from production (V2), the tool warns the team explicitly: the current dataset is a hypothesis about user behavior, not a measurement of it.

## 12. Reproducibility is non-negotiable for stored runs

A stored run must reproduce its report deterministically. LLM-judge non-determinism is acknowledged and reported (variance estimates, multiple-sample averaging), but the run snapshot — outputs, scores, evidence — is immutable. A team that can edit history cannot prove quality at a point in time.

## 13. The unit of work is the case, not the prompt

This tool evaluates outputs, not prompts. A prompt id may live in metadata, but the question on the table is always "is this output any good given the input it was meant to answer". Asking the tool to evaluate the prompt itself is a category error; that is PromptOps.

## 14. Cost is part of the rubric

A dimension that requires a large model on every case is a budget claim. The tool surfaces the per-dimension cost so that teams cannot pretend a $0.10/case rubric is the same as a $0.01/case rubric. Honest evaluation includes the cost.

## 15. The tool has opinions on purpose

A tool with no opinions becomes a configuration mirror: whatever the team decides it means, that is what the tool reflects. This tool has opinions. Some teams will find them inconvenient. Those teams should pick a different tool or change their workflow — not weaken the tool into agreement.

---

## 16. Calibration drift is silent unless you measure it

A judge that agreed with humans last quarter may not agree this quarter. Models change, prompts change, datasets change, and humans recalibrate against new baselines. The LLM-as-Judge literature treats meta-evaluation — judging the judge — as a recurring task, not a one-time onboarding step. The tool's calibration log treats it the same way: per-dimension human-vs-judge deltas are tracked over time, with an alert when the drift exceeds threshold.

A team that does not look at the calibration log will deliver worse evaluations every quarter. The drift will be invisible at the score level and obvious only when downstream incidents start landing.

## 17. Adversarial cases belong in the dataset

Evaluation that only covers happy-path inputs measures nominal behavior. Production attacks (prompt injection, jailbreak prompts, data exfiltration attempts, false-confirmation traps) target the cases not in the dataset. The NIST AI RMF and MITRE ATLAS both treat targeted adversarial evaluation as part of the "measure" function. The tool tags adversarial cases distinctly and treats failures on them as gate conditions, not weighted dimensions.

A safety dimension that scores 95 on nominal cases and 40 on adversarial cases has a 40, not a 95.

## 18. Cost is a real part of "good"

A dimension whose default judge is a frontier model on every case is a budget claim. A rubric whose per-case cost has not been measured is a deferred surprise. The tool reports per-dimension cost in every run so that teams can choose to demote a noisy expensive dimension to deterministic or to a cheaper judge — instead of discovering the bill after the fact.

This complements principle 14 (cost is part of the rubric) by giving it a number, per dimension, per run.

---

## Anti-principles (rejected on purpose)

To be useful, the tool must reject some common practices. Listed here so they are visible.

- **"Just ask GPT to grade it."** A single ungrounded judge call is not an evaluation, it is a vibe.
- **"Average all the dimensions; that is the score."** Averaging hides catastrophic dimension failures.
- **"Quality went up because the overall went from 81 to 84."** That delta is within LLM-judge noise unless the rubric is fully deterministic.
- **"Safety is a 5% weight in the rubric."** Safety is not a weight; it is a gate.
- **"We do not need human review; we have a good judge."** A judge with no human calibration set is unmeasured.
- **"We evaluated last quarter; we know it is good."** Evaluation is continuous, not commemorative.
- **"Let us evaluate the prompts instead of the outputs."** Different tool, different artifact, different team motion.

These are the practices the tool is designed to make harder.

---

## Source-backed concepts

Each principle below maps to one or more primary sources. The principle is the product opinion; the source is the prior evidence that the opinion is reasonable. The source is not invoked to prove the principle universal — only to show it is not invented here.

- **Multi-dimensional evaluation, no single global score.** Stanford HELM evaluates models across accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency in parallel. The motivating finding is that a single accuracy number hides catastrophic failures on the other axes. This Wiki adopts the same stance for product evaluation: dimensions are scored separately, then composed.
- **Rubric before scoring.** Anthropic's evaluation guidance is explicit that success criteria must be defined before iterating on prompts; otherwise "better" is undefined. The tool stores the rubric version with the run for the same reason.
- **Evidence over verdicts.** G-Eval and the LLM-as-Judge literature both require the judge to emit a rationale alongside the score. The tool elevates this to a rule: a score with no rationale is `unscored`.
- **Safety is a gate, not a weight.** The NIST AI RMF treats safety as part of the "measure" function with explicit evidence requirements, separate from quality. OWASP Top 10 for LLM Applications enumerates categorical risks (prompt injection, sensitive info disclosure, excessive agency) that cannot be averaged into a quality score. The tool's safety gate follows that separation.
- **LLM-as-judge is not ground truth.** The MT-Bench / Chatbot Arena judge paper documents position bias, verbosity bias, and self-preference bias in LLM judges. The LLM-as-Judge survey adds calibration drift over time. The tool's calibration log and human-review-as-workflow rules follow from these findings.
- **Reports are reproducible artifacts.** NIST AI RMF and OpenAI Evals both treat the evaluation report as an evidence artifact — timestamped, traceable, and re-runnable. The tool's report reproducibility rule (byte-identical re-render from the stored run) makes that operational.

## Applied in this tool

- The dimension breakdown in any run (`/runs/[id]`) is the surface where "no global score" becomes visible.
- The rubric versioning rules in `/rubrics` are what enforce "rubric before scoring".
- The safety section in any report and the `/safety` log are where "safety is a gate" becomes visible.
- The calibration view in `/review` is where "LLM-as-judge needs calibration" becomes visible.
- The report header in `/reports/[id]` is where "reports are evidence artifacts" becomes visible.

## Sources used

- Stanford HELM — multi-dimensional evaluation, no single global score.
- Anthropic Evaluation Documentation — define success criteria before iterating.
- OpenAI Evals — evaluation as a first-class artifact, pinned configuration.
- G-Eval — structured judge prompts with rationale.
- MT-Bench / Chatbot Arena judge paper — LLM-judge bias and partial human agreement.
- LLM-as-Judge survey — meta-evaluation and calibration drift.
- NIST AI Risk Management Framework / GenAI Profile — safety as evidence, audit trail.
- OWASP Top 10 for LLM Applications — categorical risk taxonomy.

---

## Related topics

- [Scoring Rubrics](./scoring-rubrics.md) — how the principles become a versioned rubric artifact.
- [LLM-as-Judge](./llm-as-judge.md) — how principle 7 ("the judge is a tool, not a court") is operationalized.
- [Human Review](./human-review.md) — how principle 8 ("review is a workflow, not a fallback") is operationalized.
- [Hallucination Risk](./hallucination-risk.md) — how principle 4 ("evidence over verdicts") shows up at the claim level.
- [Groundedness](./groundedness.md) — how principle 5 ("hallucination ≠ ungroundedness") is enforced for RAG.
- [Regression Evaluation](./regression-evaluation.md) — how principle 9 ("quality is comparable only against itself") becomes a comparison workflow.
- [Evaluation Reports](./evaluation-reports.md) — how principles 10, 12, and 16 collapse into the report artifact.
