import { useEffect, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';

// DEMO ONLY.
// Replace this client-side access key with proper authenticated
// lecturer/admin authorization before production deployment. The "1234"
// check below gates the UI only — the data it unlocks is already safe to
// expose because get_campus_quest_stats() (see supabase/schema.sql) is a
// SECURITY DEFINER function that returns aggregate counts only, never raw
// student rows.
const DEMO_ACCESS_KEY = '1234';
const REFRESH_INTERVAL_MS = 30_000;

interface Stats {
  total_profiles: number;
  active_now: number;
  active_today: number;
  total_sessions: number;
  full_completions: number;
  average_missions: number;
  completion_rate: number;
  mission_1_completions: number;
  mission_2_completions: number;
  mission_3_completions: number;
  mission_4_completions: number;
}

export default function StatsForNerds({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [key, setKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);

  if (!unlocked) {
    return (
      <div className="modal">
        <div className="brief cq-stats-gate">
          <div className="kicker">STATS FOR NERDS</div>
          <h1>Lecturer / Demo Access</h1>
          <label className="cq-field-label">Access Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setKeyError(null); }}
            placeholder="••••"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (key === DEMO_ACCESS_KEY) setUnlocked(true);
                else setKeyError('Incorrect access key.');
              }
            }}
          />
          {keyError && <div className="cq-error">{keyError}</div>}
          <button
            className="primary"
            onClick={() => {
              if (key === DEMO_ACCESS_KEY) setUnlocked(true);
              else setKeyError('Incorrect access key.');
            }}
          >
            VIEW STATS
          </button>
          <button className="secondary" onClick={onClose}>CANCEL</button>
        </div>
      </div>
    );
  }

  return <Dashboard onClose={onClose} />;
}

function Dashboard({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabaseConfigured) {
        setError('Supabase is not configured — set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
        return;
      }
      const { data, error: rpcError } = await supabase.rpc('get_campus_quest_stats');
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      setStats(row as Stats);
      setError(null);
    }

    void load();
    timerRef.current = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const maxMissionCount = stats
    ? Math.max(
        1,
        stats.mission_1_completions,
        stats.mission_2_completions,
        stats.mission_3_completions,
        stats.mission_4_completions
      )
    : 1;

  return (
    <div className="modal">
      <div className="brief cq-stats-dashboard">
        <div className="cq-stats-header">
          <div>
            <div className="kicker">📊 STATS FOR NERDS</div>
            <h1>Campus Quest Live Analytics</h1>
          </div>
          <div className="cq-live">LIVE ●</div>
        </div>

        {error && <div className="cq-error">Couldn't load stats: {error}</div>}
        {!error && !stats && <div className="cq-loading">Loading stats…</div>}

        {stats && (
          <>
            <div className="cq-stat-grid">
              <StatTile label="PLAYING RIGHT NOW" value={stats.active_now} />
              <StatTile label="STUDENT PROFILES" value={stats.total_profiles} />
              <StatTile label="ACTIVE TODAY" value={stats.active_today} />
              <StatTile label="TOTAL QUEST SESSIONS" value={stats.total_sessions} />
              <StatTile label="SCIKNIGHTS CREATED" value={stats.full_completions} />
              <StatTile label="AVERAGE MISSIONS COMPLETED" value={`${stats.average_missions} / 4`} />
              <StatTile label="QUEST COMPLETION RATE" value={`${stats.completion_rate}%`} />
            </div>

            <div className="cq-mission-progress">
              <b>MISSION PROGRESS</b>
              {[
                ['Mission 1', stats.mission_1_completions],
                ['Mission 2', stats.mission_2_completions],
                ['Mission 3', stats.mission_3_completions],
                ['Mission 4', stats.mission_4_completions],
              ].map(([label, value]) => (
                <div className="cq-bar-row" key={label as string}>
                  <span>{label}</span>
                  <div className="cq-bar-track">
                    <div
                      className="cq-bar-fill"
                      style={{ width: `${(100 * (value as number)) / maxMissionCount}%` }}
                    />
                  </div>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="secondary" onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="cq-stat-tile">
      <div className="cq-stat-label">{label}</div>
      <div className="cq-stat-value">{value}</div>
    </div>
  );
}
