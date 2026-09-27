// Reuses existing art only — no new assets generated.
//
// Portraits (used in the picker, Student Card and HUD) come from the
// previously-unused avatar-N sprites bundled with Society Fair.
// Overworld walk-cycles reuse the three existing directional NPC sprite
// sheets (public/assets/npcs/npc6, npc7, npc8). Only three full
// walk-cycles exist in the project, so avatar 4's overworld sprite reuses
// npc8's walk-cycle while keeping its own distinct portrait — flagged here
// rather than silently duplicated.
import avatar1 from '../levels/society-fair/assets/sprites/avatar-1.png';
import avatar2 from '../levels/society-fair/assets/sprites/avatar-2.png';
import avatar3 from '../levels/society-fair/assets/sprites/avatar-3.png';
import avatar4 from '../levels/society-fair/assets/sprites/avatar-4.png';

export interface AvatarOption {
  id: string;
  label: string;
  portrait: string;
  /** Directional walk-cycle used on the overworld campus map. */
  walkBase: string; // e.g. '/assets/npcs/npc6'
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'player-1', label: 'Player 1', portrait: avatar1, walkBase: '/assets/npcs/npc6' },
  { id: 'player-2', label: 'Player 2', portrait: avatar2, walkBase: '/assets/npcs/npc7' },
  { id: 'player-3', label: 'Player 3', portrait: avatar3, walkBase: '/assets/npcs/npc8' },
  { id: 'player-4', label: 'Player 4', portrait: avatar4, walkBase: '/assets/npcs/npc8' },
];

export function avatarById(id: string | null | undefined): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.id === id) ?? AVATAR_OPTIONS[0];
}
