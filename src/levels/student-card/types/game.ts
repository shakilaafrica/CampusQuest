
export interface Vector2 {
  x: number;
  y: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string; 
}


export type StudentCardScene =
  | 'introCard'              
  | 'intro'                 
  | 'accessControlEntrance' 
  | 'cardServicesReception'  
  | 'photoMinigame'          
  | 'complete';              


export type PhotoResult = 'none' | 'success' | 'failure';

export type FaceExpression = 'neutral' | 'happy' | 'funny';
