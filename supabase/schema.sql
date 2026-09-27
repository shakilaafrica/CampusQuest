-- =========================================================
-- CAMPUS QUEST — Supabase schema
-- Run this in the Supabase SQL editor, or:
--   supabase db push  (if you use the Supabase CLI)
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES
-- One row per student. student_number is the human-readable
-- Campus Quest identity; id is the internal FK target.
-- =========================================================
create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  student_number   text not null unique,
  selected_avatar  text,
  role             text not null default 'student' check (role in ('student', 'lecturer')),
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

create index if not exists profiles_student_number_idx on public.profiles (student_number);

-- =========================================================
-- MISSION PROGRESS
-- One row per (student, mission). completed_at is null until
-- the mission is finished. Unique constraint on (user_id,
-- mission_number) is what makes completeMission() idempotent —
-- a second "complete" call is an UPDATE, never a new row.
-- =========================================================
create table if not exists public.mission_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  mission_number  integer not null check (mission_number between 1 and 4),
  completed       boolean not null default false,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  unique (user_id, mission_number)
);

create index if not exists mission_progress_user_idx on public.mission_progress (user_id);
create index if not exists mission_progress_completed_idx on public.mission_progress (mission_number, completed);

-- =========================================================
-- GAME SESSIONS
-- One row per "play session" (login -> logout / abandoned).
-- last_activity_at is refreshed roughly every 30s by the
-- client while the app is open; it's the source of truth for
-- "is this student online right now".
-- =========================================================
create table if not exists public.game_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  started_at         timestamptz not null default now(),
  last_activity_at   timestamptz not null default now(),
  ended_at           timestamptz
);

create index if not exists game_sessions_user_idx on public.game_sessions (user_id);
create index if not exists game_sessions_activity_idx on public.game_sessions (last_activity_at);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
-- IMPORTANT DEMO CAVEAT — read this before deploying anywhere real:
--
-- This build's login is "type your student number" with no password and
-- no Supabase Auth session, so there is no auth.uid() to check row
-- ownership against. That means RLS here CANNOT cryptographically bind a
-- browser to a specific student_number — anyone with the public anon key
-- could, in principle, query any student's row directly. That is an
-- accepted limitation of the demo login model described in the brief,
-- not an oversight.
--
-- What RLS *does* do here:
--  1. It's a real, enforced boundary between "the public anon key" and
--     "the database" — nothing is exposed that isn't explicitly granted.
--  2. The lecturer dashboard never queries these tables directly from the
--     frontend. It only calls get_campus_quest_stats() below, which is
--     SECURITY DEFINER and returns aggregate counts only — no
--     student_number, no id, no per-student rows. So even a malicious
--     client with the anon key cannot use the "stats" path to dump PII.
--
-- Before a real deployment: replace student-number-only login with real
-- university authentication (Supabase Auth / institutional SSO), add a
-- student_number column check against auth.jwt(), and tighten every
-- policy below to `using (auth.uid() = id)` / `using (auth.uid() = user_id)`.

alter table public.profiles enable row level security;
alter table public.mission_progress enable row level security;
alter table public.game_sessions enable row level security;

create policy "demo: read profile by student number" on public.profiles
  for select using (true);
create policy "demo: create profile" on public.profiles
  for insert with check (true);
create policy "demo: update profile" on public.profiles
  for update using (true) with check (true);

create policy "demo: read mission progress" on public.mission_progress
  for select using (true);
create policy "demo: insert mission progress" on public.mission_progress
  for insert with check (true);
create policy "demo: update mission progress" on public.mission_progress
  for update using (true) with check (true);

create policy "demo: read sessions" on public.game_sessions
  for select using (true);
create policy "demo: insert sessions" on public.game_sessions
  for insert with check (true);
create policy "demo: update sessions" on public.game_sessions
  for update using (true) with check (true);

-- Nothing above grants SELECT * access to an aggregate view of everyone —
-- each query the frontend makes is scoped to one student_number / user_id
-- at a time. Bulk analytics is handled entirely by the RPC below.

-- =========================================================
-- ANALYTICS — get_campus_quest_stats()
-- Backs the "Stats for Nerds" lecturer dashboard. Returns only
-- aggregate counts, never raw student rows, so it's safe to
-- expose to the anon role (the 1234 access-key modal in the
-- frontend is a demo-only UX gate, not what actually protects
-- student data — this function's return shape is what does).
-- =========================================================
create or replace function public.get_campus_quest_stats()
returns table (
  total_profiles          bigint,
  active_now               bigint,
  active_today             bigint,
  total_sessions           bigint,
  full_completions         bigint,
  average_missions         numeric,
  completion_rate          numeric,
  mission_1_completions    bigint,
  mission_2_completions    bigint,
  mission_3_completions    bigint,
  mission_4_completions    bigint
)
language sql
security definer
set search_path = public
as $$
  with completions_per_student as (
    select user_id, count(*) filter (where completed) as n
    from public.mission_progress
    group by user_id
  ),
  starters as (
    select distinct user_id from public.mission_progress
  )
  select
    (select count(*) from public.profiles where role = 'student')                          as total_profiles,
    (select count(distinct user_id) from public.game_sessions
       where ended_at is null and last_activity_at >= now() - interval '2 minutes')         as active_now,
    (select count(distinct user_id) from public.game_sessions
       where last_activity_at >= date_trunc('day', now()))                                  as active_today,
    (select count(*) from public.game_sessions)                                             as total_sessions,
    (select count(*) from completions_per_student where n >= 4)                              as full_completions,
    coalesce((select round(avg(n), 2) from completions_per_student), 0)                      as average_missions,
    coalesce(
      (select round(
         100.0 * (select count(*) from completions_per_student where n >= 4)
         / nullif((select count(*) from starters), 0)
       , 0)),
      0
    )                                                                                        as completion_rate,
    (select count(*) from public.mission_progress where mission_number = 1 and completed)    as mission_1_completions,
    (select count(*) from public.mission_progress where mission_number = 2 and completed)    as mission_2_completions,
    (select count(*) from public.mission_progress where mission_number = 3 and completed)    as mission_3_completions,
    (select count(*) from public.mission_progress where mission_number = 4 and completed)    as mission_4_completions;
$$;

-- The frontend calls this after the "1234" demo gate passes. It's safe to
-- grant to anon because it only ever returns the aggregate row above.
grant execute on function public.get_campus_quest_stats() to anon, authenticated;

-- =========================================================
-- Peak concurrent players — intentionally NOT implemented.
-- The current session model (start/heartbeat/end) can tell you who is
-- active *right now*, but reconstructing historical concurrency correctly
-- requires either a time-bucketed sampling job or interval-overlap
-- analysis over every session, which this schema doesn't collect. Per the
-- brief: better to leave this stat out than show a number that's fabricated
-- or wrong. Add a scheduled sampling job (e.g. pg_cron writing to a
-- `presence_samples` table every minute) if you want this stat later.
-- =========================================================
