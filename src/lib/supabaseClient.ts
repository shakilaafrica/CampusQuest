import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY have real values. */
export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured) {
  // Loud in dev, harmless in prod — this just means .env hasn't been set up yet.
  // eslint-disable-next-line no-console
  console.warn(
    '[Campus Quest] Supabase is not configured. Copy .env.example to .env and set ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. See the README for setup steps.'
  );
}

// A syntactically valid placeholder URL lets createClient() succeed even when
// unconfigured, so the rest of the app can render a friendly error screen
// instead of a blank crash. Every real call will fail fast — see PlayerContext.
export const supabase = createClient(
  url && url.length > 0 ? url : 'https://placeholder.supabase.co',
  anonKey && anonKey.length > 0 ? anonKey : 'placeholder-anon-key',
  { auth: { persistSession: false } }
);
