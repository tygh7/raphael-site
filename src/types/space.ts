export type Faction = 'light' | 'dark';

export interface ShipStats {
  speed: number;        // Max speed (velocity cap)
  power: number;        // Damage per laser shot
  rate: number;         // Cooldown between shots in milliseconds
  range: number;        // Max laser travel distance in pixels
  shield: number;       // Base maximum health/shield
}

export interface ShipDef {
  id: string;
  name: string;
  faction: Faction;
  description: string;
  stats: ShipStats;
  color: string; // Faction laser/engine color (e.g. green for Light, red for Dark)
}

export interface SpaceShip {
  id: string;
  defId: string;
  name: string;
  faction: Faction;
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  angle: number; // in radians
  pitch?: number;
  yaw?: number;
  roll?: number;
  hp: number;
  maxHp: number;
  lastShotTime: number;
  isPlayer: boolean;
  stats: ShipStats;
  color: string;
  
  // Stats
  kills?: number;
  deaths?: number;

  // AI targeting
  targetId?: string;
  aiState?: 'patrol' | 'chase' | 'avoid';
  aiDecisionTimer?: number;

  // Special moves & mechanics
  lastHitTime?: number;
  boostType?: 'dash' | 'multiplier';
  lastBoostTime?: number;
  boostActiveTimer?: number; // active frames remaining for multiplier boost
  lastBombTime?: number;
  specialType?: 'beam' | 'shield';
  lastSpecialTime?: number;
  shieldActiveTimer?: number; // active frames remaining for shield
}

export interface Laser {
  id: string;
  ownerId: string;
  faction: Faction;
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  damage: number;
  rangeRemaining: number;
  color: string;
  isBomb?: boolean; // special bomb projectile
  isSuperBeam?: boolean; // special super beam laser projectile
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  life: number; // remaining life frames
  maxLife: number;
  color: string;
  size: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  z?: number;
  vx: number;
  vy: number;
  vz?: number;
  size: number; // 3 (large), 2 (medium), 1 (small)
  hp: number;
}

export interface GameState {
  playerShip: SpaceShip | null;
  faction: Faction | null;
  ships: SpaceShip[];
  lasers: Laser[];
  particles: Particle[];
  asteroids: Asteroid[];
  worldSize: number; // Big flat map size (e.g. 5000x5000 pixels)
  score: number;
  kills: number;
  deaths: number;
}
