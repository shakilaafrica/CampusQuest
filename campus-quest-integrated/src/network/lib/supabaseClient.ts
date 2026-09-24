import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NetworkError } from '../utils/errors';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when .env hasn't been filled in. The main menu shows a setup message instead of crashing. */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('YOUR-PROJECT-REF'));

let client: SupabaseClient | null = null;

/**
 * The one shared Supabase client. Uses the PUBLIC anon key only; Row Level
 * Security in the database decides what each player can access.
 * Never put the service_role key in frontend code.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new NetworkError(
      'The game server isn’t set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file, then restart the game.',
      'NOT_CONFIGURED',
    );
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return client;
}
