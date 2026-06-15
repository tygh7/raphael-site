import { ChessPiece } from './game';

export type TileType =
  | 'grass'
  | 'tall_grass'
  | 'tree'
  | 'water'
  | 'mountain'
  | 'ledge'
  | 'ramp'
  | 'bridge'
  | 'dirt';

export interface Tile {
  type: TileType;
  solid: boolean;
  isLedge: boolean; // Can jump down only
  isRamp: boolean;  // Allows walking onto mountain tiles
  color: string;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Player {
  x: number; // grid tile X
  y: number; // grid tile Y
  dir: Direction;
  isMoving: boolean;
  moveProgress: number; // 0 to 1 for glide interpolation
  isJumping: boolean;
  jumpProgress: number; // 0 to 1 for vertical parabolic hop
  level: number;
  monsters: ChessPiece[]; // Our party of combatants (using ChessPiece as Mon definition)
}

export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  sprite: 'trainer' | 'villager' | 'old_man';
  dialogue: string[];
  isTrainer: boolean;
  defeated: boolean;
  monsterType?: string; // e.g. 'q' for Queen, 'r' for Rook
}

export interface Chest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  rewardType: 'level_up' | 'heal_all' | 'rare_candy';
  rewardMessage: string;
}

export interface WorldMapState {
  grid: Tile[][];
  width: number;
  height: number;
  npcs: NPC[];
  chests: Chest[];
}
