import { Tile, TileType, WorldMapState, NPC, Chest } from '../types/rpg';

export const MAP_SIZE = 64;

// Tile definitions helper
export function createTile(type: TileType): Tile {
  let solid = false;
  let isLedge = false;
  let isRamp = false;
  let color = '#10b981'; // Default grass green

  switch (type) {
    case 'grass':
      color = '#10b981'; // Green
      break;
    case 'tall_grass':
      color = '#047857'; // Dark emerald green
      break;
    case 'tree':
      solid = true;
      color = '#065f46'; // Forest green
      break;
    case 'water':
      solid = true;
      color = '#0284c7'; // Cyan/Blue
      break;
    case 'mountain':
      solid = true;
      color = '#4b5563'; // Rock grey
      break;
    case 'ledge':
      isLedge = true;
      color = '#6b7280'; // Ledge grey-brown
      break;
    case 'ramp':
      isRamp = true;
      color = '#9ca3af'; // Ramp light grey
      break;
    case 'bridge':
      color = '#d97706'; // Wooden brown
      break;
    case 'dirt':
      color = '#78350f'; // Dirt road
      break;
  }

  return { type, solid, isLedge, isRamp, color };
}

// Generate the 64x64 World Map
export function generateWorldMap(): WorldMapState {
  const grid: Tile[][] = Array(MAP_SIZE)
    .fill(null)
    .map(() => Array(MAP_SIZE).fill(null));

  // 1. Fill default grass
  for (let r = 0; r < MAP_SIZE; r++) {
    for (let c = 0; c < MAP_SIZE; c++) {
      grid[r][c] = createTile('grass');
    }
  }

  // 2. Build Northern Mountain Ranges (Rows 0 to 14)
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < MAP_SIZE; c++) {
      grid[r][c] = createTile('mountain');
    }
  }

  // 3. Create paths, ramps, and ledges on the mountains
  // Ramps at columns 12, 32, and 50 to ascend the mountains
  const rampCols = [12, 32, 50];
  for (const c of rampCols) {
    for (let r = 10; r < 14; r++) {
      grid[r][c] = createTile('ramp');
    }
    // Clear path leading to the ramps
    grid[14][c] = createTile('dirt');
    grid[14][c - 1] = createTile('dirt');
    grid[14][c + 1] = createTile('dirt');
  }

  // Add scenic plateaus on the mountain (Level 1 peaks)
  // Plateau 1: Col 8 to 20, Row 5 to 9
  for (let r = 5; r <= 9; r++) {
    for (let c = 8; c <= 20; c++) {
      grid[r][c] = createTile('grass');
    }
  }
  // Add a ledge at the bottom of Plateau 1 (Row 9, Col 13 to 17)
  for (let c = 13; c <= 17; c++) {
    grid[9][c] = createTile('ledge');
  }

  // Plateau 2: Col 28 to 45, Row 4 to 9
  for (let r = 4; r <= 9; r++) {
    for (let c = 28; c <= 45; c++) {
      grid[r][c] = createTile('grass');
    }
  }
  // Ledge at Plateau 2 bottom (Row 9, Col 34 to 40)
  for (let c = 34; c <= 40; c++) {
    grid[9][c] = createTile('ledge');
  }

  // Mountain boundaries: add ledges at the very edge of the mountain range (Row 13)
  // This allows the player to jump down from mountains back to the plains!
  for (let c = 0; c < MAP_SIZE; c++) {
    // Keep ramps clear
    if (!rampCols.includes(c) && !rampCols.includes(c - 1) && !rampCols.includes(c + 1)) {
      grid[13][c] = createTile('ledge');
    }
  }

  // 4. Build Deep Forest & Tall Grass (Rows 14 to 28)
  for (let r = 14; r <= 28; r++) {
    for (let c = 0; c < MAP_SIZE; c++) {
      // Natural noise-like distribution of trees and tall grass
      const noiseVal = Math.sin(r * 0.4) * Math.cos(c * 0.4);
      if (noiseVal > 0.4) {
        grid[r][c] = createTile('tree');
      } else if (noiseVal > -0.1) {
        grid[r][c] = createTile('tall_grass');
      }
    }
  }

  // Clear some paths through the forest
  for (let r = 14; r <= 28; r++) {
    grid[r][32] = createTile('dirt'); // Main north-south road
  }

  // 5. Build Town Center (Rows 29 to 43)
  for (let r = 29; r <= 43; r++) {
    for (let c = 15; c <= 48; c++) {
      grid[r][c] = createTile('grass');
    }
  }

  // Paths in Town
  for (let r = 34; r <= 38; r++) {
    for (let c = 20; c <= 44; c++) {
      grid[r][c] = createTile('dirt');
    }
  }
  for (let r = 29; r <= 43; r++) {
    grid[r][32] = createTile('dirt'); // North-south road continues
  }

  // Create town houses (solid walls/roofs)
  const housePositions = [
    { r: 31, c: 22 },
    { r: 31, c: 38 },
    { r: 40, c: 22 },
    { r: 40, c: 38 }
  ];

  housePositions.forEach(house => {
    // 3x3 houses
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        grid[house.r + dr][house.c + dc] = createTile('mountain'); // acts as house bricks
      }
    }
    // Door/Entrance
    grid[house.r + 1][house.c] = createTile('dirt');
  });

  // 6. Build Southern Mystic Lake (Rows 46 to 58)
  for (let r = 46; r <= 58; r++) {
    for (let c = 10; c <= 54; c++) {
      // Circular lake shape
      const dx = c - 32;
      const dy = r - 52;
      if (dx * dx + dy * dy * 3 < 380) {
        grid[r][c] = createTile('water');
      }
    }
  }

  // Add a wooden bridge across the lake
  for (let r = 47; r <= 57; r++) {
    grid[r][32] = createTile('bridge');
  }

  // Island in the middle of the lake
  for (let r = 51; r <= 53; r++) {
    for (let c = 30; c <= 34; c++) {
      grid[r][c] = createTile('grass');
    }
  }
  grid[52][32] = createTile('grass'); // Connects with bridge

  // Trees surrounding the lake
  for (let c = 5; c <= 58; c++) {
    if (grid[45][c].type === 'grass') grid[45][c] = createTile('tree');
    if (grid[59][c].type === 'grass') grid[59][c] = createTile('tree');
  }

  // 7. Place NPCs
  const npcs: NPC[] = [
    {
      id: 'old_man_village',
      name: 'Elder Oak',
      x: 32,
      y: 36,
      sprite: 'old_man',
      dialogue: [
        'Welcome to the Pixel World, traveler!',
        'Move around freely using the ZQSD keys (or WASD).',
        'Press SPACE to jump over gaps or leap in place!',
        'Press C to open your Adventurer Map and see where you are.',
        'Beware the tall grass in the north: wild monsters roam there!'
      ],
      isTrainer: false,
      defeated: false
    },
    {
      id: 'trainer_forest',
      name: 'Bug Catcher Sam',
      x: 34,
      y: 20,
      sprite: 'trainer',
      dialogue: [
        'Hey! I saw you from a mile away!',
        'Let\'s test your battle skills!',
        'Prepare for a Pokémon-style duel!'
      ],
      isTrainer: true,
      defeated: false,
      monsterType: 'n' // Knight (Bug/Volt)
    },
    {
      id: 'trainer_mountain',
      name: 'Mountain Hiker Joe',
      x: 12,
      y: 6,
      sprite: 'trainer',
      dialogue: [
        'Climbing mountains is tough, but fighting me is tougher!',
        'You climbed all the way here to battle me?',
        'Let\'s see how your team handles my Rook!'
      ],
      isTrainer: true,
      defeated: false,
      monsterType: 'r' // Rook (Fire/Heavy)
    },
    {
      id: 'trainer_island',
      name: 'Mystic Sentinel',
      x: 32,
      y: 51,
      sprite: 'trainer',
      dialogue: [
        'You crossed the bridge to the sacred island.',
        'You have proved your courage.',
        'Now, face my ultimate champion!'
      ],
      isTrainer: true,
      defeated: false,
      monsterType: 'q' // Queen (Dark/Nebula)
    }
  ];

  // 8. Place Chests
  const chests: Chest[] = [
    {
      id: 'chest_forest',
      x: 8,
      y: 18,
      opened: false,
      rewardType: 'level_up',
      rewardMessage: 'Your starter Knight gained a Level!'
    },
    {
      id: 'chest_mountain',
      x: 18,
      y: 5,
      opened: false,
      rewardType: 'rare_candy',
      rewardMessage: 'You found Rare Candy! All team members gained +1 Level!'
    },
    {
      id: 'chest_island',
      x: 34,
      y: 53,
      opened: false,
      rewardType: 'heal_all',
      rewardMessage: 'Sacred waters healed your entire team to full HP!'
    }
  ];

  return {
    grid,
    width: MAP_SIZE,
    height: MAP_SIZE,
    npcs,
    chests
  };
}
