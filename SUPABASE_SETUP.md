# Campus Quest — Supabase setup

## 1. Create a project
Go to https://supabase.com, create a new project, and wait for it to finish provisioning.

## 2. Run the schema
Open **SQL Editor** in the Supabase dashboard, paste the contents of
`supabase/schema.sql`, and run it. This creates:
- `profiles`, `mission_progress`, `game_sessions`
- Supabase Auth-linked player profiles and ownership-based RLS policies
- `get_campus_quest_stats()`, which returns aggregate counts only and rejects
  callers without an authorised lecturer/tutor profile

The schema migration does not delete existing mission data. Existing demo
profiles have no Auth identity; they must be linked to verified Supabase Auth
users by an administrator before those players can Load Game. Do not let a
browser claim an old profile by student number alone.

## 3. Get your API keys
In **Project Settings → API**, copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`

Never copy the `service_role` key into this project — it must never reach the browser.

## 4. Configure the app
```bash
# Create .env in the project root with these names and your project values:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

In **Authentication → Providers → Email**, disable **Confirm email** for
email/password signups before students use New Game. This is required so
Supabase returns an authenticated session immediately after signup; the app
does not bypass server-side confirmation. Supabase Auth requires an
email-shaped identifier for password authentication, so Campus Quest
internally derives one from the lowercase student number and the hostname from
`VITE_SUPABASE_URL` (for example, `afrsha002@<project-ref>.supabase.co`). This
synthetic identifier is never shown to students and is not a mailbox. Students
only enter their student number and password; Supabase Auth continues to handle
password hashing and sessions.

New Game creates an account only when that student number has no existing
account or profile. If one exists, the student is directed to Load Game; New
Game never resets an existing save. Load Game authenticates with Supabase and
loads the linked profile, avatar, and mission progress. A wrong student number
or password does not create another account.

If an Auth user was created while **Confirm email** was enabled, changing the
setting may not confirm that existing user. An administrator must resolve
those accounts in Supabase Auth before the student can sign in. Do not add
frontend confirmation or verification steps for students.

Staff registration uses real email addresses preloaded in
`public.staff_registration_allowlist` (see section 6). With email confirmation
disabled, the database checks that the submitted address is allowlisted but
does not verify mailbox ownership. Only preload staff addresses you trust. If
you need verified staff mailboxes, use a separate verified staff provisioning
flow rather than relying on this shared email-confirmation setting.

## 5. Install and run
```bash
npm install
npm run dev
```

## 6. Pre-authorize staff emails
The schema seeds these approved accounts:

```sql
insert into public.staff_registration_allowlist (email, role)
values
  ('gstewart@cs.uct.ac.za', 'lecturer'),
  ('mcktar010@myuct.ac.za', 'tutor');
```

When applying `supabase/schema.sql`, these rows are inserted or their roles
updated. To approve additional staff later, an administrator runs an insert
in **SQL Editor**, using lowercase email and the role `lecturer` or `tutor`:

```sql
insert into public.staff_registration_allowlist (email, role)
values ('new.staff@uct.ac.za', 'tutor');
```

The Auth trigger checks this private table and assigns the stored role; users
cannot choose or promote themselves. After approval, staff choose
**Lecturer / Tutor → Register Staff Account** in the app, set a password, then
sign in with that email and password. Registration for any address not in the
table is rejected. The allowlist itself has no browser access. Never expose
the service-role key to the app.

For existing staff Auth accounts, keep the current administrator-managed
profile-linking process; adding an email to the allowlist does not link an
already-created Auth user. The frontend cannot create or promote staff
profiles, and `get_campus_quest_stats()` checks the stored role in the
database on every request.

For each existing demo student save, create/verify a Supabase Auth account
outside the browser and link it explicitly. After verifying the identity and
student number, run an administrator-only update such as:

```sql
update public.profiles
set auth_user_id = 'VERIFIED-AUTH-USER-UUID'
where student_number = 'AFRSHA002'
  and auth_user_id is null
  and role = 'student';
```

Do not use this process to change a student's role. New Game registers a new
student number only; an existing number must use Load Game. Load Game signs in
and retrieves the existing profile, avatar, and mission progress. Logging out
keeps the save.
