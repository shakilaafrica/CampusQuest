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

/**
 * Discrete scenes for the "Operation: Student Card" mission. Each scene owns
 * its own background image, spawn position and interaction zones. The
 * PhotoBoothMinigame overlay is treated as its own scene so the underlying
 * reception scene can be unmounted while the minigame is playing.
 */
export type StudentCardScene =
  | 'introCard'              // mission-card overlay before anything is shown
  | 'intro'                  // intro-scene.jfif + player monologue
  | 'accessControlEntrance'  // exterior; walk to the glass doors and press E
  | 'cardServicesReception'  // interior; receptionist + photobooth zones
  | 'photoMinigame'          // existing photobooth minigame overlay
  | 'complete';              // completion card

/**
 * Result of the most recent photobooth attempt. Persisted across the
 * minigame -> reception transition so the reception scene knows which
 * follow-up dialogue to play. Reset back to 'none' once the failure dialogue
 * has been dismissed so the player can retry cleanly.
 */
export type PhotoResult = 'none' | 'success' | 'failure';

export type FaceExpression = 'neutral' | 'happy' | 'funny';
