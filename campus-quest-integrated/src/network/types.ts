import type { MissionId } from './config/missions';

export type Role = 'player' | 'admin';

export interface Profile {
  id: string;
  username: string;
  role: Role;
  created_at: string;
  last_seen_at: string;
}

/** Explorer sprites available on the New Game screen. */
export type ExplorerId = 6 | 7 | 8;
export const EXPLORERS: readonly ExplorerId[] = [6, 7, 8];

/** Character details chosen on the New Game screen. Stored with the account when it's created. */
export interface CharacterInfo {
  nickname: string;
  studentNumber: string;
  explorer: ExplorerId;
}

/** Extra state stored in the save alongside mission progress. */
export interface SaveState extends Partial<CharacterInfo> {
  [key: string]: unknown;
}

export interface GameSave {
  user_id: string;
  completed_missions: MissionId[];
  badges: string[];
  state: SaveState;
  save_version: number;
  updated_at: string;
}

export interface MissionResult {
  /** Optional score for admin stats (0 to 100000). */
  score?: number;
  /** Seconds the player spent on the mission (0 to 86400). */
  durationSeconds?: number;
  /** Extra state to merge into the save (max ~8 KB of JSON). */
  extra?: SaveState;
}

/** Screens reported through presence so admins can see where players are. */
export type GameScreen =
  | 'main_menu'
  | 'new_game'
  | 'load_game'
  | 'dev_options'
  | 'admin'
  | 'map'
  | 'briefing'
  | `mission:${MissionId}`;

export interface PresenceSummary {
  total: number;
  byScreen: Record<string, number>;
}

export interface AdminStats {
  generated_at: string;
  total_users: number;
  admin_users: number;
  signups_today: number;
  signups_week: number;
  active_24h: number;
  finished_game: number;
  completions_today: number;
  progress_funnel: { missions_completed: number; players: number }[];
  per_mission: {
    mission_id: string;
    players_completed: number;
    replays: number;
    avg_score: number | null;
    avg_duration_seconds: number | null;
  }[];
}
