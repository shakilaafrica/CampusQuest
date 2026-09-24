import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminStats } from '../services/adminService';
import type { AdminStats } from '../types';
import { toNetworkError, type NetworkError } from '../utils/errors';

/** Loads admin stats and refreshes them on an interval (default 30 s). */
export function useAdminStats(refreshMs = 30_000) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<NetworkError | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchAdminStats();
      if (!mounted.current) return;
      setStats(s);
      setError(null);
    } catch (err) {
      if (mounted.current) setError(toNetworkError(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const id = window.setInterval(() => void refresh(), refreshMs);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [refresh, refreshMs]);

  return { stats, error, loading, refresh };
}
