-- Versioned evaluation datasets: reusable test sets so runs are repeatable and
-- regression is apples-to-apples (same dataset version across model/prompt).

create table if not exists eval_datasets (
  id          text primary key,
  project_id  text references projects(id) on delete set null,
  name        text not null,
  version     text not null default 'v1',
  description text not null default '',
  source      text not null default 'llm',         -- human | llm | mixed
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists dataset_cases (
  id                text primary key,
  dataset_id        text not null references eval_datasets(id) on delete cascade,
  input             text not null default '',
  expected_behavior text not null default '',
  expected_language text,
  difficulty        text not null default 'medium', -- easy | medium | hard | edge
  category          jsonb not null default '[]'::jsonb,
  is_critical       boolean not null default false,
  tags              jsonb not null default '[]'::jsonb,
  ord               integer not null default 0
);

-- Runs reference the dataset version they evaluated (id stays text, no hard FK
-- so existing 'adhoc'/'generated' values remain valid).
alter table runs add column if not exists dataset_version text;

create index if not exists idx_dataset_cases_dataset on dataset_cases(dataset_id);
create index if not exists idx_eval_datasets_project on eval_datasets(project_id);

alter table eval_datasets enable row level security;
alter table dataset_cases enable row level security;
