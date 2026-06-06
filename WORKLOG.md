# Work Log

Reverse-chronological log of implementation work turning the docs-first design
into a working, data-flowing application.

## 2026-06-06 — Platform polish, auth gate, datasets

- **Per-case run + progress**: `/api/eval/run/{start,case,finalize}`. Each case
  is a short request with a live progress bar — prod-timeout-safe, survives dev
  hot-reload. Replaced the single long batch action.
- **Command palette** (Cmd/Ctrl+K) over nav/projects/rubrics/runs/cases via
  `/api/index`; **cost meter** + **recent-activity bell** in the top bar.
- **Demo auth gate** (opt-in, `DEMO_ACCESS_CODE`): edge-safe HMAC session
  (`lib/auth`), `middleware` protects `/api/eval/*` + Server Actions, public
  read otherwise. `/enter` + `/api/enter`. Per-IP rate limit (`lib/ratelimit`),
  server-side model whitelist, daily cap lowered to $2.
- **Datasets P0** (migration 0003): versioned `eval_datasets` + `dataset_cases`,
  `/datasets` list/detail, "Save as dataset" on the runner, dock entry.
- **UX**: centered layouts + entrance animations, refined top bar, settings /
  account menus, onboarding tour, loading skeletons, expandable dimension
  breakdown with inline human scoring, dismissible themed demo banner,
  stronger overlay blur, working dashboard action buttons.

## 2026-06-05 — Honesty pass, gates, inline review

- **No fabricated scores**: generic deterministic no longer returns a flat 0.8;
  `semantic_similarity` uses real embedding cosine; `multilingual` does a real
  language-match (output vs input language); `cost_efficiency` is a real
  conciseness check (length / repeated sentences / filler). Dims with no real
  scorer stay unscored. `pipeline_health` derived from data, not hardcoded.
- **Bug fixes**: regression threshold compared a 0..1 delta to a 3-point scale
  (fixed to 0.03); false-confirmation detector matches real phrasing; the safety
  gate now blocks the verdict when a finding's category is in the rubric's gates.
- **New gates** (text-detectable, live): `admin_data_leak_to_client`,
  `operator_command_from_client`, `prompt_injection_followed`,
  `unsupported_price_claim`. Calendar/booking gates remain tool-trace dependent.
- **Input validation** (`lib/validation.ts`): rejects garbage outputs before any
  LLM call.
- **Expandable dimension breakdown** on the run page + **inline human scoring**
  (`saveHumanScore`) — score human dims from the run without leaving the page.
- **Human review queue** grouped by run with case preview + score pill.
- Concurrent batch scoring (Promise.all) to cut wall time and the dev-reload
  window. 29 unit tests.

## 2026-06-05 — Evaluators hub + real claim pipeline

- **Claim pipeline made real** (`lib/eval/claims.ts`): LLM extracts atomic claims
  and verifies each against the retrieved context (supported / partial /
  unsupported / contradicted + confidence + source). Produces a groundedness
  score and **persists claims** (heat map now populated on real runs).
- **Honest scoring**: only `human` dimensions are unscored (routed to review).
  `llm_judge`, `deterministic`, and `claim_pipeline` all score for real; the
  overall is renormalized over scored dimensions. Removed all fabricated 0.80s.
- **Evaluators page** (`/evaluators`): global config (judge model, claim model,
  claim threshold, deterministic toggles) persisted to `eval_settings`; live
  testers for the judge, claim pipeline, and deterministic checks.
- **Per-run model selection** on `/runs/new`, threaded through question
  generation, answer generation, and the LLM judge; stored on the run.
- **`.txt` run export** (`reportText.ts` + `DownloadButton`) — structured report
  for downstream analysis.
- **Theme toggle** (cream / dark) via CSS variables; **macOS-style bottom dock**
  replacing the sidebar.
- Verified live: claim pipeline caught a contradicted fact (990 m vs context
  330 m → groundedness 0.67); deterministic flagged PII + false-confirmation;
  human review persisted and recomputed a case overall.
- Migration `0002_eval_settings.sql` added.

## 2026-06-02..05 — Assisted batch runner + human review

- **Assisted run flow** (`/runs/new`): master prompt → rubric-generated questions
  → model-generated candidate answers → batch evaluation (one run, N cases).
- **Generation endpoints**: `/api/eval/questions`, `/api/eval/answer`.
- **Real human review page** (`/review/[case]`): reviewer scores `human`
  dimensions from the case text; submit persists and recomputes overall.
- Rubric form fixes (weight/threshold inputs), honest demo banner.

## 2026-06-02 — Real engine on Supabase

- **Persistence**: Supabase schema (`0001_init.sql`, 10 tables + RLS + daily
  cost-cap RPC); service-role server client with `ws` polyfill for Node < 22.
- **`db.ts`** async fetchers + mutations with JSON fallback when env is absent;
  `data.ts` reduced to pure types / maps / compute; all pages converted to async.
- **Scoring engine** (`lib/eval/`): `judges.ts` (one structured LLM-judge call),
  `deterministic.ts` (PII / false-confirmation / heuristics), `aggregate.ts`
  (weighted overall + verdict + safety gate, unit-tested), `budget.ts` (daily cap
  via Supabase). 20 vitest unit tests.
- **Runner** + `runEvaluation` server action; CRUD actions route to Supabase
  (fixes serverless read-only FS); `seed.mjs` imports mock data.

## Known follow-ups

- `eval_settings` (0002) must be applied for settings persistence (graceful
  fallback to defaults otherwise).
- Seed data still references a specific demo domain; see the data-model skeleton
  plan to generalize entities (runs → outputs → traces → claims → checks → verdict).
