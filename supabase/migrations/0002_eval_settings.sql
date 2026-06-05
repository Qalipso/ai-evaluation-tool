-- Global evaluator configuration (singleton row id=1).
create table if not exists eval_settings (
  id               integer primary key default 1,
  judge_model      text not null default 'gpt-4o-mini',
  claim_model      text not null default 'gpt-4o-mini',
  claim_threshold  numeric not null default 0.8,
  det_pii          boolean not null default true,
  det_false_confirm boolean not null default true,
  updated_at       timestamptz not null default now(),
  constraint eval_settings_singleton check (id = 1)
);

insert into eval_settings (id) values (1) on conflict (id) do nothing;

alter table eval_settings enable row level security;
