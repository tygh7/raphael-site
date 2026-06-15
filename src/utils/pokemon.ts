import { PieceType, PieceColor, CombatStats, AttackMove, ChessPiece, MoveType, BattlePiece } from '../types/game';

// Map Chess Piece Type to Pokemon Type
export function getPieceType(type: PieceType): MoveType {
  switch (type) {
    case 'p': return 'steel';
    case 'n': return 'fighter';
    case 'b': return 'psychic';
    case 'r': return 'fire';
    case 'q': return 'dark';
    case 'k': return 'dragon';
    default: return 'normal';
  }
}

// Base stats mapping for Level 1 pieces
export const BASE_STATS: Record<PieceType, CombatStats> = {
  p: { hp: 70, speed: 25, attack: 40, defense: 45 },      // Pawn: Low but defensive
  n: { hp: 100, speed: 75, attack: 65, defense: 50 },     // Knight: Fast physical attacker
  b: { hp: 90, speed: 70, attack: 70, defense: 45 },      // Bishop: Fast energy attacker
  r: { hp: 120, speed: 45, attack: 80, defense: 75 },     // Rook: Heavy high defense tank
  q: { hp: 140, speed: 95, attack: 95, defense: 60 },     // Queen: Hyper offensive sweeper
  k: { hp: 200, speed: 35, attack: 85, defense: 90 }      // King: Giant boss stats, slow
};

// Type advantages matrix: target type effectiveness
export function getTypeEffectiveness(moveType: MoveType, targetType: MoveType): number {
  if (moveType === 'normal') return 1.0;

  const matrix: Record<MoveType, Partial<Record<MoveType, number>>> = {
    steel: { dark: 2.0, fire: 0.5, dragon: 0.75 },
    dark: { psychic: 2.0, steel: 0.5 },
    psychic: { fighter: 2.0, dark: 0.5 },
    fighter: { steel: 2.0, fire: 2.0, psychic: 0.5, dragon: 0.75 },
    fire: { steel: 2.0, fighter: 0.5, dragon: 0.75 },
    dragon: { dragon: 2.0, steel: 0.75, fire: 0.75, fighter: 0.75 },
    normal: {}
  };

  return matrix[moveType]?.[targetType] ?? 1.0;
}

// 4 Signature Moves per Chess Piece
export const PIECE_MOVES: Record<PieceType, AttackMove[]> = {
  p: [
    {
      id: 'iron_shield',
      name: 'Iron Shield',
      type: 'steel',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Raises Defense by 2 stages.',
      effectType: 'stat_up',
      effectValue: 2
    },
    {
      id: 'pebble_shot',
      name: 'Pebble Shot',
      type: 'normal',
      power: 20,
      accuracy: 100,
      priority: 1,
      description: 'Quick priority strike. Always hits first.'
    },
    {
      id: 'flail',
      name: 'Desperate Flail',
      type: 'fighter',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Deals massive damage the lower the Pawn\'s HP is.',
      effectType: 'flail'
    },
    {
      id: 'vanguard_strike',
      name: 'Vanguard Strike',
      type: 'steel',
      power: 45,
      accuracy: 95,
      priority: 0,
      description: 'Deals solid steel damage.'
    }
  ],
  n: [
    {
      id: 'l_kick',
      name: 'L-Jump Kick',
      type: 'fighter',
      power: 60,
      accuracy: 90,
      priority: 0,
      description: 'High flying diagonal kick.'
    },
    {
      id: 'double_kick',
      name: 'Double Kick',
      type: 'fighter',
      power: 35,
      accuracy: 100,
      priority: 0,
      description: 'Hits twice. Lowers target Defense by 1 stage.',
      effectType: 'stat_down',
      effectValue: 1
    },
    {
      id: 'agility',
      name: 'Agility',
      type: 'normal',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Increases speed by 2 stages.',
      effectType: 'stat_up',
      effectValue: 2
    },
    {
      id: 'volt_tackle',
      name: 'Volt Tackle',
      type: 'fire',
      power: 85,
      accuracy: 90,
      priority: 0,
      description: 'Powerful tackle. Recoils 25% damage to self.',
      effectType: 'recoil',
      effectValue: 25
    }
  ],
  b: [
    {
      id: 'diagonal_beam',
      name: 'Diagonal Beam',
      type: 'psychic',
      power: 55,
      accuracy: 100,
      priority: 0,
      description: 'Launches a psychic diagonal laser.'
    },
    {
      id: 'mind_blast',
      name: 'Mind Blast',
      type: 'psychic',
      power: 75,
      accuracy: 80,
      priority: 0,
      description: '80% Accuracy. May confuse the opponent.',
      effectType: 'status_confuse'
    },
    {
      id: 'sacred_heal',
      name: 'Sacred Heal',
      type: 'normal',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Restores 40% of max HP.',
      effectType: 'heal',
      effectValue: 40
    },
    {
      id: 'miracle_eye',
      name: 'Miracle Eye',
      type: 'psychic',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Reveals weakness. Lowers enemy Defense by 2 stages.',
      effectType: 'stat_down',
      effectValue: 2
    }
  ],
  r: [
    {
      id: 'castle_slam',
      name: 'Castle Slam',
      type: 'steel',
      power: 70,
      accuracy: 95,
      priority: 0,
      description: 'Smash with fortress weight.'
    },
    {
      id: 'fire_blast',
      name: 'Fire Blast',
      type: 'fire',
      power: 90,
      accuracy: 85,
      priority: 0,
      description: 'High power fire. 20% chance to Burn target.',
      effectType: 'status_burn'
    },
    {
      id: 'fortify',
      name: 'Fortify',
      type: 'steel',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Heals 20% HP and increases Defense by 1 stage.',
      effectType: 'stat_up',
      effectValue: 1
    },
    {
      id: 'earthquake',
      name: 'Earthquake',
      type: 'normal',
      power: 80,
      accuracy: 100,
      priority: 0,
      description: 'A massive earth-shattering tremor.'
    }
  ],
  q: [
    {
      id: 'shadow_claw',
      name: 'Shadow Claw',
      type: 'dark',
      power: 75,
      accuracy: 100,
      priority: 0,
      description: 'Swift dark attack. High Critical Hit chance.'
    },
    {
      id: 'cosmic_ray',
      name: 'Cosmic Ray',
      type: 'psychic',
      power: 95,
      accuracy: 90,
      priority: 0,
      description: 'Concentrated beam of stardust.'
    },
    {
      id: 'dark_pulse',
      name: 'Dark Pulse',
      type: 'dark',
      power: 80,
      accuracy: 100,
      priority: 0,
      description: 'Releases dark waves. May flinch the target.',
      effectType: 'status_flinch',
      effectValue: 30 // 30% chance
    },
    {
      id: 'queens_grace',
      name: "Queen's Grace",
      type: 'normal',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Empowers. Raises Attack by 2 stages.',
      effectType: 'stat_up',
      effectValue: 2
    }
  ],
  k: [
    {
      id: 'royal_scepter',
      name: 'Royal Scepter',
      type: 'normal',
      power: 60,
      accuracy: 100,
      priority: 0,
      description: 'Hits with authority. Always accurate.'
    },
    {
      id: 'dragon_breath',
      name: 'Dragon Breath',
      type: 'dragon',
      power: 80,
      accuracy: 90,
      priority: 0,
      description: 'Fiery blast. 30% chance to Paralyze target.',
      effectType: 'status_paralyze',
      effectValue: 30
    },
    {
      id: 'kings_domain',
      name: "King's Domain",
      type: 'dragon',
      power: 0,
      accuracy: 100,
      priority: 0,
      description: 'Heals 30% HP and increases Attack and Defense by 1 stage.',
      effectType: 'stat_up',
      effectValue: 1
    },
    {
      id: 'last_bastion',
      name: 'Last Bastion',
      type: 'dragon',
      power: 110,
      accuracy: 85,
      priority: 0,
      description: 'Colossal damage. Forces user to Rest next turn.',
      effectType: 'recoil',
      effectValue: 0 // handled by resting state
    }
  ]
};

// Calculate stats scaled by level (+10% per level)
export function getStatsForLevel(base: CombatStats, level: number): CombatStats {
  const multiplier = 1 + 0.1 * (level - 1);
  return {
    hp: Math.round(base.hp * multiplier),
    speed: Math.round(base.speed * multiplier),
    attack: Math.round(base.attack * multiplier),
    defense: Math.round(base.defense * multiplier)
  };
}

// Generate ChessPiece object
export function createChessPiece(
  type: PieceType,
  color: PieceColor,
  uniqueIndex: number
): ChessPiece {
  const base = BASE_STATS[type];
  const stats = getStatsForLevel(base, 1);
  const moves = PIECE_MOVES[type];
  
  return {
    id: `${color}_${type}_${uniqueIndex}`,
    type,
    color,
    level: 1,
    currentHp: stats.hp,
    maxHp: stats.hp,
    stats,
    moves
  };
}

// Pokemon Stat Modifier Stage multiplier
// From -6 to +6 stages
export function getStageMultiplier(stage: number): number {
  if (stage >= 0) {
    return (2 + stage) / 2;
  } else {
    return 2 / (2 - stage);
  }
}

// Damage Calculator
export function calculateDamage(
  attacker: BattlePiece,
  defender: BattlePiece,
  move: AttackMove
): {
  damage: number;
  isCrit: boolean;
  typeEffectiveness: number;
  message: string;
} {
  // Accuracy check
  const rollAccuracy = Math.random() * 100;
  if (rollAccuracy > move.accuracy) {
    return { damage: 0, isCrit: false, typeEffectiveness: 1, message: 'missed!' };
  }

  // Self status effects check
  if (attacker.status === 'paralyze' && Math.random() < 0.25) {
    return { damage: 0, isCrit: false, typeEffectiveness: 1, message: 'is paralyzed and cannot move!' };
  }
  
  if (attacker.status === 'confuse') {
    if (Math.random() < 0.33) {
      // Hits self in confusion
      const selfDmg = Math.round((attacker.attack * 35) / attacker.defense * 0.4);
      return { damage: -selfDmg, isCrit: false, typeEffectiveness: 1, message: 'hit itself in confusion!' };
    }
  }

  // Base power calculation
  let power = move.power;
  if (move.effectType === 'flail') {
    // Flail deals high damage when HP is low
    const hpRatio = attacker.currentHp / attacker.maxHp;
    if (hpRatio < 0.1) power = 100;
    else if (hpRatio < 0.25) power = 80;
    else if (hpRatio < 0.5) power = 55;
    else power = 30;
  }

  if (power === 0) {
    return { damage: 0, isCrit: false, typeEffectiveness: 1, message: '' };
  }

  // Combat stats modified by stages
  const attackerAttack = attacker.attack * getStageMultiplier(attacker.stages.attack);
  const defenderDefense = defender.defense * getStageMultiplier(defender.stages.defense);

  // Critical hit calculation (Base: 6.25%, Vanguard Strike & Shadow Claw: 15%)
  const critChance = (move.id === 'vanguard_strike' || move.id === 'shadow_claw') ? 0.15 : 0.0625;
  const isCrit = Math.random() < critChance;
  const critMultiplier = isCrit ? 1.5 : 1.0;

  // Type Effectiveness
  const attackerType = getPieceType(attacker.piece.type);
  const defenderType = getPieceType(defender.piece.type);
  // Multipliers
  const typeEffectiveness = getTypeEffectiveness(move.type, defenderType);

  // Damage formula (Simplified Pokémon formula)
  // damage = (((2 * Level / 5 + 2) * Attack * Power / Defense) / 50 + 2) * Modifier
  const level = attacker.piece.level;
  const baseDamage = ((2 * level / 5 + 2) * attackerAttack * power / Math.max(1, defenderDefense)) / 12 + 8;
  
  // Random factor [0.85, 1.00]
  const randomFactor = 0.85 + Math.random() * 0.15;

  let damage = Math.round(baseDamage * critMultiplier * typeEffectiveness * randomFactor);

  // Burn halves physical attack damage (except Special/Fire moves. For simplicity: halves all damage except fire)
  if (attacker.status === 'burn' && move.type !== 'fire') {
    damage = Math.round(damage * 0.5);
  }

  damage = Math.max(1, damage);

  let message = '';
  if (isCrit) message += 'Critical hit! ';
  if (typeEffectiveness > 1) message += "It's super effective! ";
  if (typeEffectiveness < 1 && typeEffectiveness > 0) message += "It's not very effective... ";

  return {
    damage,
    isCrit,
    typeEffectiveness,
    message: message.trim()
  };
}
