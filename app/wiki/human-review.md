# Human Review

When humans must review AI outputs, how the queue is ordered, what an override looks like, and how reviewer time is protected from waste.

Human review is not a fallback. It is a first-class workflow.

---

## 1. When human review is required

Human review is mandatory in the following situations. The tool enforces them.

- **Open safety finding at medium severity or higher.** The case cannot be marked `resolved` without a human override.
- **Low judge confidence on a high-weight dimension.** Configurable threshold; default: confidence < 0.6 on any dimension whose weight > 0.10.
- **Disputed prior review.** Two reviewers gave conflicting overrides; a third reviewer is required.
- **Calibration sampling.** A configurable fraction of cases (default 5%) is routed to humans regardless of judge confidence, to feed the calibration log.

Human review is **recommended** in the following situations. The tool surfaces them but does not block.

- A case where the LLM judge labeled a claim `unsupported` and the user wants confirmation.
- A regression-flagged case (was passing, now failing).
- The first N cases in any new project profile, to anchor the rubric.

## 2. Queue ordering

A naive review queue is chronological. The tool's queue is **priority-ordered**:

1. Open safety findings (medium+), oldest first within priority.
2. High-weight low-confidence cases.
3. Disputed cases.
4. Regression-flagged cases.
5. Calibration samples.
6. User-requested reviews.

Chronological order is *not* a default. A queue that surfaces the newest cases first guarantees the oldest unsolved problems rot.

## 3. The reviewer view

For each case in the queue, the reviewer sees:

- The input.
- The expected behavior.
- The AI output, with hallucination heat map applied.
- The retrieved context (if present), with the source spans the model claimed to use highlighted.
- The per-dimension LLM-judge scores **and rationales**.
- The per-dimension confidence values.
- Any open safety findings, with severity and evidence.
- A side panel to override individual dimensions.

Reviewers see the judge's reasoning, not just its number. This makes the review faster and the calibration data richer.

## 4. What an override is

An override is a per-dimension human score with:

- The numeric score (same scale as the rubric).
- A required reason string (cannot be empty; cannot be `n/a`).
- A reviewer id.
- A timestamp.

Overrides do not delete the LLM-judge score. They sit alongside it. The case's final score uses the human score when present.

The required reason is the lever. A team that lets reviewers override without explanation has not added human review; it has added human noise. The reasons feed the calibration log and surface systemic disagreement patterns.

## 5. What an override is not

- It is not a license to inflate scores to make a release look good. Overrides are stored and inspected for distribution. A reviewer whose overrides drift consistently above the judge is flagged for calibration training.
- It is not the same as fixing the output. The tool does not re-run the model. The override is about the score, not the output.
- It is not a single action that closes a case. The case is closed by an explicit "resolve" step after all required reviews are complete.

## 6. Reviewer fatigue and how the tool fights it

Human review is expensive. The tool tries to make every reviewer minute count.

- **Cap the queue.** Default cap: 50 open cases per project. Beyond cap, new safety findings push out the oldest non-safety items. The tool surfaces the eviction in an "unreviewed" log.
- **Pre-fill judge work.** Reviewers should not start from a blank screen. The judge's score and rationale are visible.
- **One case at a time.** No infinite scroll. The next case appears when the current one is resolved.
- **Keyboard-first interactions.** Override, comment, resolve via shortcuts.
- **Time per case is tracked.** Cases that take longer than a threshold are flagged for rubric review (the rubric may be ambiguous, not the case).
- **Same case never appears twice to the same reviewer** unless explicitly disputed.

## 7. Two-reviewer pattern (high-stakes dimensions)

For safety dimensions and any dimension a project marks high-stakes:

- Two reviewers must independently score.
- If they agree (within a configurable delta), the average is the override.
- If they disagree, the case is marked `disputed` and routed to a third reviewer or a documented decision-maker.
- The judge score remains visible but does not break ties.

Single-reviewer overrides on safety are accepted only when explicitly configured. The default is two-reviewer.

## 8. Reviewer roles

The tool supports two reviewer roles in V1:

- **Reviewer.** Can override scores; their overrides count toward the final score per the project's review policy.
- **Lead reviewer.** Can resolve disputes; can mark a case `escalated` for product-team decision.

Lead reviewer is a workflow role, not a permission tier. The tool does not implement authentication; that is operational.

## 9. The calibration loop

Every override feeds back into calibration. Specifically:

1. Override is stored with reason.
2. The judge-vs-human delta is computed per dimension.
3. Aggregates are exposed in the calibration view: mean delta per dimension per judge per project, with time series.
4. When a judge drifts beyond a threshold (default ±0.5 on the 0–10 scale, 2σ stable), the calibration view raises an alert.
5. The team responds: prompt edit, judge swap, or dimension demotion to `human`.

A team that does not act on calibration drift will deliver worse evaluations every quarter. The drift is silent; the calibration view makes it loud.

## 10. What humans should never be asked to do

Human review time is too expensive to waste on tasks the tool can do.

- **Not** count words.
- **Not** check JSON shape.
- **Not** verify lists of required keywords appear.
- **Not** average the LLM-judge dimensions together.
- **Not** triage chronologically.
- **Not** review cases the judge already scored confidently and the team marked as low-stakes.

Every one of these can be automated. Time spent on them is taken from the cases that need a human.

## 11. Documentation per reviewer interaction

For every override, the tool stores: who, when, what changed, why. A team that cannot answer "why did this case's score change from 78 to 88?" is not running a quality program; it is running a Notion page.

Reports include an "overrides" section listing every human change to scores, with reasons. Stakeholders read this section as evidence of process integrity.

## 12. Reviewer protections

The tool protects reviewers from being treated as throughput machines.

- Time-per-case metrics are reported in the aggregate, not per reviewer. Individual reviewer dashboards exist but are not surfaced to managers by default; they exist for reviewer self-awareness.
- The queue cap protects reviewers from infinite backlogs.
- Calibration disagreement is treated as data, not as performance evaluation.
- A reviewer marking a case "I cannot decide" is a valid state. The case is routed onward; the reviewer is not blocked.

A review program that burns out its reviewers does not work. The tool's defaults assume this and design against it.

## 12a. Adversarial cases in the queue

MITRE ATLAS catalogs adversarial tactics against AI systems: prompt injection, evasion, model extraction, training data poisoning, indirect prompt injection through retrieved content. These tactics map cleanly to OWASP's LLM Top 10 (prompt injection, sensitive information disclosure, insecure output handling).

The tool's stance, applied here:

- Adversarial test cases are tagged `adversarial: true` in the dataset.
- Adversarial cases always enter the human review queue, regardless of judge confidence. A judge's "passing" verdict on an adversarial input is itself suspect.
- A safety finding triggered by an adversarial case is treated as gate-blocking on the entire run, not just the case. The fragility surfaced by the adversarial probe is the safety surface for nominal cases too.
- The safety log (`/safety`) categorizes findings by ATLAS tactic and OWASP category, not just by free-text label.

A team running only nominal cases is measuring its best case, not its worst.

## 12b. OWASP-aligned safety categories

The review surface uses the OWASP LLM Top 10 categories as the schema for safety findings:

- **LLM01 Prompt Injection** — direct or indirect manipulation of the prompt to bypass instructions.
- **LLM02 Insecure Output Handling** — output rendered as code/HTML/SQL without sanitization.
- **LLM06 Sensitive Information Disclosure** — PII, secrets, internal-only data in the output.
- **LLM07 System Prompt Leakage** — model reveals system prompt or internal context.
- **LLM08 Excessive Agency** — model invokes tools or takes actions beyond the user's authorization.
- **LLM09 Misinformation** — confidently wrong, including false confirmations.

Each finding is stored with category, severity, evidence span, and review status. Reports group findings by category, not by case, so a stakeholder sees the pattern.

## 13. The minimum viable review policy

For a team starting human review:

1. Two reviewers for safety. One for everything else.
2. 5% calibration sampling at the start; lower once calibration is stable.
3. Reasons required on every override.
4. Queue cap at 50.
5. Daily 15-minute review block, not "when there is time" (which means never).
6. Weekly calibration glance — is the judge drifting?

A team that adopts this policy has more rigor than 90% of LLM products in market.

---

## Source-backed concepts

- **Human review is ground truth where LLM judges are not.** The MT-Bench / Chatbot Arena judge paper measures LLM-judge agreement with humans at roughly 80% for strong models on subjective dimensions, with disagreement concentrated in interpretable failure modes (bias, fluency over-rating). The implication, stated by that paper and reinforced by the LLM-as-Judge survey: for high-stakes dimensions and ambiguous cases, the human is the ground truth, not the model.
- **Safety as a separate workflow.** The NIST AI RMF and OWASP Top 10 for LLM Applications both treat safety failures (PII leakage, prompt injection, sensitive information disclosure, excessive agency) as categorical risks that must be reviewed and documented, not aggregated into a quality score. The queue-priority rule (open safety findings first) follows from that separation.
- **Adversarial cases require targeted review.** MITRE ATLAS catalogs adversarial tactics against AI systems (prompt injection, model extraction, evasion). The recommendation to keep adversarial cases in the evaluation dataset and to route them to human review even when the judge passes them is the operational form of that catalog.
- **Audit trail and reproducibility.** The NIST AI RMF's "Manage" function requires evidence of how decisions were made. Storing every override with who, when, what, and why — and never overwriting prior scores — is the operational form of that requirement.
- **Override reasons feed calibration.** The LLM-as-Judge survey emphasizes meta-evaluation: the only way to keep a judge honest is to compare it to humans on an ongoing basis. The calibration loop in section 9 (overrides feed deltas, deltas feed drift alerts) is that practice made operational.

## Applied in this tool

- The Human Review queue (`/review`) orders by: open safety findings (medium+), high-weight low-confidence cases, disputed cases, regression-flagged cases, calibration samples, user requests. Chronological order is never the default.
- Every override is stored with reviewer id, timestamp, and a required reason; reports include an "Overrides" section listing every change with reason (the NIST audit trail).
- The two-reviewer policy for safety-flagged cases is the OWASP + NIST stance on safety-as-evidence operationalized: a single reviewer is not enough for the categorical risks.
- Adversarial cases routed from the dataset are tagged in the queue and tracked separately in the safety log, per the ATLAS framing.

## Sources used

- MT-Bench / Chatbot Arena judge paper — LLM-judge agreement with humans is partial; human is ground truth for ambiguous and high-stakes cases.
- LLM-as-Judge survey — meta-evaluation and calibration drift; override-driven calibration loop.
- NIST AI Risk Management Framework / GenAI Profile — audit trail, evidence requirements, safety as a separate workflow.
- OWASP Top 10 for LLM Applications — categorical safety risks (PII, prompt injection, excessive agency).
- MITRE ATLAS — adversarial tactic catalog; targeted adversarial cases in evaluation datasets.

---

## Related topics

- [Evaluation Principles](./evaluation-principles.md) — principles 8 (review as workflow), 6 (safety as gate), and 17 (adversarial cases).
- [LLM-as-Judge](./llm-as-judge.md) — the calibration loop that overrides feed into.
- [Hallucination Risk](./hallucination-risk.md) — low-confidence claims that route to review.
- [Scoring Rubrics](./scoring-rubrics.md) — how the safety gate and high-stakes dimensions are defined per project.
- [Evaluation Reports](./evaluation-reports.md) — the overrides section and the safety findings section.
- [Regression Evaluation](./regression-evaluation.md) — how regressed cases are queued for human review.
