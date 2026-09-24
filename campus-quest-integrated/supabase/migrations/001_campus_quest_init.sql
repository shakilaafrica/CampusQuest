-- =====================================================================
-- OrientGame: accounts, saves, mission log, admin stats
-- Run once in the Supabase SQL editor (or with `supabase db push`).
-- Mission ids here MUST match src/network/config/missions.ts
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  username      text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  role          text not null default 'player' check (role in ('player', 'admin')),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);
-- Usernames are unique regardless of case ("Owl" and "owl" clash)
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create table if not exists public.game_saves (
  user_id             uuid primary key references public.profiles on delete cascade,
  completed_missions  text[] not null default '{}',
  badges              text[] not null default '{}',
  state               jsonb  not null default '{}',
  save_version        int    not null default 0,
  updated_at          timestamptz not null default now()
);

create table if not exists public.mission_completions (
  id                bigserial primary key,
  user_id           uuid not null references public.profiles on delete cascade,
  mission_id        text not null,
  score             int,
  duration_seconds  int,
  first_completion  boolean not null default true,
  completed_at      timestamptz not null default now()
);
create index if not exists mission_completions_mission_idx on public.mission_completions (mission_id);
create index if not exists mission_completions_time_idx    on public.mission_completions (completed_at);

-- ---------- Row Level Security ----------------------------------------
-- Players may READ their own rows. There are deliberately NO insert/update/
-- delete policies: every write goes through the security-definer functions
-- below, which validate input. Nobody can change their own role.

alter table public.profiles            enable row level security;
alter table public.game_saves          enable row level security;
alter table public.mission_completions enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "read own save" on public.game_saves;
create policy "read own save" on public.game_saves
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "read own completions" on public.mission_completions;
create policy "read own completions" on public.mission_completions
  for select to authenticated using (user_id = auth.uid());

-- ---------- Mission order (single source of truth in the database) ------

create or replace function public.mission_order()
returns text[]
language sql
immutable
as $$
  select array['jammie_rush', 'wellness_services', 'society_fair', 'student_card']::text[];
$$;

-- ---------- New user trigger ------------------------------------------
-- Creates a profile and an empty save whenever an auth user is created.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_username  text  := meta ->> 'username';
  v_nickname  text  := left(btrim(coalesce(meta ->> 'nickname', '')), 24);
  v_student   text  := upper(btrim(coalesce(meta ->> 'student_number', '')));
  v_explorer  int;
  v_state     jsonb := '{}'::jsonb;
begin
  if v_username is null or v_username !~ '^[A-Za-z0-9_]{3,20}$' then
    -- Accounts created from the Supabase dashboard get a placeholder name
    v_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;

  -- Character chosen on the New Game screen becomes the starting save state
  begin
    v_explorer := (meta ->> 'explorer')::int;
  exception when others then
    v_explorer := null;
  end;
  if v_explorer is null or v_explorer not in (6, 7, 8) then
    v_explorer := 6;
  end if;
  if v_nickname = '' then
    v_nickname := v_username;
  end if;
  v_state := jsonb_build_object('nickname', v_nickname, 'explorer', v_explorer);
  if v_student ~ '^[A-Z0-9]{3,12}$' then
    v_state := v_state || jsonb_build_object('studentNumber', v_student);
  end if;

  insert into public.profiles (id, username) values (new.id, v_username);
  insert into public.game_saves (user_id, state) values (new.id, v_state);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RPC: mark the player as active -----------------------------

create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

-- ---------- RPC: the ONLY way progress is saved ------------------------

create or replace function public.complete_mission(
  p_mission   text,
  p_score     int   default null,
  p_duration  int   default null,
  p_extra     jsonb default '{}'::jsonb
)
returns public.game_saves
language plpgsql
security definer
set search_path = public
as $$
declare
  mission_order text[] := public.mission_order();
  s          public.game_saves;
  n_done     int;
  expected   text;
  new_badge  text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if not (p_mission = any (mission_order)) then
    raise exception 'UNKNOWN_MISSION: %', p_mission;
  end if;

  if p_score is not null and (p_score < 0 or p_score > 100000) then
    raise exception 'INVALID_SCORE';
  end if;

  if p_duration is not null and (p_duration < 0 or p_duration > 86400) then
    raise exception 'INVALID_DURATION';
  end if;

  if p_extra is null or jsonb_typeof(p_extra) <> 'object' or pg_column_size(p_extra) > 8192 then
    raise exception 'INVALID_EXTRA_STATE';
  end if;

  -- Lock this player's save row so two tabs can't double-complete
  select * into s from public.game_saves where user_id = auth.uid() for update;
  if not found then
    raise exception 'SAVE_NOT_FOUND';
  end if;

  -- Replaying an already-completed mission: log it, don't change progress
  if p_mission = any (s.completed_missions) then
    insert into public.mission_completions (user_id, mission_id, score, duration_seconds, first_completion)
    values (auth.uid(), p_mission, p_score, p_duration, false);
    return s;
  end if;

  n_done   := coalesce(array_length(s.completed_missions, 1), 0);
  expected := mission_order[n_done + 1];

  if p_mission is distinct from expected then
    raise exception 'MISSION_LOCKED: expected %, got %', expected, p_mission;
  end if;

  -- Each mission awards its own badge; the last one also marks orientation complete
  new_badge := 'badge_' || p_mission;

  update public.game_saves
     set completed_missions = array_append(completed_missions, p_mission),
         badges             = case
                                when n_done + 1 = array_length(mission_order, 1)
                                  then badges || array[new_badge, 'orientation_complete']
                                else array_append(badges, new_badge)
                              end,
         state              = state || p_extra,
         save_version       = save_version + 1,
         updated_at         = now()
   where user_id = auth.uid()
  returning * into s;

  insert into public.mission_completions (user_id, mission_id, score, duration_seconds, first_completion)
  values (auth.uid(), p_mission, p_score, p_duration, true);

  update public.profiles set last_seen_at = now() where id = auth.uid();

  return s;
end;
$$;

-- ---------- RPC: admin statistics --------------------------------------

create or replace function public.admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if coalesce((select role from public.profiles where id = auth.uid()), '') <> 'admin' then
    raise exception 'NOT_AUTHORISED';
  end if;

  select json_build_object(
    'generated_at',      now(),
    'total_users',       (select count(*) from public.profiles),
    'admin_users',       (select count(*) from public.profiles where role = 'admin'),
    'signups_today',     (select count(*) from public.profiles where created_at > now() - interval '24 hours'),
    'signups_week',      (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'active_24h',        (select count(*) from public.profiles where last_seen_at > now() - interval '24 hours'),
    'finished_game',     (select count(*) from public.game_saves
                          where coalesce(array_length(completed_missions, 1), 0) >= array_length(public.mission_order(), 1)),
    'completions_today', (select count(*) from public.mission_completions where completed_at > now() - interval '24 hours'),
    'progress_funnel',   (
      select coalesce(json_agg(f order by f.missions_completed), '[]'::json)
      from (
        select coalesce(array_length(completed_missions, 1), 0) as missions_completed,
               count(*) as players
        from public.game_saves
        group by 1
      ) f
    ),
    'per_mission',       (
      select coalesce(json_agg(m order by m.mission_id), '[]'::json)
      from (
        select mission_id,
               count(*) filter (where first_completion)     as players_completed,
               count(*) filter (where not first_completion) as replays,
               round(avg(score))::int                       as avg_score,
               round(avg(duration_seconds))::int            as avg_duration_seconds
        from public.mission_completions
        group by mission_id
      ) m
    )
  ) into result;

  return result;
end;
$$;

-- ---------- Function permissions --------------------------------------
-- Supabase grants EXECUTE to public by default; restrict to signed-in users.

revoke all on function public.touch_last_seen()                       from public, anon;
revoke all on function public.complete_mission(text, int, int, jsonb) from public, anon;
revoke all on function public.admin_stats()                           from public, anon;
revoke all on function public.handle_new_user()                       from public, anon, authenticated;

grant execute on function public.mission_order()                         to authenticated;
grant execute on function public.touch_last_seen()                       to authenticated;
grant execute on function public.complete_mission(text, int, int, jsonb) to authenticated;
grant execute on function public.admin_stats()                           to authenticated;

-- ---------- Tidy up test data from earlier versions ---------------------
-- If this project previously ran the OrientGame version of this file, saves may
-- hold mission ids that no longer exist. Reset only those saves.

update public.game_saves
   set completed_missions = '{}', badges = '{}'
 where not (completed_missions <@ public.mission_order());

delete from public.mission_completions
 where not (mission_id = any (public.mission_order()));

-- ---------- Make yourself an admin (edit and run manually) --------------
-- update public.profiles set role = 'admin' where lower(username) = 'your_username';
