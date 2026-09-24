// Public API of the Campus Quest network module.
export { session } from './session';
export type { SessionState, SessionStatus } from './session';

export { GameSessionProvider, useGameSession } from './context/GameSessionProvider';
export type { GameSessionValue } from './context/GameSessionProvider';
export { AdminStatsPanel } from './components/AdminStatsPanel';
export { useAdminStats } from './hooks/useAdminStats';

export { isMissionCompleted, isMissionUnlocked, nextMission, isGameFinished } from './services/saveService';
export { MISSIONS, MISSION_IDS, isMissionId, missionTitle } from './config/missions';
export type { Mission, MissionId } from './config/missions';

export { isSupabaseConfigured } from './lib/supabaseClient';
export { NetworkError, toNetworkError } from './utils/errors';
export {
  PASSWORD_RULES,
  checkPassword,
  validateUsername,
  validateNickname,
  validateStudentNumber,
  NICKNAME_MAX,
} from './utils/passwordPolicy';

export { EXPLORERS } from './types';
export type {
  Profile,
  Role,
  ExplorerId,
  CharacterInfo,
  GameSave,
  SaveState,
  MissionResult,
  GameScreen,
  PresenceSummary,
  AdminStats,
} from './types';
