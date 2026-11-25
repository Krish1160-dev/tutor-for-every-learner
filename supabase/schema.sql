-- ===========================================================================
-- A Tutor for Every Learner — Supabase schema
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to re-run: every statement is idempotent.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Shared chapter cache
--    One row per (standard, subject, chapter, language). Generated once by the
--    server, then served to every student without calling the AI again.
-- ---------------------------------------------------------------------------
create table if not exists public.chapter_cache (
  id             uuid primary key default gen_random_uuid(),
  standard       text not null,
  subject        text not null,
  chapter        text not null,
  chapter_number int,
  language       text not null,
  exam_notes     jsonb,
  formula_sheet  jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint chapter_cache_unique_key
    unique (standard, subject, chapter, language)
);

create index if not exists chapter_cache_lookup_idx
  on public.chapter_cache (standard, subject, chapter, language);

alter table public.chapter_cache enable row level security;

-- Cached notes are shared study material, not private user data.
drop policy if exists "chapter_cache is readable by everyone" on public.chapter_cache;
create policy "chapter_cache is readable by everyone"
  on public.chapter_cache
  for select
  using (true);

-- Deliberately no insert/update/delete policy:
-- writes go through the service role key on the server only.

-- ---------------------------------------------------------------------------
-- 2. Diagnostic results — one row per finished before/after loop
-- ---------------------------------------------------------------------------
create table if not exists public.diagnostic_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  standard     text not null,
  subject      text not null,
  language     text not null,
  chapter      text,
  topic        text,
  before_score int  not null check (before_score >= 0),
  after_score  int  not null check (after_score >= 0),
  total        int  not null check (total > 0),
  created_at   timestamptz not null default now()
);

create index if not exists diagnostic_results_user_idx
  on public.diagnostic_results (user_id, created_at desc);

alter table public.diagnostic_results enable row level security;

drop policy if exists "students read own results" on public.diagnostic_results;
create policy "students read own results"
  on public.diagnostic_results
  for select
  using (auth.uid() = user_id);

drop policy if exists "students insert own results" on public.diagnostic_results;
create policy "students insert own results"
  on public.diagnostic_results
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "students delete own results" on public.diagnostic_results;
create policy "students delete own results"
  on public.diagnostic_results
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Camera doubts — saved solutions, private to the student
-- ---------------------------------------------------------------------------
create table if not exists public.doubts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  note       text,
  answer     jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists doubts_user_idx
  on public.doubts (user_id, created_at desc);

alter table public.doubts enable row level security;

drop policy if exists "students read own doubts" on public.doubts;
create policy "students read own doubts"
  on public.doubts
  for select
  using (auth.uid() = user_id);

drop policy if exists "students insert own doubts" on public.doubts;
create policy "students insert own doubts"
  on public.doubts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "students delete own doubts" on public.doubts;
create policy "students delete own doubts"
  on public.doubts
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Optional: housekeeping
--    Delete cached chapters that have not been touched in 180 days.
-- ---------------------------------------------------------------------------
-- delete from public.chapter_cache
-- where updated_at < now() - interval '180 days';
