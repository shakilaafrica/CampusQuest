import npc6Up from '../levels/society-fair/assets/npc6/up.png';
import npc6Down from '../levels/society-fair/assets/npc6/down.png';
import npc6Left from '../levels/society-fair/assets/npc6/left.png';
import npc6Right from '../levels/society-fair/assets/npc6/right.png';
import npc7Up from '../levels/society-fair/assets/npc7/up.png';
import npc7Down from '../levels/society-fair/assets/npc7/down.png';
import npc7Left from '../levels/society-fair/assets/npc7/left.png';
import npc7Right from '../levels/society-fair/assets/npc7/right.png';
import npc8Up from '../levels/society-fair/assets/npc8/up.png';
import npc8Down from '../levels/society-fair/assets/npc8/down.png';
import npc8Left from '../levels/society-fair/assets/npc8/left.png';
import npc8Right from '../levels/society-fair/assets/npc8/right.png';
import npc9Up from '../levels/society-fair/assets/npc9/up.png';
import npc9Down from '../levels/society-fair/assets/npc9/down.png';
import npc9Left from '../levels/society-fair/assets/npc9/left.png';
import npc9Right from '../levels/society-fair/assets/npc9/right.png';
import npc10Up from '../levels/society-fair/assets/npc10/up.png';
import npc10Down from '../levels/society-fair/assets/npc10/down.png';
import npc10Left from '../levels/society-fair/assets/npc10/left.png';
import npc10Right from '../levels/society-fair/assets/npc10/right.png';

export type AvatarDirection = 'up' | 'down' | 'left' | 'right';
type AvatarSprites = Record<AvatarDirection, string>;

export interface AvatarOption {
  id: string;
  label: string;
  portrait: string;
  sprites: AvatarSprites;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'npc6', label: 'Avatar 1', portrait: npc6Down, sprites: { up: npc6Up, down: npc6Down, left: npc6Left, right: npc6Right } },
  { id: 'npc7', label: 'Avatar 2', portrait: npc7Down, sprites: { up: npc7Up, down: npc7Down, left: npc7Left, right: npc7Right } },
  { id: 'npc8', label: 'Avatar 3', portrait: npc8Down, sprites: { up: npc8Up, down: npc8Down, left: npc8Left, right: npc8Right } },
  { id: 'npc9', label: 'Avatar 4', portrait: npc9Down, sprites: { up: npc9Up, down: npc9Down, left: npc9Left, right: npc9Right } },
  { id: 'npc10', label: 'Avatar 5', portrait: npc10Down, sprites: { up: npc10Up, down: npc10Down, left: npc10Left, right: npc10Right } },
];

export function avatarById(id: string | null | undefined): AvatarOption {
  const legacyAvatarIds: Record<string, string> = {
    'player-1': 'npc6',
    'player-2': 'npc7',
    'player-3': 'npc8',
    'player-4': 'npc9',
  };
  const resolvedId = id ? legacyAvatarIds[id] ?? id : undefined;
  return AVATAR_OPTIONS.find((avatar) => avatar.id === resolvedId) ?? AVATAR_OPTIONS[0];
}
