import { getSupabase } from '../lib/supabaseClient';
import { MISSION_IDS, isMissionId, type MissionId } from '../config/missions';
import type { GameSave, MissionResult } from '../types';
import { NetworkError, toNetworkError } from '../utils/errors';

/** Loads the signed-in player's save. Called once after login. */
export async function loadSave(): Promise<GameSave> {
  const { data, error } = await getSupabase()
    .from('game_saves')
    .select('user_id, completed_missions, badges, state, save_version, updated_at')
    .single();
  if (error) throw toNetworkError(error, 'Couldn’t load your saved progress.');
  return normaliseSave(data);
}

/**
 * Saves progress. This is the ONLY save in the game and should be called
 * exactly once, when a minigame is finished. The database checks that the
 * mission is actually unlocked before accepting it.
 * Retries twice on network failure; never retries on validation errors.
 */
export async function completeMission(missionId: MissionId, result: MissionResult = {}): Promise<GameSave> {
  if (!isMissionId(missionId)) {
    throw new NetworkError(`Unknown mission "${missionId}".`, 'UNKNOWN_MISSION');
  }

  const args = {
    p_mission: missionId,
    p_score: result.score !== undefined ? Math.round(result.score) : null,
    p_duration: result.durationSeconds !== undefined ? Math.round(result.durationSeconds) : null,
    p_extra: result.extra ?? {},
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await getSupabase().rpc('complete_mission', args);
    if (!error) return normaliseSave(data);

    lastError = error;
    const netErr = toNetworkError(error);
    if (netErr.code !== 'OFFLINE' && netErr.code !== 'UNKNOWN') throw netErr;
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  throw toNetworkError(lastError, 'Your progress couldn’t be saved. Check your connection and try again.');
}

// ---------- Progress helpers (pure, safe to use anywhere in the UI) ----------

export function isMissionCompleted(save: GameSave | null, id: MissionId): boolean {
  return !!save?.completed_missions.includes(id);
}

/** The next mission to play, or null if the game is finished. */
export function nextMission(save: GameSave | null): MissionId | null {
  const done = save?.completed_missions.length ?? 0;
  return MISSION_IDS[done] ?? null;
}

/** Unlocked = completed already, or the next one in order. */
export function isMissionUnlocked(save: GameSave | null, id: MissionId): boolean {
  return isMissionCompleted(save, id) || nextMission(save) === id;
}

export function isGameFinished(save: GameSave | null): boolean {
  return nextMission(save) === null;
}

function normaliseSave(raw: unknown): GameSave {
  const r = raw as Partial<GameSave> | null;
  if (!r || typeof r !== 'object' || !r.user_id) {
    throw new NetworkError('The server sent an unexpected save format.', 'BAD_SAVE');
  }
  return {
    user_id: r.user_id,
    completed_missions: (r.completed_missions ?? []).filter(isMissionId),
    badges: r.badges ?? [],
    state: (r.state ?? {}) as GameSave['state'],
    save_version: r.save_version ?? 0,
    updated_at: r.updated_at ?? new Date().toISOString(),
  };
}
