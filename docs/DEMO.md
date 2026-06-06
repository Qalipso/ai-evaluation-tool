# Demo guide

Live demo: https://ai-eval-tool.vercel.app/

This page explains what works in the public demo, what needs your own credentials, how to run it locally, and the known limitations.

---

## 90-second demo path

1. Open **Dashboard** — see quality health across projects.
2. Open a **Customer Support** failed run — inspect an unsupported claim + safety finding.
3. Open a **Shadow** run — inspect the claim heat map and partial grounding.
4. Open **Regression** (`/compare`) — compare prompt/model changes.
5. Open **Reports** — export a stakeholder-ready markdown summary.
6. Open **Wiki → Outputs, Please** — practice claim labeling.

---

## What works in the public demo

The public deployment runs on **seeded data** so the full product surface is explorable without keys:

- Dashboard, projects, rubrics, runs, run/case detail
- Claim heat map and per-dimension score breakdowns
- Safety findings and gate logic (pre-computed on seeded cases)
- Regression comparison between seeded runs
- Reports view + `.md` / `.txt` export
- Datasets browse
- Wiki and practice/labeling mode (`/play`)

Read paths are public. Write/evaluation actions may be gated behind an access code when `DEMO_ACCESS_CODE` is set on the deployment (`/enter`).

---

## What requires your own env

Live evaluation calls real providers, so these need credentials:

- **Running a new evaluation** (`/runs/new`) — needs `OPENAI_API_KEY`
- **Persisting projects/rubrics/runs** — needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- **Question/answer generation, LLM judge, claim pipeline, embeddings** — all hit OpenAI

Without env, the app falls back to bundled mock data (read-only, no persistence).

---

## Run locally

```bash
git clone https://github.com/Qalipso/ai-evaluation-tool.git
cd ai-evaluation-tool/app
npm install
cp .env.local.example .env.local
```

Fill `.env.local`:

```bash
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# optional
DEMO_ACCESS_CODE=
DEMO_SESSION_SECRET=
MAX_DAILY_LLM_USD=2
OPENAI_JUDGE_MODEL=gpt-4o-mini
OPENAI_CLAIM_MODEL=gpt-4o-mini
OPENAI_GEN_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
```

Apply migrations in the Supabase SQL editor (in order):

```txt
supabase/migrations/0001_init.sql
supabase/migrations/0002_eval_settings.sql
supabase/migrations/0003_datasets.sql
```

Seed and run:

```bash
npm run seed
npm run dev
```

Open `http://localhost:3000`.

---

## Cost safety

Live LLM calls are capped per day via `MAX_DAILY_LLM_USD` (default `$2`). Spend is tracked server-side in the `daily_spend` table and enforced before each call. Models are restricted to a server-side whitelist; the runner rejects unknown/expensive models.

---

## Known limitations

- **Deterministic checks are selective.** Only `pii_leakage`, `false_confirmation`, `booking_requires_calendar_write`, `manager_request_requires_handoff`, `language_match`, and `output_length_limit` have real automators. Other deterministic dimensions are left `unscored`, never given a placeholder number.
- **Safety scope is narrow by design.** Toxicity, self-harm, and regulated-advice classifiers are roadmap items, not implemented. Calendar/booking gates require a tool trace on the case.
- **PDF export is not implemented** — reports export as `.md` and `.txt`.
- **No production-trace ingestion** and **no cross-model arena** yet (roadmap V2).
- **Public demo data is illustrative** — numbers in seeded runs are for showcasing the surface, not benchmarks.

---

## Useful routes

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/runs/new` | Start an evaluation run (needs env) |
| `/runs/[id]` | Run detail + dimension breakdown |
| `/cases/[id]` | Case detail + claim heat map |
| `/compare` | Regression comparison |
| `/reports` | Export reports |
| `/safety` | Safety findings |
| `/play` | Practice / labeling mode |
| `/wiki` | Evaluation knowledge base |
| `/enter` | Demo access gate (when enabled) |
