-- AI Evaluation Tool — initial schema
-- Mirrors the TS interfaces in app/src/lib/data.ts.
-- No auth/multi-tenant in MVP (see roadmap.md). Service-role server access only.

-- ── Reference data ───────────────────────────────────────────────────────────
create table if not exists models (
  id        text primary key,
  provider  text not null default 'custom',
  label     text not null
);

create table if not exists projects (
  id            text primary key,
  name          text not null,
  description   text not null default '',
  owner         text not null default '',
  model         text not null default '',
  active_rubric text not null default '',
  cases_total   integer not null default 0,
  status        text not null default 'active',
  judge_model   text not null default '',
  tags          text not null default '',
  notes         text not null default ''
);

create table if not exists rubrics (
  id           text primary key,
  name         text not null,
  version      text not null default '1.0',
  owner        text not null default '',
  project_id   text references projects(id) on delete set null,
  updated      text not null default '',
  safety_gates jsonb not null default '[]'::jsonb
);

-- Dimensions belong to a rubric. dim_key is the human id ("helpfulness"),
-- unique within a rubric but reused across rubrics, so surrogate uuid pk.
create table if not exists dimensions (
  id         uuid primary key default gen_random_uuid(),
  rubric_id  text not null references rubrics(id) on delete cascade,
  dim_key    text not null,
  name       text not null,
  method     text not null,
  weight     numeric not null default 0,
  threshold  numeric not null default 0,
  ord        integer not null default 0,
  unique (rubric_id, dim_key)
);

-- ── Evaluation runs ──────────────────────────────────────────────────────────
create table if not exists runs (
  id               text primary key,
  project_id       text references projects(id) on delete cascade,
  rubric_id        text references rubrics(id) on delete set null,
  model            text not null default '',
  dataset_id       text not null default '',
  started_at       timestamptz not null default now(),
  cases_total      integer not null default 0,
  cases_passing    integer not null default 0,
  overall_score    numeric not null default 0,
  verdict          text not null default 'needs_work',
  regression_flag  boolean not null default false,
  safety_findings  integer not null default 0,
  variable_changed text not null default ''
);

create table if not exists cases (
  id                text primary key,
  run_id            text not null references runs(id) on delete cascade,
  input             text not null default '',
  expected_behavior text not null default '',
  ai_output         text not null default '',
  retrieved_context jsonb not null default '[]'::jsonb,
  overall_score     numeric not null default 0,
  human_review      text
);

create table if not exists scores (
  id               uuid primary key default gen_random_uuid(),
  case_id          text not null references cases(id) on delete cascade,
  dim_id           text not null,
  score            numeric not null default 0,
  method           text not null,
  rationale        text not null default '',
  threshold_passed boolean not null default false,
  ord              integer not null default 0
);

create table if not exists claims (
  id         uuid primary key default gen_random_uuid(),
  case_id    text not null references cases(id) on delete cascade,
  text       text not null,
  label      text not null,
  confidence numeric not null default 0,
  source_idx integer,
  evidence   text not null default '',
  ord        integer not null default 0
);

create table if not exists safety_findings (
  id       uuid primary key default gen_random_uuid(),
  case_id  text not null references cases(id) on delete cascade,
  category text not null,
  severity text not null,
  evidence text not null default '',
  status   text not null default 'open',
  ord      integer not null default 0
);

-- ── LLM cost cap (replaces in-memory daily spend) ────────────────────────────
create table if not exists daily_spend (
  day       date primary key,
  spend_usd numeric not null default 0
);

-- Atomic increment + read for the budget guard.
create or replace function increment_daily_spend(amount numeric)
returns numeric
language plpgsql
as $$
declare
  total numeric;
begin
  insert into daily_spend (day, spend_usd)
  values (current_date, amount)
  on conflict (day)
  do update set spend_usd = daily_spend.spend_usd + excluded.spend_usd
  returning spend_usd into total;
  return total;
end;
$$;

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_dimensions_rubric on dimensions(rubric_id);
create index if not exists idx_runs_project       on runs(project_id);
create index if not exists idx_cases_run          on cases(run_id);
create index if not exists idx_scores_case        on scores(case_id);
create index if not exists idx_claims_case        on claims(case_id);
create index if not exists idx_safety_case        on safety_findings(case_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- MVP has no end-user auth; the app talks to Supabase with the service role,
-- which bypasses RLS. Enable RLS so the anon/public role has no access by default.
alter table models          enable row level security;
alter table projects        enable row level security;
alter table rubrics         enable row level security;
alter table dimensions      enable row level security;
alter table runs            enable row level security;
alter table cases           enable row level security;
alter table scores          enable row level security;
alter table claims          enable row level security;
alter table safety_findings enable row level security;
alter table daily_spend     enable row level security;
