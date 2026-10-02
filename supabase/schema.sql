-- =========================================================
-- CAMPUS QUEST — Supabase schema
-- Run this in the Supabase SQL editor, or:
--   supabase db push  (if you use the Supabase CLI)
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES
-- One row per Campus Quest account, linked to trusted Supabase Auth identity.
-- =========================================================
create table if not exists public.profiles (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique references auth.users(id) on delete cascade,
  student_number   text unique,
  selected_avatar  text,
  role             text not null default 'student' check (role in ('student', 'lecturer', 'tutor')),
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

alter table public.profiles add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;
alter table public.profiles alter column student_number drop not null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop constraint if exists profiles_selected_avatar_check;
update public.profiles
set selected_avatar = case selected_avatar
  when 'player-1' then 'npc6'
  when 'player-2' then 'npc7'
  when 'player-3' then 'npc8'
  when 'player-4' then 'npc9'
  else selected_avatar
end;
update public.profiles set selected_avatar = null
where selected_avatar is not null and selected_avatar not in ('npc6', 'npc7', 'npc8', 'npc9', 'npc10');
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'lecturer', 'tutor'));
alter table public.profiles add constraint profiles_selected_avatar_check
  check (selected_avatar is null or selected_avatar in ('npc6', 'npc7', 'npc8', 'npc9', 'npc10'));

create index if not exists profiles_student_number_idx on public.profiles (student_number);

-- Only addresses listed here may self-register for a staff account.
-- The role is assigned from this table, never from browser-supplied metadata.
create table if not exists public.staff_registration_allowlist (
  email          text primary key check (email = lower(trim(email))),
  role           text not null check (role in ('lecturer', 'tutor')),
  auth_user_id   uuid unique references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
insert into public.staff_registration_allowlist (email, role)
values
  ('gstewart@cs.uct.ac.za', 'lecturer'),
  ('mcktar010@myuct.ac.za', 'tutor')
on conflict (email) do update set role = excluded.role;
alter table public.staff_registration_allowlist enable row level security;
revoke all on public.staff_registration_allowlist from anon, authenticated, public;

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
-- AUTH PROFILE PROVISIONING
-- =========================================================
create or replace function public.create_campus_quest_student_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_no text := upper(trim(coalesce(new.raw_user_meta_data ->> 'student_number', '')));
  staff_role text;
begin
  if coalesce(new.raw_user_meta_data ->> 'account_type', '') = 'staff' then
    select role into staff_role
    from public.staff_registration_allowlist
    where email = lower(trim(coalesce(new.email, '')))
      and auth_user_id is null
    for update;

    if staff_role is null then
      raise exception 'This email is not approved for staff registration';
    end if;

    insert into public.profiles (auth_user_id, student_number, role)
    values (new.id, null, staff_role);

    update public.staff_registration_allowlist
    set auth_user_id = new.id
    where email = lower(trim(new.email));
    return new;
  end if;

  if student_no = '' then
    raise exception 'Campus Quest account type is required';
  end if;

  if student_no !~ '^[A-Z]{6}[0-9]{3}$'
    or split_part(lower(coalesce(new.email, '')), '@', 1) <> lower(student_no)
    or split_part(coalesce(new.email, ''), '@', 2) = '' then
    raise exception 'Invalid Campus Quest student account details';
  end if;

  if exists (select 1 from public.profiles where student_number = student_no) then
    raise exception 'This student number already has a saved profile; administrator migration is required';
  end if;

  insert into public.profiles (auth_user_id, student_number, role)
  values (new.id, student_no, 'student');
  return new;
end;
$$;

drop trigger if exists on_campus_quest_auth_user_created on auth.users;
create trigger on_campus_quest_auth_user_created
after insert on auth.users
for each row execute function public.create_campus_quest_student_profile();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.mission_progress enable row level security;
alter table public.game_sessions enable row level security;

drop policy if exists "demo: read profile by student number" on public.profiles;
drop policy if exists "demo: create profile" on public.profiles;
drop policy if exists "demo: update profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own_student" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth_user_id = auth.uid());
create policy "profiles_update_own_student" on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid() and role = 'student')
  with check (auth_user_id = auth.uid() and role = 'student');

drop policy if exists "demo: read mission progress" on public.mission_progress;
drop policy if exists "demo: insert mission progress" on public.mission_progress;
drop policy if exists "demo: update mission progress" on public.mission_progress;
drop policy if exists "mission_progress_select_own" on public.mission_progress;
drop policy if exists "mission_progress_insert_own" on public.mission_progress;
drop policy if exists "mission_progress_update_own" on public.mission_progress;
create policy "mission_progress_select_own" on public.mission_progress
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  );
create policy "mission_progress_insert_own" on public.mission_progress
  for insert to authenticated with check (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  );
create policy "mission_progress_update_own" on public.mission_progress
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  ) with check (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  );

drop policy if exists "demo: read sessions" on public.game_sessions;
drop policy if exists "demo: insert sessions" on public.game_sessions;
drop policy if exists "demo: update sessions" on public.game_sessions;
drop policy if exists "game_sessions_select_own" on public.game_sessions;
drop policy if exists "game_sessions_insert_own" on public.game_sessions;
drop policy if exists "game_sessions_update_own" on public.game_sessions;
create policy "game_sessions_select_own" on public.game_sessions
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid())
  );
create policy "game_sessions_insert_own" on public.game_sessions
  for insert to authenticated with check (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  );
create policy "game_sessions_update_own" on public.game_sessions
  for update to authenticated using (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  ) with check (
    exists (select 1 from public.profiles p where p.id = user_id and p.auth_user_id = auth.uid() and p.role = 'student')
  );

revoke all on public.profiles, public.mission_progress, public.game_sessions from anon, authenticated, public;
grant select on public.profiles to authenticated;
grant update (selected_avatar, last_seen_at) on public.profiles to authenticated;
grant select on public.mission_progress to authenticated;
grant insert (user_id, mission_number, completed, completed_at) on public.mission_progress to authenticated;
grant update (user_id, mission_number, completed, completed_at) on public.mission_progress to authenticated;
grant select on public.game_sessions to authenticated;
grant insert (user_id) on public.game_sessions to authenticated;
grant update (last_activity_at, ended_at) on public.game_sessions to authenticated;

create or replace function public.campus_quest_student_number_exists(requested_student_number text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select upper(trim(coalesce(requested_student_number, ''))) ~ '^[A-Z]{6}[0-9]{3}$'
    and (
      exists (
        select 1 from public.profiles
        where student_number = upper(trim(requested_student_number))
          and role = 'student'
      )
      or exists (
        select 1 from auth.users
        where upper(trim(coalesce(raw_user_meta_data ->> 'student_number', ''))) = upper(trim(requested_student_number))
      )
    );
$$;

revoke all on function public.campus_quest_student_number_exists(text) from public, anon, authenticated;
grant execute on function public.campus_quest_student_number_exists(text) to anon, authenticated;

create or replace function public.start_new_campus_quest_game()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  student_profile_id uuid;
begin
  select id into student_profile_id
  from public.profiles
  where auth_user_id = auth.uid() and role = 'student'
  for update;

  if student_profile_id is null then
    raise exception 'An authenticated student profile is required' using errcode = '42501';
  end if;

  delete from public.mission_progress where user_id = student_profile_id;
  update public.profiles
  set selected_avatar = null, last_seen_at = now()
  where id = student_profile_id;
end;
$$;

revoke all on function public.start_new_campus_quest_game() from public, anon, authenticated;
grant execute on function public.start_new_campus_quest_game() to authenticated;

-- =========================================================
-- ANALYTICS — get_campus_quest_stats()
-- Backs the "Stats for Nerds" lecturer dashboard. Returns only
-- aggregate counts, never raw student rows. The function itself
-- checks that auth.uid() belongs to an authorised staff profile.
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
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role in ('lecturer', 'tutor')
  ) then
    raise exception 'Staff authorisation required' using errcode = '42501';
  end if;

  return query
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
  end;
$$;

revoke all on function public.get_campus_quest_stats() from public, anon;
grant execute on function public.get_campus_quest_stats() to authenticated;

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
