# Campus Quest

A UCT orientation game with four missions across Upper Campus: Jammie Rush, Student Wellness Services Wanted, Society Fair and Operation: Student Card. Accounts, saved progress, live player counts and admin stats are stored in Supabase.

## Main menu

| Option | What it does |
|---|---|
| New Game | Creates an account (username, password, nickname, student number, explorer) and starts mission 1 |
| Load Game | Logs in to an existing account and continues from the last completed mission |
| Dev Options | Admin sign-in, then live management stats |
| Exit Game | Signs out and closes the game (or shows a "you can close this tab" screen) |

Progress saves only when a mission is completed. Leaving a mission early saves nothing, and replaying a finished mission doesn't change progress.

## First-time setup

### 1. Supabase (once per project)

1. Create a project at supabase.com.
2. In **SQL Editor**, paste all of `supabase/migrations/001_campus_quest_init.sql` and run it. It's safe to re-run.
3. In **Authentication → Providers → Email**, switch **off** "Confirm email". Players log in with usernames, which are mapped to private addresses that never receive mail.
4. On the same page, set the password requirements to match the game: at least 8 characters, with lowercase, uppercase, digits and symbols.
5. In **Project Settings → API**, copy the Project URL and the `anon` `public` key.

### 2. Run the game

```bash
npm install
cp .env.example .env      # then paste in the URL and anon key
npm run dev
```

Open the Local URL Vite prints (normally http://localhost:5173/). Restart `npm run dev` whenever you edit `.env`. Without a `.env`, the main menu shows a setup message instead of connecting.

### 3. Make an admin for Dev Options

Create a normal account with New Game, then either run this in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where lower(username) = 'your_username';
```

or use the Node script from a trusted machine. The service-role key goes in your shell only, never in `.env`:

```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run promote-admin -- your_username
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run promote-admin -- your_username --revoke
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Builds the full site, all missions included, into `dist/` |
| `npm run preview` | Serves the built `dist/` locally to check it |
| `npm run typecheck` | TypeScript check of the game shell and network code |

## Hosting

`npm run build` produces a static site in `dist/`. Any static host works (Vercel, Netlify, GitLab Pages), including on a sub-path, because the build uses relative paths. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings. They're read at build time, so redeploy after changing them.

## Project layout

```
index.html                     game entry
src/
  main.ts                      starts on the main menu
  style.css                    game styles
  game/
    mainMenu.ts                main menu + Exit Game
    accountScreens.ts          New Game + Load Game
    devOptions.ts              admin sign-in + stats panel
    campus.ts                  campus map, briefings, mission frames, the save point
    dom.ts                     screen rendering, escaping, asset paths
  network/
    session.ts                 shared login/save/presence store (used by every screen)
    config/missions.ts         mission ids, order, map positions, pages
    services/                  Supabase calls: auth, saves, presence, admin stats
    components/                React admin stats panel
    lib/supabaseClient.ts      the one Supabase client
missions/                      Jammie, Wellness and Student Card mission sources (built by Vite)
public/
  assets/                      campus map and explorer sprites
  missions/society/            pre-built Society Fair mission (served as-is)
supabase/migrations/           database setup
scripts/promote-admin.ts       grant/revoke admin
```

## Adding or renaming a mission

Mission ids must match in two places:

- `src/network/config/missions.ts`
- `public.mission_order()` in the SQL file (re-run the SQL after changing it)

A new mission page also needs an entry in `vite.config.ts` under `build.rollupOptions.input`, unless it's pre-built and placed in `public/missions/`.

## Reporting completion from inside a mission

Right now completion is registered with the ✓ button in the mission toolbar. A mission can report it directly instead:

```ts
window.parent.postMessage({ type: 'campusquest:mission-complete', missionId: 'wellness_services' }, '*');
```

The game listens for this message only from its own origin, and only for the mission that's currently open.

## Security

- Only the public anon key is in the frontend. Row Level Security means players can read only their own profile and save.
- Players can't write to tables directly. All progress goes through `complete_mission`, which checks mission order on the server.
- Players can't make themselves admin. Admin stats are refused by the database for anyone else, not just hidden.
- Presence shares only a random tab id and the current screen, never usernames.
- Anything a player types is escaped before it's displayed.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "The game server isn't set up yet" | `.env` is missing or unfilled. Restart `npm run dev` after editing it. |
| New Game says email confirmation is on | Turn off "Confirm email" (setup step 1.3). |
| "That username is taken" | Usernames are case-insensitive, so `Owl` and `owl` clash. |
| "This mission isn't unlocked yet" | Mission ids differ between `missions.ts` and the SQL file. |
| Dev Options says no access | The account isn't an admin yet (see step 3). |
| Online count stays at 0 | Check Realtime is enabled for the Supabase project. |
