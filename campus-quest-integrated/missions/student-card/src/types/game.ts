/**
 * Shared types for the Campus Quest mission modules.
 * "Operation: Student Card" is the first of four planned missions — these
 * types are written so the other three can reuse InventoryItem / the mission
 * shell pattern without redefining them.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji glyph, swap for a real sprite path later
}

/** Finite-state stages for the "Operation: Student Card" mission. */
export type MissionStage =
  | 'intro'
  | 'explore_desk' // walking toward the front-desk worker
  | 'dialogue_worker' // worker explains the photobooth
  | 'explore_booth' // walking toward the photobooth chair
  | 'minigame' // the photo-taking minigame is active
  | 'dialogue_result_win'
  | 'dialogue_result_lose'
  | 'complete';

export type FaceExpression = 'neutral' | 'happy' | 'funny';
