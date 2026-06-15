export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface CombatStats {
  hp: number;
  speed: number;
  attack: number;
  defense: number;
}

export type MoveType = 'steel' | 'fighter' | 'psychic' | 'fire' | 'dark' | 'dragon' | 'normal';

export interface AttackMove {
  id: string;
  name: string;
  type: MoveType;
  power: number;
  accuracy: number; // 0 to 100
  priority: number; // e.g. 0 standard, 1 quick attack
  description: string;
  effectType?: 'heal' | 'stat_up' | 'status_burn' | 'status_paralyze' | 'status_confuse' | 'status_flinch' | 'flail' | 'recoil' | 'stat_down';
  effectValue?: number; // percentage or stage modification
}

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  level: number; // 1 to 5
  currentHp: number;
  maxHp: number;
  stats: CombatStats;
  moves: AttackMove[];
}

export type BoardState = (ChessPiece | null)[][]; // 8x8 grid

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export interface GameState {
  board: BoardState;
  turn: PieceColor;
  selectedPosition: Position | null;
  validMoves: Position[];
  gameMode: 'chess' | 'clash_prompt' | 'battle' | 'game_over';
  winner: PieceColor | null;
  history: string[];
  
  // Clash info
  clash?: {
    attacker: ChessPiece;
    defender: ChessPiece;
    attackerPos: Position;
    defenderPos: Position;
  };

  // Battle state
  battle?: BattleState;
}

export type StatusEffect = 'burn' | 'paralyze' | 'confuse' | 'none';

export interface BattlePiece {
  piece: ChessPiece;
  currentHp: number;
  maxHp: number;
  speed: number;
  attack: number;
  defense: number;
  
  // Stat stages (-6 to +6)
  stages: {
    attack: number;
    defense: number;
    speed: number;
  };
  
  status: StatusEffect;
  statusDuration: number; // turns remaining for confuse
  hasFlinched: boolean;
  isResting: boolean; // For high recharge moves
}

export interface BattleState {
  attacker: BattlePiece;
  defender: BattlePiece;
  currentTurn: 'attacker' | 'defender';
  log: string[];
  winner: 'attacker' | 'defender' | null;
  phase: 'intro' | 'select' | 'animating' | 'end';
}
