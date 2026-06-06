# Engineering Notes — AI Evaluation Tool

Key technical decisions, trade-offs, and architectural reasoning. Intended for technical interviews and engineering review.

> **Read this as an architecture evolution.** The project started as a documentation-first portfolio artifact with a file-system mock, then grew a real evaluation engine (Supabase + OpenAI). Both phases are described below so the reasoning — and the migration path — stays visible. Where a decision changed, it is marked **Then → Now**.

---

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 15 App Router | RSC for reads, server actions / route handlers for writes |
| Language | TypeScript 5 | strict; `tsc --noEmit` in CI |
| Styling | Tailwind CSS 3 | cream + dark themes via CSS vars |
| Data | Supabase (PostgreSQL) | mock JSON fallback when env absent |
| LLM | OpenAI SDK 6 (GPT-4o-mini) | judge, claim pipeline, answer/question gen, embeddings |
| Validation | Zod 4 | boundary validation on inputs |
| Tests | Vitest 2 | unit: deterministic, aggregate |
| CI | GitHub Actions | lint · typecheck · test · build |
| Deployment | Vercel | `rootDirectory = app/` |

---

## Architecture evolution (Phase 0 → Phase 1)

**Phase 0 — documentation-first demo.** File-system JSON under `mock-data/`, all reads via `fs`, every dynamic route statically pre-rendered. Goal: prove the data model and pipeline UX without a backend.

**Phase 1 — real engine (current).** Supabase Postgres persistence, real OpenAI calls for scoring, per-case run API with live progress, daily cost cap. The mock layer survives as a **read-only fallback** when `SUPABASE_*` env is absent, so the public demo still works keyless.

The clean separation built in Phase 0 (a data-access module the app layer talks to) is exactly what made the Phase 1 swap cheap.

---

## Key Technical Decisions

### 1. Data layer: mock JSON → Supabase, behind one access module

**Then:** `mock-data/*.json` read on each request with `fs`. No database. Acceptable for a portfolio demo; it demonstrated the schema and UX without operational overhead.

**Now:** `src/lib/db.ts` is the single data-access surface. When `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set it reads/writes Postgres (`src/lib/supabase.ts`); otherwise it falls back to the bundled mock JSON (read-only, no persistence).

**Rationale:** the application/RSC layer calls `fetchRun`, `fetchCasesByRun`, etc. — it never knows whether the bytes came from Postgres or a JSON file. The repository-style boundary that was theoretical in Phase 0 is now load-bearing.

**Schema:** three migrations under `supabase/migrations/` — `0001_init` (projects, rubrics, runs, cases, scores, claims, safety_findings, human_overrides, daily_spend + RLS + cost-cap RPC), `0002_eval_settings` (judge/claim model, thresholds, toggles), `0003_datasets` (versioned datasets).

**Trade-off:** two code paths (live vs mock) must stay in sync on shape. Mitigated by shared TypeScript types and Zod schemas across both.

---

### 2. Real scoring, no fabricated numbers

**Decision:** five scoring methods, each either genuinely real or explicitly `unscored` — never a placeholder.

- `llm_judge` — one structured GPT-4o-mini call per dimension, returns score + rationale.
- `claim_pipeline` — atomic claim extraction + verification against retrieved context → groundedness; persisted claims drive the heat map.
- `semantic_similarity` — real embedding cosine vs the expected behavior (hash fallback when no embed provider).
- `deterministic` — real only for PII, false-confirmation, language-match, and length/conciseness. Other deterministic dimensions return `unscored`.
- `human` — manual override, routed to the review queue.

**Rationale:** the whole product thesis is "evidence, not vibes." A demo that fabricates scores would contradict its own argument. An honest `unscored` is worth more than a fake `0.0`.

---

### 3. Per-case run API instead of one long action

**Decision:** a batch run is scored case-by-case through small requests: `POST /api/eval/run/start` → N× `POST /api/eval/run/case` → `POST /api/eval/run/finalize`, with a live progress bar.

**Rationale:** scoring 40 cases in a single request would blow serverless timeouts and give no feedback. Per-case requests are timeout-safe on Vercel and stream progress to the UI.

**Trade-off:** more round-trips and client-side orchestration vs one server loop. Worth it for prod-safety and UX.

---

### 4. Cost safety as a first-class constraint

**Decision:** every LLM call checks a daily budget (`MAX_DAILY_LLM_USD`, default `$2`) tracked server-side in `daily_spend`; models are restricted to a server-side whitelist; garbage inputs are rejected before any call.

**Rationale:** a public demo that hits a paid API is an open wallet. The cost surface must be bounded by construction, not by trust.

---

### 5. Server components for reads, server actions / route handlers for writes

**Decision:** data fetching in RSC; rubric editor, review interactions, runner orchestration, and filters are `"use client"`. Writes go through server actions and `/api/eval/*` route handlers.

**Rationale:** RSC removes useEffect data-fetch waterfalls and loading flicker; read pages ship minimal client JS. Only serializable plain objects cross the RSC/client boundary, which disciplines the data model.

---

### 6. Static where static, dynamic where dynamic

**Then:** every `[id]`/`[slug]` route used `generateStaticParams` — valid when all data was static JSON.

**Now:** content-static routes (wiki) stay SSG; data-backed routes (`/runs/[id]`, `/cases/[id]`) render dynamically so live Supabase data shows without a rebuild. The build output reflects this split (`○` static, `ƒ` dynamic, `●` SSG).

---

### 7. SSR/CSR determinism (hydration discipline)

**Problem encountered:** the `/play` practice mode seeded its shift with `Math.random()` in a `useState` initializer. Server and client produced different seeds → React #418 hydration mismatch.

**Fix:** render a fixed `SSR_SEED` for the first paint (server + first client render match), then re-roll a random shift in a mount `useEffect`. No mismatch, randomness preserved.

**Lesson:** anything random/time-based in initial render must be deterministic for SSR and only diverge after mount.

---

### 8. Vercel: everything runtime-readable must live in `app/`

**Problem encountered:** `mock-data/` and `wiki/` lived at the repo root, outside the Vercel `rootDirectory` (`app/`). Runtime `fs` reads failed.

**Fix:** copied both into `app/`; updated `process.cwd()` joins and path aliases.

**Lesson:** with `rootDirectory` set, treat `app/` as the filesystem root — nothing outside it exists at runtime.

---

## Type System Highlights

Discriminated unions for scoring methods give an exhaustive switch at the engine — adding a method forces handling it everywhere. Verdicts and claim labels are closed unions (`ship_ready | acceptable_with_caveats | needs_work | blocked`; `supported | partially_supported | unsupported | contradicted`) so display maps and DB rows can't drift. Rubric dimensions are `ReadonlyArray` — a new version is created by spread, never mutated in place.

---

## Performance

- Wiki + static surfaces pre-rendered (SSG); data routes dynamic with Supabase reads.
- Reads flow through RSC props — minimal client-side fetching.
- Tailwind purges unused CSS at build.
- Vercel Edge CDN for static assets.

---

## What I Would Add Next

1. **Background job runner.** Move batch scoring from per-case client orchestration to a real queue (Inngest / BullMQ) with SSE progress — removes client coupling.
2. **LLM provider abstraction.** A `LlmJudge` interface with `openai` / `anthropic` / `local` impls; model already a run property, provider next.
3. **Judge calibration dashboard.** `human_overrides` already captures human-vs-judge deltas; surface systematic bias over time.
4. **PDF report export.** `.md` / `.txt` exist; add a rendered PDF.
5. **Production-trace ingestion + cross-model arena** (roadmap V2).
