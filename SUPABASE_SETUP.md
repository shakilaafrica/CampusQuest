# Campus Quest — Supabase setup

## 1. Create a project
Go to https://supabase.com, create a new project, and wait for it to finish provisioning.

## 2. Run the schema
Open **SQL Editor** in the Supabase dashboard, paste the contents of
`supabase/schema.sql`, and run it. This creates:
- `profiles`, `mission_progress`, `game_sessions`
- Row Level Security policies (see the big comment in the file — the demo
  login model here has no password, so please read that comment before
  assuming this is production-grade security)
- `get_campus_quest_stats()`, the function the lecturer dashboard calls

## 3. Get your API keys
In **Project Settings → API**, copy:
- **Project URL** → `VITE_SUPABASE_URL`
NEXT_PUBLIC_SUPABASE_URL=https://enxdejbqienagdjdebma.supabase.co

- **anon / public key** → `VITE_SUPABASE_ANON_KEY`
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pWrzsZsabib4-HtUoRzEHA_Es7mXOww

Never copy the `service_role` key into this project — it must never reach the browser.

## 4. Configure the app
```bash
cp .env.example .env
# then edit .env and paste in the two values above
```

## 5. Install and run
```bash
npm install
npm run dev
```

## 6. Try the test scenario
1. Enter `AFRSHA002` → choose a player → play/complete Mission 1 → log out.
2. Enter `ABCDEF123` → choose a different player → confirm it shows 0/4 and
   Student 1's progress does not appear.
3. Enter `AFRSHA002` again → confirm it goes straight to the map with
   Player 2 and 1/4 missions, no avatar picker.
4. From the login screen, click **📊 STATS FOR NERDS**, enter `1234` →
   dashboard should open with real counts (they'll be small until a few
   students have played). Any other value should show "Incorrect access
   key." and not open the dashboard.

## Before a real deployment
- Replace student-number-only login with real UCT authentication and
  rewrite the RLS policies to check `auth.uid()` (see the comments in
  `supabase/schema.sql`).
- Replace the `1234` client-side gate on the dashboard with real
  lecturer/admin authorization.
- Set `DEV_UNLOCK_ALL_LEVELS = false` in `src/context/PlayerContext.tsx`.
