/**
 * Node.js admin tool (Campus Quest): give (or remove) admin rights for a username.
 * Runs on a trusted machine only — it uses the service_role key, which
 * bypasses Row Level Security. Never import this file into the React app.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/promote-admin.ts <username> [--revoke]
 */
import { createClient } from '@supabase/supabase-js';

async function main() {
  const [username, flag] = process.argv.slice(2);
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!username) {
    console.error('Usage: npx tsx scripts/promote-admin.ts <username> [--revoke]');
    process.exit(1);
  }
  if (!url || !serviceKey) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell (not in the frontend .env).');
    process.exit(1);
  }

  const role = flag === '--revoke' ? 'player' : 'admin';
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data, error } = await admin
    .from('profiles')
    .update({ role })
    .ilike('username', username)
    .select('username, role');

  if (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.error(`No player called "${username}".`);
    process.exit(1);
  }
  console.log(`${data[0].username} is now ${data[0].role}.`);
}

void main();
