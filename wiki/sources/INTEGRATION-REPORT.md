# Wiki Source Integration Report

Generated: 2026-05-21 · Updated: 2026-05-22
Scope: `projects/ai-evaluation-tool/wiki` + `projects/ai-evaluation-tool/app/src/lib` + `projects/ai-evaluation-tool/app/src/app/wiki` + `projects/ai-evaluation-tool/app/src/app/play` + `projects/ai-evaluation-tool/app/src/components`

> Session 2 (2026-05-22) added: interactive game `/play` (Outputs, Please), shift sampler with variability, end-state reward + ASCII meme, per-article 3-question quizzes with localStorage persistence, green highlight of passed articles in Learning Paths. See "Session 2 additions" block at the bottom.

---

## Files changed

New:
- `wiki/sources/source-cards.md` — 17 source cards (paraphrased, with URLs and product mappings).
- `wiki/sources/source-to-wiki-map.md` — bidirectional map (source → pages + page → sources).
- `wiki/sources/INTEGRATION-REPORT.md` — this report.
- `app/src/lib/wikiSources.ts` — TypeScript source metadata, exported as `WIKI_SOURCES`.

Modified (markdown):
- `wiki/evaluation-principles.md` — added principles 16/17/18 (calibration drift, adversarial cases, cost) + Source-backed concepts block + Applied in this tool block + Sources used block + Related topics block.
- `wiki/scoring-rubrics.md` — added §7a (method decision flow) + §7b (per-dimension cost) + Source-backed + Applied + Sources + Related topics.
- `wiki/hallucination-risk.md` — added §8a (atomic claim extraction in practice) + §8b (variance signal) + Source-backed + Applied + Sources + Related topics.
- `wiki/groundedness.md` — added §10a (RAG triad in practice) + §10b (RAGAS-to-tool mapping) + Source-backed + Applied + Sources + Related topics.
- `wiki/regression-evaluation.md` — added §13a (variance-aware comparison) + §13b (variable-isolation discipline) + Source-backed + Applied + Sources + Related topics.
- `wiki/llm-as-judge.md` — added §9a (pointwise/pairwise/listwise) + §9b (when not to use a judge) + Source-backed + Applied + Sources + Related topics.
- `wiki/human-review.md` — added §12a (adversarial cases) + §12b (OWASP-aligned safety categories) + Source-backed + Applied + Sources + Related topics.
- `wiki/evaluation-reports.md` — added §7a (NIST evidence artifacts) + §7b (audience consumption patterns) + Source-backed + Applied + Sources + Related topics.

Modified (code):
- `app/src/lib/wiki.ts` — added `sourceIds: string[]` to `WikiArticle`, populated for all 9 articles.
- `app/src/app/wiki/page.tsx` — imports `WIKI_SOURCES`; index card shows source-count badge; footer reports source count.
- `app/src/app/wiki/[slug]/page.tsx` — imports `resolveSources`; meta strip shows "Source-backed · N" badge; new `<SourcesBlock>` component lists sources with type, title, link, applied-to.
- `app/src/app/wiki/start-here/page.tsx` — imports `getArticle` and `resolveSources`; new "Sources behind this guide" section (section 08).

---

## Sources added (17)

| ID | Title | Type | URL |
|---|---|---|---|
| `helm` | Stanford HELM | framework | https://crfm.stanford.edu/helm/ |
| `openai-evals` | OpenAI Evals | framework | https://github.com/openai/evals |
| `anthropic-evals` | Anthropic Evaluation Documentation | official-docs | https://docs.claude.com/en/docs/test-and-evaluate/develop-tests |
| `langsmith` | LangSmith Evaluation Concepts | official-docs | https://docs.smith.langchain.com/evaluation/concepts |
| `g-eval` | G-Eval | paper | https://arxiv.org/abs/2303.16634 |
| `mt-bench-judge` | MT-Bench / Chatbot Arena: Judging LLM-as-a-Judge | paper | https://arxiv.org/abs/2306.05685 |
| `llm-judge-survey` | LLM-as-a-Judge Survey | paper | https://arxiv.org/abs/2411.15594 |
| `ragas` | RAGAS | framework | https://docs.ragas.io |
| `ares` | ARES | paper | https://arxiv.org/abs/2311.09476 |
| `trulens-triad` | TruLens RAG Triad | framework | https://www.trulens.org/getting_started/core_concepts/rag_triad/ |
| `factscore` | FActScore | paper | https://arxiv.org/abs/2305.14251 |
| `truthfulqa` | TruthfulQA | benchmark | https://arxiv.org/abs/2109.07958 |
| `selfcheckgpt` | SelfCheckGPT | paper | https://arxiv.org/abs/2303.08896 |
| `ifeval` | IFEval | benchmark | https://arxiv.org/abs/2311.07911 |
| `nist-ai-rmf` | NIST AI Risk Management Framework / GenAI Profile | standard | https://www.nist.gov/itl/ai-risk-management-framework |
| `owasp-llm-top10` | OWASP Top 10 for LLM Applications | standard | https://genai.owasp.org/llm-top-10/ |
| `mitre-atlas` | MITRE ATLAS | standard | https://atlas.mitre.org/ |

---

## Pages updated (9)

| Slug | Sources attached | New subsections |
|---|---|---|
| `start-here` | 3 | "Sources behind this guide" UI section |
| `evaluation-principles` | 7 | Principles 16 (calibration drift), 17 (adversarial), 18 (per-run cost) |
| `scoring-rubrics` | 6 | §7a method decision flow, §7b per-dimension cost |
| `hallucination-risk` | 4 | §8a atomic claim extraction in practice, §8b variance signal |
| `groundedness` | 4 | §10a RAG triad in practice, §10b RAGAS-to-tool mapping table |
| `regression-evaluation` | 6 | §13a variance-aware comparison, §13b variable-isolation discipline |
| `human-review` | 5 | §12a adversarial cases in queue, §12b OWASP-aligned safety categories |
| `llm-as-judge` | 6 | §9a pointwise/pairwise/listwise modes, §9b when not to use a judge |
| `evaluation-reports` | 6 | §7a NIST-style evidence artifacts, §7b audience consumption patterns |

Every page now also has: `## Source-backed concepts`, `## Applied in this tool`, `## Sources used`, `## Related topics`.

---

## Source-to-page mapping (compact)

| Source | Pages |
|---|---|
| HELM | evaluation-principles, scoring-rubrics, regression-evaluation, llm-as-judge |
| OpenAI Evals | start-here, evaluation-principles, evaluation-reports, scoring-rubrics, regression-evaluation, llm-as-judge |
| Anthropic Evals | start-here, evaluation-principles, scoring-rubrics |
| LangSmith | start-here, evaluation-reports, regression-evaluation |
| G-Eval | scoring-rubrics, llm-as-judge |
| MT-Bench judge | llm-as-judge, human-review, evaluation-principles, hallucination-risk, regression-evaluation, evaluation-reports |
| LLM-Judge survey | llm-as-judge, evaluation-principles, human-review, regression-evaluation |
| RAGAS | groundedness, scoring-rubrics |
| ARES | groundedness |
| TruLens triad | groundedness |
| FActScore | hallucination-risk, groundedness |
| TruthfulQA | hallucination-risk |
| SelfCheckGPT | hallucination-risk, llm-as-judge |
| IFEval | scoring-rubrics, regression-evaluation |
| NIST AI RMF | evaluation-principles, human-review, evaluation-reports |
| OWASP LLM Top 10 | human-review, evaluation-principles, evaluation-reports, scoring-rubrics |
| MITRE ATLAS | human-review, evaluation-principles |

---

## Claims strengthened

The following Wiki claims now carry source attribution (previously stated without it):

- "No global score; dimensions are scored separately" — Stanford HELM.
- "Rubric must exist before scoring" — Anthropic Evaluation Documentation, OpenAI Evals.
- "Safety is a gate, not a weight" — NIST AI RMF, OWASP LLM Top 10.
- "LLM judges have position / verbosity / self-preference bias" — MT-Bench judge paper.
- "Calibration must be rolling, not one-time" — LLM-as-Judge survey.
- "Judges over-rate fluent outputs" — MT-Bench + G-Eval.
- "Atomic claim extraction with four-label support" — FActScore.
- "False confidence as a distinct hallucination class" — TruthfulQA.
- "Variance across judge samples as a signal" — SelfCheckGPT.
- "Three RAG failure surfaces (context relevance, groundedness, answer relevance)" — TruLens RAG Triad.
- "Faithfulness, answer relevancy, context precision/recall as separable dimensions" — RAGAS.
- "Lightweight RAG judges with confidence intervals" — ARES.
- "Deterministic checks for verifiable requirements" — IFEval.
- "Pinned configuration for cross-run comparison" — OpenAI Evals + LangSmith.
- "Reports are evidence artifacts with audit trail" — NIST AI RMF.
- "Adversarial test cases as part of measurement" — MITRE ATLAS + NIST RMF.
- "OWASP categories for safety findings (prompt injection, sensitive info disclosure, excessive agency, etc.)" — OWASP LLM Top 10.

---

## Product behaviors now better explained

Behaviors that previously had thin justification, now linked to primary sources:

- The refusal to render an overall score without dimension breakdown.
- The `score + rationale + evidence` JSON shape required from LLM judges.
- The cross-family judge recommendation.
- The 2σ rule for regression deltas.
- The misuse-penalty constant of 2× in `groundedness_score`.
- The two-reviewer policy for safety dimensions.
- The OWASP/ATLAS-aligned safety log categorization.
- The rubric editor's warning when >75% of weight sits on judge-based dimensions.
- The "low confidence run" advisory for high-variance judge averages.
- The "Sources behind this guide" surface in the Start Here page.

---

## Remaining gaps

Items the tool's behavior already supports but where source backing could be deeper:

1. **Production-trace sampling (V2).** The Wiki references it; no source card backs it because the design is internal. When implemented, attach LangSmith online-evaluation docs.
2. **Cost reporting in reports.** Mentioned in principles 14 and 18; no dedicated source. Internal product opinion — acceptable.
3. **Per-project safety taxonomy customization.** Currently uses OWASP categories; teams in regulated domains (health, finance) may need additional taxonomies (e.g. HIPAA categories). Not yet documented.
4. **Embedding model versioning for semantic similarity.** The semantic-similarity method depends on a pinned embedding model; this is referenced but not source-backed beyond OpenAI Evals' general pin-config stance.
5. **Calibration set construction.** ARES references human-annotated calibration sets but the Wiki does not yet document how a project should construct its initial calibration set.

---

## Claims that still need verification

Claims kept in the Wiki but worth a second-pass review against primary sources:

- The specific figure that LLM judges agree with humans "at ~80% for strong models" — directionally consistent with MT-Bench but the exact number varies by dimension and dataset. Recommend hedging the language in `human-review.md` from "~80%" to "majority but partial".
- The "5%" calibration sampling rate default — operational opinion, not source-backed. Listed as a default in `human-review.md`; acceptable as a starter heuristic.
- The "2σ" significance threshold — standard statistical convention, not unique to any cited paper. Acceptable.
- The `groundedness_score` misuse penalty constant of 2× — internal product choice. No source mandates this exact number; mark as `default: 2, configurable`. Already done in the article.

None of the above are misattributions; they are calibration items.

---

## Suggested next sources

Candidates for the next integration pass:

1. **OpenAI's "Evaluating LLMs" cookbook / system card releases** — for concrete eval-suite examples.
2. **Anthropic's "Building evals" cookbook (`anthropic-cookbook`)** — code-level examples of structured judge prompts.
3. **DeepEval / Confident AI documentation** — additional RAG eval framework, useful for cross-validation against RAGAS.
4. **Patronus AI / Galileo evaluation papers** — vendor-published but technically grounded RAG eval studies.
5. **OpenAI "How we evaluate models" (Model Spec / Preparedness Framework)** — for safety-eval framing aligned to NIST GenAI Profile.
6. **HELM Lite / HELM Instruct** — newer HELM variants with instruction-following focus, useful for IFEval cross-reference.
7. **OWASP LLM Top 10 v2.0** — the v1 list is cited; v2 (in flight) may add new categories (model DoS, vector store risks).
8. **Hugging Face Open LLM Leaderboard methodology notes** — for benchmark composition discipline.

For each new source: write a card in `source-cards.md`, add an object to `WIKI_SOURCES`, attach to the relevant article's `sourceIds`, and append to the relevant Sources / Related topics blocks.

---

## Integrity checks performed

For every added claim:

- ☑ Is it supported by a source? — Every added paragraph names the source it leans on.
- ☑ Is it framed as product opinion when needed? — "The tool's rule" vs "The literature shows" is consistently distinguished.
- ☑ Is it connected to actual product behavior? — "Applied in this tool" blocks reference specific routes / surfaces.
- ☑ Does it overstate what the source proves? — Hedged language used; no claim is escalated beyond the source's scope.
- ☑ Is it copied too closely from the source? — All paraphrased; no direct quotes longer than 15 words.

The Wiki remains practical and product-facing. The source layer reinforces existing opinions rather than relitigating them.

---

## Session 2 additions (2026-05-22)

Extensions built on top of the source-grounded wiki. Goal: convert passive reading into active practice, with replayable variability and persistent progress.

### Interactive game — Outputs, Please (`/play`)

Papers-Please-style evaluation booth that operationalizes every concept from the wiki.

New files:
- `app/src/lib/playCases.ts` — 20-case pool (c01–c20), 5 categories: `clean` / `safety` / `hallucination` / `groundedness` / `ambiguous`. Each case carries: input, retrieved chunks, AI output, atomic claims with ground-truth labels, optional OWASP safety findings, ground-truth verdict, wiki-slug pointer, concept title + spoiler explanation.
- `app/src/app/play/page.tsx` — 3-stage client UI: briefing → case loop → shift report.
- `app/src/components/sidebar.tsx` — added `Play` nav entry under Advanced with `NEW` badge.
- `app/src/app/wiki/page.tsx` — added `PlayPromoCard` after hero, links to `/play`.

Cases cover the full failure taxonomy:
- c01 clean support · c02 ghost number · c03 citation drift · c04 stitched facts · c05 reverse direction · c06 false confidence · c07 generalized particulars · c08 PII leak (OWASP LLM06) · c09 indirect prompt injection (OWASP LLM01+LLM07) · c10 partial support.
- Pool expansion c11–c20: faithful synthesis · imitative falsehood (TruthfulQA) · stale data · ungrounded-but-reasonable · PII via inference · excessive agency / false confirmation (OWASP LLM08) · correct abstention · cherry-picked chunk · tone violation · verdict-bait clean case.

### Shift sampler (variability + replay determinism)

Added to `playCases.ts`:
- `sampleShift({size, minSafety, minClean, seed})` — Mulberry32 PRNG seeded sampler.
- Constraints: every shift contains ≥1 safety case + ≥1 clean case + N random fillers.
- Seed shown on briefing + report. Same seed = identical shift order = replay determinism.
- "↻ Reshuffle pool" button on briefing produces a fresh seed.
- Default `size: 8`, sampled from 20 → 125,970 unordered combinations.

### End-state rewards + ASCII memes

`ResultScreen` branches into three end states based on combined claim% + verdict% + safety gate:

- **Win** (claim ≥75% + verdict ≥80% + safety PASS) — `WinCard` with three tier titles by combined score:
  - 🏆 Senior Reviewer (combined ≥95) · 🎖️ Trained Reviewer (≥85) · ✅ Cleared for Shift 2 (else)
  - Animated confetti emojis (🎉 ✨ 🎊 ⭐ 💚) absolutely positioned with `animate-bounce` / `animate-pulse`.
  - "Badge unlocked: source-backed reviewer" line.
- **Lose** (safety FAIL OR claim <50% AND verdict <60%) — `LoseMeme` with rotating ASCII memes:
  - "This is fine" 🔥🐕 (always selected when safety failed).
  - "Drake says no" (judge fluency bias framing).
  - "Two buttons" 🥵 (decision paralysis).
  - When safety failed: extra footer citing OWASP LLM01/LLM06/LLM08 + NIST AI RMF Measure function.
- **Mid** (between) — `MidCard` framed as "Calibration drift detected" — same pattern an LLM judge with stale calibration shows.

### Per-article mini-quizzes + Learning Paths green highlight

New files:
- `app/src/lib/wikiQuizzes.ts` — 9 quizzes × 3 questions = 27 total. Each question: 3 options + correct index + `why` explanation. Tests recognition of operational rules, not trivia.
- `app/src/components/ArticleQuiz.tsx` — client component, 3 stages (intro → playing → result). Writes localStorage on all-correct only. Fires `wiki-passed-changed` custom event for cross-component refresh.
- `app/src/components/LearningPathsClient.tsx` — client wrapper that reads localStorage, subscribes to `wiki-passed-changed` + native `storage` events. Highlights passed rows green (`bg-ok/5` + ✓ checkmark + ok-text color). Shows "✓ Complete" badge when whole path done.

Wiring:
- `app/src/app/wiki/[slug]/page.tsx` — `<ArticleQuiz slug={slug} />` rendered after markdown content, before related/nav footer.
- `app/src/app/wiki/start-here/page.tsx` — `<ArticleQuiz slug="start-here" />` rendered as section 09.
- `app/src/app/wiki/page.tsx` — replaced static Learning Paths section with `<LearningPathsClient />`.

Persistence model:
- localStorage key: `wiki:passed` → JSON array of passed slugs.
- Pass requirement: all 3 questions correct on submit (replay allowed, but a partial pass does not write).
- Cross-tab sync via native `storage` event listener.
- Failed attempts show "Not yet" + per-Q ground truth + retry button without writing localStorage.

Quiz coverage maps directly to wiki articles:

| Slug | Question topics |
|---|---|
| start-here | Workflow steps · safety gate semantics · what to read first |
| evaluation-principles | Why no global score (HELM) · hallucination vs ungrounded · judge biases |
| scoring-rubrics | Method selection (deterministic vs judge) · JSON shape · rubric immutability |
| hallucination-risk | Atomic claims · most severe label · citation drift |
| groundedness | True ≠ grounded · TruLens RAG triad · misuse 2× penalty |
| regression-evaluation | Same-dataset rule · 2σ noise · judge averaging |
| llm-as-judge | Position bias · cross-family judge · meta-evaluation |
| human-review | Queue priority · override preservation · required reason |
| evaluation-reports | Three audit questions · header fields · immutable versions |

### Files changed in Session 2

New (4):
- `app/src/lib/playCases.ts` (20-case pool + sampler, ~640 LOC)
- `app/src/app/play/page.tsx` (game UI, ~650 LOC)
- `app/src/lib/wikiQuizzes.ts` (9 quizzes × 3 Q + localStorage helpers)
- `app/src/components/ArticleQuiz.tsx`
- `app/src/components/LearningPathsClient.tsx`

Modified (4):
- `app/src/components/sidebar.tsx` (Play nav)
- `app/src/app/wiki/page.tsx` (PlayPromoCard + LearningPathsClient swap)
- `app/src/app/wiki/[slug]/page.tsx` (ArticleQuiz wired)
- `app/src/app/wiki/start-here/page.tsx` (ArticleQuiz wired)

### Verification

- TSC clean on all new/changed files (only pre-existing `projects/actions.ts` errors remain — unrelated).
- Zero server errors, zero browser console errors across all paths.
- Win path verified: 100% claim + 100% verdict + PASS safety → 🏆 Senior Reviewer + confetti + badge unlock.
- Lose path verified: shipping safety case → safety FAIL banner + "This is fine" ASCII meme + OWASP teaching footer.
- Mid path verified: all-block strategy on mixed shift → "Calibration drift detected" yellow card.
- Sampler verified across three seeds (`769110085` → `911665424` → `886131494`); per-case lists contained mixed c01–c20 cases.
- Quiz pass verified: 3/3 correct on `groundedness` quiz → `localStorage["wiki:passed"] = ["groundedness"]` → AI Engineers path lights up with green ✓ on Groundedness row.
- Quiz fail verified: wrong answers on `llm-as-judge` → "Not yet" banner, localStorage unchanged.
- Cross-tab refresh works via `storage` event listener.

### Pedagogy mapping

The two systems form a teaching loop:

1. **Read** the source-backed wiki article.
2. **Quiz** at the end (3 Q) → marks article complete in Learning Paths.
3. **Play** `/play` — apply concepts on randomized cases.
4. **Result screen** links each failed case back to its wiki slug → re-enter loop.

Win condition for the whole wiki: all 9 articles green-highlighted + Senior Reviewer tier in `/play`.
