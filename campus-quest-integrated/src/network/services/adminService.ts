import { getSupabase } from '../lib/supabaseClient';
import type { AdminStats } from '../types';
import { toNetworkError } from '../utils/errors';

/** Fetches management stats. The database rejects this for non-admins. */
export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await getSupabase().rpc('admin_stats');
  if (error) throw toNetworkError(error, 'Couldn’t load admin stats.');
  return data as AdminStats;
}
