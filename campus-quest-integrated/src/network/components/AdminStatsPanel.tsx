import { useGameSession } from '../context/GameSessionProvider';
import { useAdminStats } from '../hooks/useAdminStats';
import { MISSIONS, missionTitle } from '../config/missions';
import './network.css';

export interface AdminStatsPanelProps {
  onClose?: () => void;
  refreshMs?: number;
  className?: string;
}

const SCREEN_LABELS: Record<string, string> = {
  main_menu: 'Main menu',
  new_game: 'Creating an account',
  load_game: 'Loading a game',
  dev_options: 'Dev sign-in',
  admin: 'Dev stats',
  map: 'Campus map',
  briefing: 'Mission briefing',
};

function screenLabel(screen: string): string {
  if (screen.startsWith('mission:')) return missionTitle(screen.slice('mission:'.length));
  return SCREEN_LABELS[screen] ?? screen;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

/**
 * Management stats for admin accounts. Render it only when `isAdmin` is true;
 * the database refuses the request for anyone else regardless.
 */
export function AdminStatsPanel({ onClose, refreshMs, className }: AdminStatsPanelProps) {
  const { isAdmin, online } = useGameSession();
  const { stats, error, loading, refresh } = useAdminStats(refreshMs);

  if (!isAdmin) {
    return (
      <section className={`og-net og-admin ${className ?? ''}`}>
        <p className="og-alert">Only admin accounts can view these stats.</p>
      </section>
    );
  }

  const screens = Object.entries(online.byScreen).sort((a, b) => b[1] - a[1]);
  const perMission = MISSIONS.map((m) => ({
    ...m,
    row: stats?.per_mission.find((r) => r.mission_id === m.id),
  }));
  const funnelMax = Math.max(1, ...(stats?.progress_funnel.map((f) => f.players) ?? [1]));

  return (
    <section className={`og-net og-admin ${className ?? ''}`} aria-labelledby="og-admin-title">
      <header className="og-admin__header">
        <h2 id="og-admin-title" className="og-admin__title">Management stats</h2>
        <div className="og-admin__actions">
          <button type="button" className="og-btn og-btn--quiet" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          {onClose && (
            <button type="button" className="og-btn" onClick={onClose}>
              Back to main menu
            </button>
          )}
        </div>
      </header>

      <div className="og-admin__live" aria-live="polite">
        <span className="og-admin__live-dot" aria-hidden="true" />
        <strong className="og-admin__live-count">{online.total}</strong>
        <span>{online.total === 1 ? 'player online now' : 'players online now'}</span>
      </div>

      {screens.length > 0 && (
        <ul className="og-admin__screens" aria-label="Where players are right now">
          {screens.map(([screen, count]) => (
            <li key={screen}>
              <span>{screenLabel(screen)}</span>
              <span className="og-admin__num">{count}</span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="og-alert" role="alert">
          {error.message}
        </p>
      )}

      {stats && (
        <>
          <dl className="og-admin__totals">
            <div><dt>Accounts</dt><dd>{stats.total_users}</dd></div>
            <div><dt>New in 24 h</dt><dd>{stats.signups_today}</dd></div>
            <div><dt>New in 7 days</dt><dd>{stats.signups_week}</dd></div>
            <div><dt>Active in 24 h</dt><dd>{stats.active_24h}</dd></div>
            <div><dt>Missions done in 24 h</dt><dd>{stats.completions_today}</dd></div>
            <div><dt>Finished the game</dt><dd>{stats.finished_game}</dd></div>
          </dl>

          <h3 className="og-admin__subtitle">Progress through the game</h3>
          <ol className="og-funnel">
            {Array.from({ length: MISSIONS.length + 1 }, (_, n) => {
              const players = stats.progress_funnel.find((f) => f.missions_completed === n)?.players ?? 0;
              return (
                <li key={n} className="og-funnel__row">
                  <span className="og-funnel__label">
                    {n === 0 ? 'Not started' : n === MISSIONS.length ? 'All missions' : `${n} of ${MISSIONS.length}`}
                  </span>
                  <span className="og-funnel__bar" style={{ inlineSize: `${(players / funnelMax) * 100}%` }} />
                  <span className="og-admin__num">{players}</span>
                </li>
              );
            })}
          </ol>

          <h3 className="og-admin__subtitle">Missions</h3>
          <div className="og-admin__table-wrap">
            <table className="og-admin__table">
              <thead>
                <tr>
                  <th scope="col">Mission</th>
                  <th scope="col">Players done</th>
                  <th scope="col">Replays</th>
                  <th scope="col">Avg score</th>
                  <th scope="col">Avg time</th>
                </tr>
              </thead>
              <tbody>
                {perMission.map(({ id, title, row }) => (
                  <tr key={id}>
                    <th scope="row">{title}</th>
                    <td>{row?.players_completed ?? 0}</td>
                    <td>{row?.replays ?? 0}</td>
                    <td>{row?.avg_score ?? '—'}</td>
                    <td>{formatDuration(row?.avg_duration_seconds ?? null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="og-admin__stamp">
            Updated {new Date(stats.generated_at).toLocaleTimeString()}. Online count updates live.
          </p>
        </>
      )}
    </section>
  );
}
