import React, { useRef, useEffect, useState } from 'react';
import { Faction, Difficulty, SpaceShip, Laser, Particle, Asteroid, GameState } from '../types/space';
import { drawPixelShip } from '../utils/shipRenderer';
import { LIGHT_SHIPS, DARK_SHIPS, getShipDefById } from '../utils/spaceShips';
import { Shield, Skull, Award, User, RefreshCw, Gamepad2 } from 'lucide-react';

interface SpaceCanvasProps {
  faction: Faction;
  selectedShipId: string;
  difficulty: Difficulty;
  onGameOver: (score: number, kills: number) => void;
  onExit: () => void;
  playerName?: string;
  onKillFeed?: (message: string, type?: 'light' | 'dark' | 'system') => void;
  
  isTwoPlayers: boolean;
  faction2?: Faction;
  selectedShipId2?: string;
  playerName2?: string;
}

const WORLD_SIZE = 8000;
const INITIAL_ASTEROIDS = 80;
const LASER_SPEED = 9.5;
const VIEW_ZOOM = 0.55; // <1 zooms the camera out for a wider battlefield view

const LIGHT_PILOT_NAMES = [
  'Wedge Antilles',
  'Biggs Darklighter',
  'Garven Dreis',
  'Jek Porkins',
  'Dutch Vander',
  'Horton Salm',
  'Keyan Farlander',
  'Arvel Crynyd',
  'Green Leader',
  'Rogue Five',
  'Jyn Erso',
  'Cassian Andor',
  'Antoc Merrick',
  'Corran Horn',
  'Poe Dameron',
  'Snap Temminck'
];

const DARK_PILOT_NAMES = [
  'Mauler Mithel',
  'Backstabber',
  'Dark Curse',
  'Night Beast',
  'Major Mihel'
];

const getSpecialTypeForShip = (defId: string): 'beam' | 'shield' => {
  // Light side: x_wing, falcon -> shield; delta_7, jedi_interceptor -> beam
  if (defId === 'x_wing' || defId === 'falcon') {
    return 'shield';
  }
  if (defId === 'delta_7' || defId === 'jedi_interceptor') {
    return 'beam';
  }
  // Dark side: tie_vader, tie_n2 -> beam; solar_sailer, tie_fighter, tie_silencer -> shield
  if (defId === 'tie_vader' || defId === 'tie_n2') {
    return 'beam';
  }
  return 'shield'; // solar_sailer, tie_fighter, tie_silencer
};

const getSpecialCooldown = (specialType: 'beam' | 'shield' | undefined): number => {
  return specialType === 'beam' ? 13000 : 7000;
};

const getBoostTypeForShip = (defId: string): 'dash' | 'multiplier' => {
  // Light side: x_wing, delta_7 -> dash; falcon, jedi_interceptor -> multiplier
  if (defId === 'x_wing' || defId === 'delta_7') return 'dash';
  if (defId === 'falcon' || defId === 'jedi_interceptor') return 'multiplier';
  // Dark side: tie_fighter, tie_silencer -> dash; tie_vader, tie_n2, solar_sailer -> multiplier
  if (defId === 'tie_fighter' || defId === 'tie_silencer') return 'dash';
  return 'multiplier';
};

export const SpaceCanvas: React.FC<SpaceCanvasProps> = ({
  faction,
  selectedShipId,
  difficulty,
  onGameOver,
  onExit,
  playerName = 'ROGUE LEADER',
  onKillFeed,
  isTwoPlayers,
  faction2 = 'dark',
  selectedShipId2 = 'tie_fighter',
  playerName2 = 'SITH LORD'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const minimap2Ref = useRef<HTMLCanvasElement | null>(null);

  // Input states
  const keysPressed = useRef<Record<string, boolean>>({});
  const keyboardLayout = useRef<'azerty' | 'qwerty'>('azerty');
  const mousePos = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false);

  // Local game states to sync with React UI
  const [hud, setHud] = useState({
    hp: 100,
    maxHp: 100,
    score: 0,
    kills: 0,
    deaths: 0,
    alliesCount: 0,
    enemiesCount: 0,
    speed: 0,
    lightKills: 0,
    darkKills: 0,
    bombCooldownPercent: 100,
    boostCooldownPercent: 100,
    boostActive: false,
    boostRemainingSec: 0,
    boostType: 'dash' as 'dash' | 'multiplier',
    specialCooldownPercent: 100,
    specialActive: false,
    specialRemainingSec: 0,
    specialType: 'beam' as 'beam' | 'shield'
  });

  const [hud2, setHud2] = useState({
    hp: 100,
    maxHp: 100,
    score: 0,
    kills: 0,
    deaths: 0,
    alliesCount: 0,
    enemiesCount: 0,
    speed: 0,
    lightKills: 0,
    darkKills: 0,
    bombCooldownPercent: 100,
    boostCooldownPercent: 100,
    boostActive: false,
    boostRemainingSec: 0,
    boostType: 'dash' as 'dash' | 'multiplier',
    specialCooldownPercent: 100,
    specialActive: false,
    specialRemainingSec: 0,
    specialType: 'beam' as 'beam' | 'shield'
  });

  // Flow states
  const [isDead, setIsDead] = useState(false);
  const [respawnTimeLeft, setRespawnTimeLeft] = useState(5);
  const [respawnShipId, setRespawnShipId] = useState<string>(selectedShipId);

  // Player 2 Flow states
  const [isDead2, setIsDead2] = useState(false);
  const [respawnTimeLeft2, setRespawnTimeLeft2] = useState(5);
  const [respawnShipId2, setRespawnShipId2] = useState<string>(selectedShipId2 || 'tie_fighter');

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [pauseSelect, setPauseSelect] = useState<'resume' | 'quit'>('resume');

  // Gamepad controller active state and menu navigation tracking refs
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const gpStartPressed = useRef(false);
  const gpSelectPressed = useRef(false);
  const gpLastNavTime = useRef(0);

  // Match timer (3 minutes = 180 seconds)
  const [matchTimeLeft, setMatchTimeLeft] = useState(180);
  const [isMatchOver, setIsMatchOver] = useState(false);
  const matchTimeLeftRef = useRef(180);

  // Dynamic canvas size state
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Screen shake timer/amplitude for Player 1
  const screenShake = useRef({ duration: 0, amplitude: 0 });
  const screenFlash = useRef({ duration: 0, maxDuration: 0, color: 'rgba(255, 255, 255, 0.4)' });
  const playerWarpTimer = useRef(0);

  // Screen shake timer/amplitude for Player 2
  const screenShake2 = useRef({ duration: 0, amplitude: 0 });
  const screenFlash2 = useRef({ duration: 0, maxDuration: 0, color: 'rgba(255, 255, 255, 0.4)' });
  const playerWarpTimer2 = useRef(0);

  // Core Game Loop State (held in refs for high-frequency 60fps tick rate without React re-renders)
  const game = useRef<GameState>({
    playerShip: null,
    faction: faction,
    ships: [],
    lasers: [],
    particles: [],
    asteroids: [],
    worldSize: WORLD_SIZE,
    score: 0,
    kills: 0,
    deaths: 0
  });

  // Parallax stars background (pre-generated)
  const starsBackground = useRef<{ x: number; y: number; size: number; speed: number; color: string }[]>([]);
  const nebulas = useRef<{ x: number; y: number; r: number; color: string }[]>([]);

  // Sync refs with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    matchTimeLeftRef.current = matchTimeLeft;
  }, [matchTimeLeft]);

  // Handle gamepad connection events
  useEffect(() => {
    const handleConnect = () => setGamepadConnected(true);
    const handleDisconnect = () => {
      const gps = navigator.getGamepads ? navigator.getGamepads() : [];
      const anyGp = gps ? Array.from(gps).some(g => g !== null) : false;
      setGamepadConnected(anyGp);
    };

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

    // Initial check
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gps && Array.from(gps).some(g => g !== null)) {
      setGamepadConnected(true);
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, []);

  // Hide body scrollbars during battle
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize background starfields once (Galaga style colored chunky stars)
  useEffect(() => {
    const stars: { x: number; y: number; size: number; speed: number; color: string }[] = [];
    const colors = ['#ffffff', '#ffffff', '#eab308', '#38bdf8', '#ef4444', '#ca8a04', '#a855f7'];
    for (let i = 0; i < 450; i++) {
      stars.push({
        x: Math.random() * 3000,
        y: Math.random() * 3000,
        size: Math.random() < 0.25 ? 3.0 : 1.5,
        speed: Math.random() < 0.35 ? 0.3 : 0.12,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    starsBackground.current = stars;

    nebulas.current = [
      { x: 1500, y: 1500, r: 800, color: 'rgba(99, 102, 241, 0.05)' },
      { x: 5500, y: 2500, r: 1000, color: 'rgba(239, 68, 68, 0.04)' },
      { x: 3000, y: 6000, r: 900, color: 'rgba(16, 185, 129, 0.04)' },
      { x: 6500, y: 5500, r: 850, color: 'rgba(14, 165, 233, 0.05)' }
    ];
  }, []);

  // Match timer countdown (runs every second)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPausedRef.current || isMatchOver) return;

      setMatchTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsMatchOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatchOver]);

  // Respawn countdown timer (runs every second when dead)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDead && !isMatchOver) {
      setRespawnTimeLeft(5);
      interval = setInterval(() => {
        setRespawnTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDead, isMatchOver]);

  // Player 2 Respawn countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDead2 && !isMatchOver) {
      setRespawnTimeLeft2(5);
      interval = setInterval(() => {
        setRespawnTimeLeft2(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDead2, isMatchOver]);

  // Helper to generate a random ship from a faction with unique pilot name
  const createAiShipWithPilot = (fact: Faction, index: number): SpaceShip => {
    const list = fact === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
    const def = list[Math.floor(Math.random() * list.length)];
    const namesList = fact === 'light' ? LIGHT_PILOT_NAMES : DARK_PILOT_NAMES;
    const pilotName = namesList[index % namesList.length];

    // Spawn inside respective faction base zone
    const x = Math.random() * (WORLD_SIZE - 800) + 400;
    let y = 0;
    if (fact === 'light') {
      y = 200 + Math.random() * 500; // North base area
    } else {
      y = WORLD_SIZE - 700 + Math.random() * 500; // South base area
    }

    // Squad configuration: every 7th ship is a squad leader
    const isLeader = index % 7 === 0;
    const leaderIndex = Math.floor(index / 7) * 7;
    const leaderId = `ai_${fact}_leader_${leaderIndex}`;
    const shipId = isLeader ? leaderId : `ai_${fact}_${index}_${Math.random().toString(36).substr(2, 5)}`;

    // Apply difficulty modifiers if the AI ship belongs to the OPPONENT faction
    const stats = { ...def.stats };
    if (fact !== faction) { // Opponent bot
      if (difficulty === 'leila') {
        stats.shield = Math.round(stats.shield * 0.18);
        stats.speed = stats.speed * 0.7;   // still nimble enough to fly around
        stats.power = Math.round(stats.power * 0.18);
        stats.rate = stats.rate * 4.0;
      } else if (difficulty === 'c3po') {
        stats.shield = Math.round(stats.shield * 0.3);
        stats.speed = stats.speed * 0.85;
        stats.power = Math.round(stats.power * 0.3);
        stats.rate = stats.rate * 3.0;
      } else if (difficulty === 'clone') {
        // Medium tier — bots are weaker but fly at near-full speed
        stats.shield = Math.round(stats.shield * 0.5);
        stats.speed = stats.speed * 1.0;
        stats.power = Math.round(stats.power * 0.5);
        stats.rate = stats.rate * 2.0;
      } else if (difficulty === 'jarjar') {
        // Hardest tier — but no longer brutal
        stats.shield = Math.round(stats.shield * 0.9);
        stats.speed = stats.speed * 1.1;
        stats.power = Math.round(stats.power * 0.85);
        stats.rate = stats.rate * 1.15;
      }
    }

    return {
      id: shipId,
      defId: def.id,
      name: isLeader ? `👑 Leader ${pilotName}` : pilotName,
      faction: fact,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: fact === 'light' ? Math.PI / 2 : -Math.PI / 2,
      hp: stats.shield,
      maxHp: stats.shield,
      lastShotTime: 0,
      isPlayer: false,
      stats: stats,
      color: def.color,
      aiState: 'patrol',
      aiDecisionTimer: 0,
      kills: 0,
      deaths: 0,
      lastHitTime: 0,
      boostType: getBoostTypeForShip(def.id),
      lastBoostTime: 0,
      boostActiveTimer: 0,
      lastBombTime: 0,
      specialType: getSpecialTypeForShip(def.id),
      lastSpecialTime: 0,
      shieldActiveTimer: 0,
      isSquadLeader: isLeader,
      squadLeaderId: isLeader ? undefined : leaderId,
      formationAngleOffset: isLeader ? undefined : ((index % 6) + 1) * (Math.PI / 3.5) - Math.PI / 2,
      formationDistOffset: isLeader ? undefined : 110 + Math.floor(index / 6) * 45,
      zigzagTimer: 0,
      zigzagDirection: 1,
      isChased: false
    };
  };

  // Helper to trigger particles (chunkier retro explosion fragments)
  const spawnExplosion = (x: number, y: number, color: string, count = 20, type: 'normal' | 'beam' | 'asteroid' = 'normal') => {
    const state = game.current;
    
    if (type === 'beam') {
      // Beam lightning arcs
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.0 + Math.random() * 5;
        state.particles.push({
          id: `p_lightning_${Math.random()}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 10 + Math.floor(Math.random() * 12),
          maxLife: 22,
          color: Math.random() < 0.4 ? '#ffffff' : color,
          size: 1.5 + Math.random() * 1.5,
          isLightning: true
        });
      }
    } else {
      // Normal or Asteroid debris
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = type === 'asteroid' ? 0.3 + Math.random() * 2.2 : 0.5 + Math.random() * 3.5;
        const particleColor = type === 'asteroid' 
          ? (Math.random() < 0.6 ? '#78716c' : '#a8a29e') // stone grey/brown
          : (Math.random() < 0.3 ? '#ffffff' : color);
          
        state.particles.push({
          id: `p_${Math.random()}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 20 + Math.floor(Math.random() * 20),
          maxLife: 40,
          color: particleColor,
          size: Math.random() < 0.25 ? (type === 'asteroid' ? 5 : 4) : 2
        });
      }
    }
  };

  // Start / Reset Space Match
  const initGame = () => {
    const playerDef = getShipDefById(selectedShipId)!;
    
    // Spawn player in their faction's base
    const px = Math.random() * (WORLD_SIZE - 800) + 400;
    let py = 0;
    if (faction === 'light') {
      py = 200 + Math.random() * 500; // North Base
    } else {
      py = WORLD_SIZE - 700 + Math.random() * 500; // South Base
    }

    // 1. Create player
    const player: SpaceShip = {
      id: 'player',
      defId: selectedShipId,
      name: `${playerName} (You)`,
      faction: faction,
      x: px,
      y: py,
      vx: 0,
      vy: 0,
      angle: faction === 'light' ? Math.PI / 2 : -Math.PI / 2,
      hp: playerDef.stats.shield,
      maxHp: playerDef.stats.shield,
      lastShotTime: 0,
      isPlayer: true,
      stats: playerDef.stats,
      color: playerDef.color,
      kills: 0,
      deaths: 0,
      lastHitTime: 0,
      boostType: getBoostTypeForShip(selectedShipId),
      lastBoostTime: 0,
      boostActiveTimer: 0,
      lastBombTime: 0,
      specialType: getSpecialTypeForShip(selectedShipId),
      lastSpecialTime: 0,
      shieldActiveTimer: 0
    };

    game.current.playerShip = player;
    game.current.ships = [player];

    if (isTwoPlayers && selectedShipId2 && faction2) {
      const playerDef2 = getShipDefById(selectedShipId2)!;
      const p2x = Math.random() * (WORLD_SIZE - 800) + 400;
      let p2y = 0;
      if (faction2 === 'light') {
        p2y = 200 + Math.random() * 500;
      } else {
        p2y = WORLD_SIZE - 700 + Math.random() * 500;
      }

      const player2: SpaceShip = {
        id: 'player2',
        defId: selectedShipId2,
        name: `${playerName2} (P2)`,
        faction: faction2,
        x: p2x,
        y: p2y,
        vx: 0,
        vy: 0,
        angle: faction2 === 'light' ? Math.PI / 2 : -Math.PI / 2,
        hp: playerDef2.stats.shield,
        maxHp: playerDef2.stats.shield,
        lastShotTime: 0,
        isPlayer: true,
        stats: playerDef2.stats,
        color: playerDef2.color,
        kills: 0,
        deaths: 0,
        lastHitTime: 0,
        boostType: getBoostTypeForShip(selectedShipId2),
        lastBoostTime: 0,
        boostActiveTimer: 0,
        lastBombTime: 0,
        specialType: getSpecialTypeForShip(selectedShipId2),
        lastSpecialTime: 0,
        shieldActiveTimer: 0
      };
      game.current.player2Ship = player2;
      game.current.ships.push(player2);
    } else {
      game.current.player2Ship = null;
    }

    game.current.lasers = [];
    game.current.particles = [];
    game.current.score = 0;
    game.current.kills = 0;
    game.current.deaths = 0;
    setIsDead(false);
    setIsDead2(false);
    setIsPaused(false);
    setIsMatchOver(false);
    setMatchTimeLeft(180);

    // 2. Spawn Asteroids
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < INITIAL_ASTEROIDS; i++) {
      asteroids.push({
        id: `ast_${i}`,
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * (WORLD_SIZE - 1800) + 900,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.floor(Math.random() * 3) + 1,
        hp: 40
      });
    }
    game.current.asteroids = asteroids;

    // 3. Spawn Fleet AI (even number of fighters: 30 vs 30)
    const teamSize = 30;
    const oppFaction = faction === 'light' ? 'dark' : 'light';
    
    // Spawn team AI (29 allies + player = 30)
    for (let i = 0; i < teamSize - 1; i++) {
      game.current.ships.push(createAiShipWithPilot(faction, i));
    }
    // Spawn opponent AI (30 enemies)
    for (let i = 0; i < teamSize; i++) {
      game.current.ships.push(createAiShipWithPilot(oppFaction, i));
    }
  };

  // Trigger setup on mount
  useEffect(() => {
    initGame();
  }, [faction, difficulty]);

  // Set keyboard / mouse listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        const canPause = game.current.playerShip && game.current.playerShip.hp > 0 && !isDead && !isMatchOver;
        if (canPause) {
          setIsPaused(prev => !prev);
        }
        e.preventDefault();
        return;
      }

      if (isPausedRef.current) {
        if (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'KeyS' || e.code === 'KeyW') {
          setPauseSelect(prev => prev === 'resume' ? 'quit' : 'resume');
          e.preventDefault();
        } else if (e.code === 'Enter') {
          if (pauseSelect === 'resume') {
            setIsPaused(false);
          } else {
            setIsPaused(false);
            onExit();
          }
          e.preventDefault();
        }
        return;
      }

      if (e.code === 'KeyZ' || e.code === 'KeyQ') {
        keyboardLayout.current = 'azerty';
      } else if (e.code === 'KeyA') {
        keyboardLayout.current = 'qwerty';
      }

      // Player 1 respawn controls
      if (isDead && !isMatchOver) {
        const shipsList = faction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
        const currentIndex = shipsList.findIndex(s => s.id === respawnShipId);
        
        if (isTwoPlayers) {
          if (e.code === 'KeyA' || e.code === 'KeyQ') {
            const nextIndex = (currentIndex - 1 + shipsList.length) % shipsList.length;
            setRespawnShipId(shipsList[nextIndex].id);
            e.preventDefault();
          } else if (e.code === 'KeyD') {
            const nextIndex = (currentIndex + 1) % shipsList.length;
            setRespawnShipId(shipsList[nextIndex].id);
            e.preventDefault();
          } else if (e.code === 'KeyE' && respawnTimeLeft === 0) {
            respawnPlayer();
            e.preventDefault();
          }
        } else {
          if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
            const nextIndex = (currentIndex - 1 + shipsList.length) % shipsList.length;
            setRespawnShipId(shipsList[nextIndex].id);
            e.preventDefault();
          } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            const nextIndex = (currentIndex + 1) % shipsList.length;
            setRespawnShipId(shipsList[nextIndex].id);
            e.preventDefault();
          } else if ((e.code === 'Enter' || e.code === 'Space') && respawnTimeLeft === 0) {
            respawnPlayer();
            e.preventDefault();
          }
        }
      }

      // Player 2 respawn controls (if active and dead)
      if (isTwoPlayers && isDead2 && !isMatchOver) {
        const shipsList2 = faction2 === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
        const currentIndex2 = shipsList2.findIndex(s => s.id === respawnShipId2);

        if (e.code === 'ArrowLeft') {
          const nextIndex = (currentIndex2 - 1 + shipsList2.length) % shipsList2.length;
          setRespawnShipId2(shipsList2[nextIndex].id);
          e.preventDefault();
        } else if (e.code === 'ArrowRight') {
          const nextIndex = (currentIndex2 + 1) % shipsList2.length;
          setRespawnShipId2(shipsList2[nextIndex].id);
          e.preventDefault();
        } else if ((e.code === 'Space' || e.code === 'Enter') && respawnTimeLeft2 === 0) {
          respawnPlayer2();
          e.preventDefault();
        }
      }

      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDown.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pauseSelect, isDead, isMatchOver]);

  // Gamepad controller menu navigation for Pause screen
  useEffect(() => {
    if (!isPaused) return;

    const interval = setInterval(() => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads ? Array.from(gamepads).find(g => g !== null) : null;
      if (!gp) return;

      const deadzone = 0.5;
      const ly = gp.axes[1] || 0;
      const dpadUp = gp.buttons[12]?.pressed;
      const dpadDown = gp.buttons[13]?.pressed;
      const selectBtn = gp.buttons[0]?.pressed; // A button (Cross)
      const startBtn = gp.buttons[9]?.pressed; // Start button

      // Start button toggles pause off
      if (startBtn && !gpStartPressed.current) {
        setIsPaused(false);
        gpStartPressed.current = true;
        return;
      } else if (!startBtn) {
        gpStartPressed.current = false;
      }

      const now = Date.now();
      if (now - gpLastNavTime.current > 220) {
        if (ly < -deadzone || dpadUp) {
          setPauseSelect(prev => prev === 'resume' ? 'quit' : 'resume');
          gpLastNavTime.current = now;
        } else if (ly > deadzone || dpadDown) {
          setPauseSelect(prev => prev === 'resume' ? 'quit' : 'resume');
          gpLastNavTime.current = now;
        }
      }

      if (selectBtn && !gpSelectPressed.current) {
        gpSelectPressed.current = true;
        if (pauseSelect === 'resume') {
          setIsPaused(false);
        } else {
          setIsPaused(false);
          onExit();
        }
      } else if (!selectBtn) {
        gpSelectPressed.current = false;
      }
    }, 16); // ~60fps poll

    return () => clearInterval(interval);
  }, [isPaused, pauseSelect]);

  // Gamepad controller menu navigation for Respawn screen
  useEffect(() => {
    if (!isDead || isMatchOver) return;

    const interval = setInterval(() => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads ? Array.from(gamepads).find(g => g !== null) : null;
      if (!gp) return;

      const lx = gp.axes[0] || 0;
      const deadzone = 0.5;
      const dpadLeft = gp.buttons[14]?.pressed;
      const dpadRight = gp.buttons[15]?.pressed;
      const selectBtn = gp.buttons[0]?.pressed; // A button to deploy

      const now = Date.now();
      const shipsList = faction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
      const currentIndex = shipsList.findIndex(s => s.id === respawnShipId);

      if (now - gpLastNavTime.current > 200) {
        if (lx < -deadzone || dpadLeft) {
          const nextIndex = (currentIndex - 1 + shipsList.length) % shipsList.length;
          setRespawnShipId(shipsList[nextIndex].id);
          gpLastNavTime.current = now;
        } else if (lx > deadzone || dpadRight) {
          const nextIndex = (currentIndex + 1) % shipsList.length;
          setRespawnShipId(shipsList[nextIndex].id);
          gpLastNavTime.current = now;
        }
      }

      if (selectBtn && respawnTimeLeft === 0) {
        respawnPlayer();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isDead, respawnShipId, respawnTimeLeft, faction]);

  // Main 60fps Game Tick Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameTick = () => {
      updateGamePhysics();
      renderScene();
      renderMinimap();
      animationFrameId = requestAnimationFrame(gameTick);
    };

    gameTick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMatchOver]);

  // Respawn player action
  const respawnPlayer = () => {
    const state = game.current;
    const playerDef = getShipDefById(respawnShipId)!;

    const px = Math.random() * (WORLD_SIZE - 800) + 400;
    let py = 0;
    if (faction === 'light') {
      py = 200 + Math.random() * 500;
    } else {
      py = WORLD_SIZE - 700 + Math.random() * 500;
    }

    if (state.playerShip) {
      state.playerShip.defId = respawnShipId;
      state.playerShip.name = `${playerName} (You)`;
      state.playerShip.color = playerDef.color;
      state.playerShip.stats = playerDef.stats;
      state.playerShip.hp = playerDef.stats.shield;
      state.playerShip.maxHp = playerDef.stats.shield;
      state.playerShip.x = px;
      state.playerShip.y = py;
      state.playerShip.vx = 0;
      state.playerShip.vy = 0;
      state.playerShip.angle = faction === 'light' ? Math.PI / 2 : -Math.PI / 2;
      state.playerShip.lastHitTime = 0;
      state.playerShip.boostType = getBoostTypeForShip(respawnShipId);
      state.playerShip.lastBoostTime = 0;
      state.playerShip.boostActiveTimer = 0;
      state.playerShip.lastBombTime = 0;
      state.playerShip.specialType = getSpecialTypeForShip(respawnShipId);
      state.playerShip.lastSpecialTime = 0;
      state.playerShip.shieldActiveTimer = 0;
    }
    setIsDead(false);
  };

  // Respawn player 2 action
  const respawnPlayer2 = () => {
    const state = game.current;
    if (!state.player2Ship) return;
    const playerDef2 = getShipDefById(respawnShipId2)!;
    
    const px = Math.random() * (WORLD_SIZE - 800) + 400;
    let py = 0;
    if (faction2 === 'light') {
      py = 200 + Math.random() * 500;
    } else {
      py = WORLD_SIZE - 700 + Math.random() * 500;
    }

    state.player2Ship.defId = respawnShipId2;
    state.player2Ship.name = `${playerName2} (P2)`;
    state.player2Ship.color = playerDef2.color;
    state.player2Ship.stats = playerDef2.stats;
    state.player2Ship.hp = playerDef2.stats.shield;
    state.player2Ship.maxHp = playerDef2.stats.shield;
    state.player2Ship.x = px;
    state.player2Ship.y = py;
    state.player2Ship.vx = 0;
    state.player2Ship.vy = 0;
    state.player2Ship.angle = faction2 === 'light' ? Math.PI / 2 : -Math.PI / 2;
    state.player2Ship.lastHitTime = 0;
    state.player2Ship.boostType = getBoostTypeForShip(respawnShipId2);
    state.player2Ship.lastBoostTime = 0;
    state.player2Ship.boostActiveTimer = 0;
    state.player2Ship.lastBombTime = 0;
    state.player2Ship.specialType = getSpecialTypeForShip(respawnShipId2);
    state.player2Ship.lastSpecialTime = 0;
    state.player2Ship.shieldActiveTimer = 0;
    setIsDead2(false);
  };

  // Helper to aggregate kills by faction
  const getFactionScores = () => {
    let lightKills = 0;
    let lightDeaths = 0;
    let darkKills = 0;
    let darkDeaths = 0;

    game.current.ships.forEach(s => {
      const k = s.kills || 0;
      const d = s.deaths || 0;
      if (s.faction === 'light') {
        lightKills += k;
        lightDeaths += d;
      } else {
        darkKills += k;
        darkDeaths += d;
      }
    });

    return { lightKills, lightDeaths, darkKills, darkDeaths };
  };

  // Helper to get pilot scoreboard list
  const getLeaderboard = () => {
    return [...game.current.ships].sort((a, b) => {
      const killsA = a.kills || 0;
      const killsB = b.kills || 0;
      if (killsB !== killsA) {
        return killsB - killsA;
      }
      const deathsA = a.deaths || 0;
      const deathsB = b.deaths || 0;
      return deathsA - deathsB;
    });
  };

  const spawnSplashExplosion = (x: number, y: number, color: string, count = 70) => {
    const state = game.current;
    
    // 1. Add primary expanding shockwave ring (purple)
    state.particles.push({
      id: `p_shockwave_${Math.random()}`,
      x,
      y,
      vx: 0,
      vy: 0,
      life: 40,
      maxLife: 40,
      color: 'rgba(168, 85, 247, 0.45)', // Emissive purple
      size: 1,
      isShockwave: true,
      maxRadius: 600
    });

    // 2. Add secondary faster white shockwave ring
    state.particles.push({
      id: `p_shockwave2_${Math.random()}`,
      x,
      y,
      vx: 0,
      vy: 0,
      life: 25,
      maxLife: 25,
      color: 'rgba(255, 255, 255, 0.70)',
      size: 1,
      isShockwave: true,
      maxRadius: 450
    });

    // 3. Bilowing fire/smoke particles that expand and fade
    const fireCount = Math.floor(count * 0.45);
    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 3.5;
      state.particles.push({
        id: `p_fire_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 35 + Math.floor(Math.random() * 25),
        maxLife: 60,
        color: '#ffffff', // color is dynamic based on life in renderer
        size: 5 + Math.random() * 6,
        isFire: true
      });
    }

    // 4. Fast multicolored debris and sparkle fragments
    const sparkCount = count - fireCount;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 9.0;
      const particleColor = Math.random() < 0.5 
        ? '#c084fc' // Light violet
        : (Math.random() < 0.75 ? '#f472b6' : '#ffffff'); // Pink or white

      state.particles.push({
        id: `p_splash_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.floor(Math.random() * 30),
        maxLife: 50,
        color: particleColor,
        size: Math.random() < 0.25 ? 6 : (Math.random() < 0.65 ? 3 : 1.5)
      });
    }
  };

  const detonateBomb = (bomb: Laser) => {
    const state = game.current;
    const splashRadius = 400; // reduced back to 400 to make the area damage smaller
    const splashDamage = 150; 

    // Screenshake based on proximity to player 1
    const player = state.playerShip;
    if (player) {
      const dx = player.x - bomb.x;
      const dy = player.y - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < splashRadius + 200) {
        const factor = Math.max(0, 1 - dist / (splashRadius + 200));
        screenShake.current = {
          duration: Math.floor(30 + factor * 25),
          amplitude: Math.floor(10 + factor * 16)
        };
      }
    }

    // Screenshake based on proximity to player 2
    const player2 = state.player2Ship;
    if (isTwoPlayers && player2) {
      const dx = player2.x - bomb.x;
      const dy = player2.y - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < splashRadius + 200) {
        const factor = Math.max(0, 1 - dist / (splashRadius + 200));
        screenShake2.current = {
          duration: Math.floor(30 + factor * 25),
          amplitude: Math.floor(10 + factor * 16)
        };
      }
    }

    // Trigger purple screen flash disabled to keep screen color unchanged

    // Spawn purple splash explosion particles & shockwaves
    spawnSplashExplosion(bomb.x, bomb.y, '#c084fc', 70);

    // Splash damage to ships (excluding friendly fire and active shields)
    state.ships.forEach(ship => {
      if (ship.hp <= 0) return;
      if (ship.faction === bomb.faction) return; // friendly-fire safety
      if (ship.shieldActiveTimer && ship.shieldActiveTimer > 0) return; // shield blocks splash damage

      const dx = ship.x - bomb.x;
      const dy = ship.y - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < splashRadius) {
        ship.hp = Math.max(0, ship.hp - splashDamage);
        ship.lastHitTime = Date.now();

        if (ship.hp > 0) {
          if (ship.id === 'player') {
            screenShake.current = { duration: 12, amplitude: 4 };
          } else if (ship.id === 'player2') {
            screenShake2.current = { duration: 12, amplitude: 4 };
          }
        }

        // Check fainted ship
        if (ship.hp <= 0) {
          spawnExplosion(ship.x, ship.y, '#eab308', 35);
          spawnExplosion(ship.x, ship.y, '#f97316', 25);

          ship.deaths = (ship.deaths || 0) + 1;

          const killer = state.ships.find(s => s.id === bomb.ownerId);
          if (killer) {
            killer.kills = (killer.kills || 0) + 1;
            if (killer.isPlayer) {
              state.score += ship.stats.shield * 10;
              const killerName = killer.id === 'player2' ? playerName2 : playerName;
              const killerFaction = killer.id === 'player2' ? faction2 : faction;
              onKillFeed?.(`💥 Pilot ${killerName} destroyed ${ship.name} with a Space Bomb!`, killerFaction);
            }
          }

          if (ship.id === 'player') {
            setIsDead(true);
            const killerName = killer ? killer.name : 'Unknown Enemy';
            const killerFaction = killer ? killer.faction : (faction === 'light' ? 'dark' : 'light');
            onKillFeed?.(`💀 Pilot ${playerName} was fainted by ${killerName}!`, killerFaction);
          } else if (ship.id === 'player2') {
            setIsDead2(true);
            const killerName = killer ? killer.name : 'Unknown Enemy';
            const killerFaction = killer ? killer.faction : (faction2 === 'light' ? 'dark' : 'light');
            onKillFeed?.(`💀 Pilot ${playerName2} was fainted by ${killerName}!`, killerFaction);
          } else {
            const deadShip = ship;
            setTimeout(() => {
              if (game.current.playerShip && !isMatchOver) {
                deadShip.hp = deadShip.maxHp;
                deadShip.x = Math.random() * (WORLD_SIZE - 800) + 400;
                if (deadShip.faction === 'light') {
                  deadShip.y = 200 + Math.random() * 500;
                  deadShip.angle = Math.PI / 2;
                } else {
                  deadShip.y = WORLD_SIZE - 700 + Math.random() * 500;
                  deadShip.angle = -Math.PI / 2;
                }
                deadShip.vx = 0;
                deadShip.vy = 0;
              }
            }, 5000);
          }
        }
      }
    });

    // Splash damage to asteroids
    state.asteroids.forEach(ast => {
      const dx = ast.x - bomb.x;
      const dy = ast.y - bomb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < splashRadius) {
        ast.hp -= splashDamage;

        if (ast.hp <= 0) {
          spawnExplosion(ast.x, ast.y, '#9ca3af', 15, 'asteroid');
          if (ast.size > 1) {
            const newSize = ast.size - 1;
            state.asteroids.push(
              {
                id: `ast_${ast.id}_1`,
                x: ast.x + (Math.random() - 0.5) * 20,
                y: ast.y + (Math.random() - 0.5) * 20,
                vx: ast.vx + (Math.random() - 0.5) * 1.2,
                vy: ast.vy + (Math.random() - 0.5) * 1.2,
                size: newSize,
                hp: newSize * 15
              },
              {
                id: `ast_${ast.id}_2`,
                x: ast.x + (Math.random() - 0.5) * 20,
                y: ast.y + (Math.random() - 0.5) * 20,
                vx: ast.vx + (Math.random() - 0.5) * 1.2,
                vy: ast.vy + (Math.random() - 0.5) * 1.2,
                size: newSize,
                hp: newSize * 15
              }
            );
          }
          state.score += ast.size * 50;
        }
      }
    });
  };

  const triggerSpeedBoost = (ship: SpaceShip) => {
    const now = Date.now();
    ship.lastBoostTime = now;

    if (ship.boostType === 'dash') {
      const dashDistance = 320;
      const startX = ship.x;
      const startY = ship.y;

      // Trail at starting point
      spawnExplosion(startX, startY, ship.faction === 'light' ? '#38bdf8' : '#ef4444', 15);

      // Dash forward
      ship.x += Math.cos(ship.angle) * dashDistance;
      ship.y += Math.sin(ship.angle) * dashDistance;

      // Keep within map boundaries
      ship.x = Math.max(60, Math.min(WORLD_SIZE - 60, ship.x));
      ship.y = Math.max(60, Math.min(WORLD_SIZE - 60, ship.y));

      // Trail at end point
      spawnExplosion(ship.x, ship.y, ship.faction === 'light' ? '#38bdf8' : '#ef4444', 15);

      // Boost velocity
      const dashSpeed = ship.stats.speed * 0.9;
      ship.vx = Math.cos(ship.angle) * dashSpeed;
      ship.vy = Math.sin(ship.angle) * dashSpeed;

      if (ship.isPlayer) {
        if (ship.id === 'player2') {
          screenShake2.current = { duration: 18, amplitude: 8 };
        } else {
          screenShake.current = { duration: 18, amplitude: 8 };
        }
      }
    } else {
      // 200% speed increase = 3x total speed multiplier for 6s (360 frames)
      ship.boostActiveTimer = 360;

      if (ship.isPlayer) {
        if (ship.id === 'player2') {
          screenShake2.current = { duration: 10, amplitude: 3 };
        } else {
          screenShake.current = { duration: 10, amplitude: 3 };
        }
      }
    }
  };

  const triggerSpecialMove = (ship: SpaceShip) => {
    const now = Date.now();
    ship.lastSpecialTime = now;

    if (ship.specialType === 'beam') {
      const lx = ship.x + Math.cos(ship.angle) * 30;
      const ly = ship.y + Math.sin(ship.angle) * 30;
      const speed = LASER_SPEED * 1.6;
      const vx = Math.cos(ship.angle) * speed;
      const vy = Math.sin(ship.angle) * speed;

      const state = game.current;
      state.lasers.push({
        id: `las_beam_${Math.random()}`,
        ownerId: ship.id,
        faction: ship.faction,
        x: lx,
        y: ly,
        vx,
        vy,
        damage: 1000,
        rangeRemaining: 99999,
        color: ship.faction === 'light' ? '#38bdf8' : '#ef4444',
        isSuperBeam: true
      });

      // Special visual firing effects
      spawnExplosion(lx, ly, ship.faction === 'light' ? '#38bdf8' : '#ef4444', 30);

      if (ship.isPlayer) {
        if (ship.id === 'player2') {
          screenShake2.current = { duration: 35, amplitude: 14 };
        } else {
          screenShake.current = { duration: 35, amplitude: 14 };
        }
      }
    } else {
      // Protect from all incoming attacks for 5s (300 frames)
      ship.shieldActiveTimer = 300;

      spawnExplosion(ship.x, ship.y, ship.faction === 'light' ? '#60a5fa' : '#f87171', 20);

      if (ship.isPlayer) {
        if (ship.id === 'player2') {
          screenShake2.current = { duration: 12, amplitude: 4 };
        } else {
          screenShake.current = { duration: 12, amplitude: 4 };
        }
      }
    }
  };

  // Physics Updates
  const updateGamePhysics = () => {
    if (isPausedRef.current || isMatchOver) return;
    const state = game.current;
    if (!state.playerShip) return;

    // --- 1. Screen Shake & Flash Decay ---
    if (screenShake.current.duration > 0) {
      screenShake.current.duration -= 1;
    }
    if (screenShake2.current.duration > 0) {
      screenShake2.current.duration -= 1;
    }
    if (screenFlash.current.duration > 0) {
      screenFlash.current.duration -= 1;
    }
    if (screenFlash2.current.duration > 0) {
      screenFlash2.current.duration -= 1;
    }

    // --- 2. Update Player Ship Physics ---
    const player = state.playerShip;
    if (player.hp > 0) {
      // Health Regeneration (if not hit for 2s / 2000ms)
      if (player.lastHitTime && Date.now() - player.lastHitTime > 2000) {
        player.hp = Math.min(player.maxHp, player.hp + 0.18); // regenerates ~10.8 HP per second
      }

      // Check boost status
      const isBoostActive = player.boostActiveTimer !== undefined && player.boostActiveTimer > 0;
      const speedMultiplier = isBoostActive ? 3.0 : 1.0;

      let ax = 0;
      let ay = 0;
      const accel = 0.22 * (isBoostActive ? 2.5 : 1.0);
      const controlSign = faction === 'light' ? -1 : 1;

      // Poll Gamepad inputs if a controller is connected
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      // gp1 (Player 1) is gamepads[0], gp2 (Player 2) is gamepads[1]
      const gp = gamepads ? Array.from(gamepads).find((g, i) => g !== null && i === 0) : null;
      const gp2 = gamepads ? Array.from(gamepads).find((g, i) => g !== null && i === 1) : null;
      
      let gpAx = 0;
      let gpAy = 0;
      let gpShoot = false;
      let gpBomb = false;
      let gpBoost = false;
      let gpSpecial = false;
      let gpPausedToggle = false;

      if (gp) {
        const lx = gp.axes[0] || 0;
        const ly = gp.axes[1] || 0;
        // Radial deadzone with magnitude rescaling — smooth circular analog control:
        // a small tilt nudges gently, a full tilt pushes at max. No square-corner snapping.
        const mag = Math.hypot(lx, ly);
        const deadzone = 0.12;
        if (mag > deadzone) {
          const scaled = (mag - deadzone) / (1 - deadzone); // 0..1
          const norm = Math.min(1, scaled) ** 1.4;          // ease for finer low-end control
          gpAx = (lx / mag) * norm;
          gpAy = (ly / mag) * norm;
        }

        // Button 4 is L1 (Left Shoulder) and Button 3 is Y/Triangle
        const l1Pressed = gp.buttons[4] && gp.buttons[4].pressed;
        const yPressed = gp.buttons[3] && gp.buttons[3].pressed;
        if (l1Pressed || yPressed) {
          gpShoot = true;
        }

        // Button 6 is L2 (Left Trigger)
        if (gp.buttons[6] && gp.buttons[6].pressed) {
          gpBomb = true;
        }

        // Button 5 is R1 (Right Shoulder)
        if (gp.buttons[5] && gp.buttons[5].pressed) {
          gpBoost = true;
        }

        // Button 7 is R2 (Right Trigger)
        if (gp.buttons[7] && gp.buttons[7].pressed) {
          gpSpecial = true;
        }

        // Button 9 is Start
        if (gp.buttons[9]) {
          if (gp.buttons[9].pressed && !gpStartPressed.current) {
            gpPausedToggle = true;
            gpStartPressed.current = true;
          } else if (!gp.buttons[9].pressed) {
            gpStartPressed.current = false;
          }
        }
      }

      // Handle controller pause toggle
      if (gpPausedToggle && !isDead && !isMatchOver) {
        setIsPaused(prev => !prev);
      }

      // Set movement forces: Controller Joystick overrides Keyboard
      if (gpAx !== 0 || gpAy !== 0) {
        ax = gpAx * accel * controlSign;
        ay = gpAy * accel * controlSign;
      } else {
        // Keyboard ZQSD movement (layout-aware)
        const moveUpPressed = keyboardLayout.current === 'azerty'
          ? (keysPressed.current['KeyZ'] || keysPressed.current['ArrowUp'])
          : (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']);

        if (moveUpPressed) {
          ay = -accel * controlSign;
        }
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
          ay = accel * controlSign;
        }
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
          ax = -accel * controlSign;
        }
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
          ax = accel * controlSign;
        }
      }

      // Apply forces
      player.vx += ax;
      player.vy += ay;

      // Friction/Damping
      player.vx *= 0.975;
      player.vy *= 0.975;

      // Speed clamp (faster gameplay)
      const maxSpeed = player.stats.speed * 0.64 * speedMultiplier;
      const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (currentSpeed > maxSpeed) {
        player.vx = (player.vx / currentSpeed) * maxSpeed;
        player.vy = (player.vy / currentSpeed) * maxSpeed;
      }

      // Decrement boost timer
      if (player.boostActiveTimer && player.boostActiveTimer > 0) {
        player.boostActiveTimer -= 1;
        // Spawn trail particles
        if (Math.random() < 0.6) {
          const trailAngle = player.angle + Math.PI + (Math.random() - 0.5) * 0.5;
          state.particles.push({
            id: `p_trail_${Math.random()}`,
            x: player.x - Math.cos(player.angle) * 16,
            y: player.y - Math.sin(player.angle) * 16,
            vx: Math.cos(trailAngle) * 3 + player.vx,
            vy: Math.sin(trailAngle) * 3 + player.vy,
            life: 15 + Math.floor(Math.random() * 15),
            maxLife: 30,
            color: '#f59e0b',
            size: Math.random() < 0.5 ? 4.5 : 2.5
          });
        }
      }

      // Decrement shield timer
      if (player.shieldActiveTimer && player.shieldActiveTimer > 0) {
        player.shieldActiveTimer -= 1;
        // Spawn shield boundary glow particles
        if (Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const px = player.x + Math.cos(angle) * 55;
          const py = player.y + Math.sin(angle) * 55;
          state.particles.push({
            id: `p_shield_${Math.random()}`,
            x: px,
            y: py,
            vx: player.vx + (Math.random() - 0.5) * 0.4,
            vy: player.vy + (Math.random() - 0.5) * 0.4,
            life: 10 + Math.floor(Math.random() * 10),
            maxLife: 20,
            color: player.faction === 'light' ? '#38bdf8' : '#ef4444',
            size: 1.5
          });
        }
      }

      // Bomb and Boost Inputs (5s reload)
      const bombPressed = keysPressed.current['KeyE'] || gpBomb;
      const now = Date.now();
      const lastBomb = player.lastBombTime || 0;
      if (bombPressed && now - lastBomb >= 5000) {
        fireLaser(player, true); // true = isBomb
        player.lastBombTime = now;
      }

      const boostPressed = keysPressed.current['KeyR'] || gpBoost;
      const lastBoost = player.lastBoostTime || 0;
      if (boostPressed && now - lastBoost >= 5000) {
        triggerSpeedBoost(player);
      }

      // Special Move Input (13s reload for beam, 7s for shield)
      const specialPressed = keyboardLayout.current === 'azerty'
        ? keysPressed.current['KeyW']
        : keysPressed.current['KeyZ'];
      const finalSpecialPressed = specialPressed || gpSpecial;
      const lastSpecial = player.lastSpecialTime || 0;
      if (finalSpecialPressed && now - lastSpecial >= getSpecialCooldown(player.specialType)) {
        triggerSpecialMove(player);
      }

      // Update position
      player.x += player.vx;
      player.y += player.vy;

      // Keep player inside world bounds, and check for hyperspace hangar warp
      player.x = Math.max(50, Math.min(WORLD_SIZE - 50, player.x));
      
      const isNearEnemyHangar = faction === 'light' 
        ? player.y > WORLD_SIZE - 100 
        : player.y < 100;

      if (isNearEnemyHangar) {
        // Warp player back to base
        player.x = Math.random() * (WORLD_SIZE - 800) + 400;
        player.y = faction === 'light' 
          ? 200 + Math.random() * 500 
          : WORLD_SIZE - 700 + Math.random() * 500;
        player.vx = 0;
        player.vy = 0;
        player.angle = faction === 'light' ? Math.PI / 2 : -Math.PI / 2;

        // Sparkle warp effects
        spawnExplosion(player.x, player.y, player.color, 30);
        screenShake.current = { duration: 25, amplitude: 12 };
      } else {
        player.y = Math.max(50, Math.min(WORLD_SIZE - 50, player.y));
      }

      // Controller / Mouse Aiming Direction
      let aimed = false;
      if (gp) {
        const rx = gp.axes[2] || 0;
        const ry = gp.axes[3] || 0;
        const rightDeadzone = 0.18;
        const rightStickDist = Math.sqrt(rx * rx + ry * ry);

        if (rightStickDist > rightDeadzone) {
          player.angle = Math.atan2(ry, rx) + (faction === 'light' ? Math.PI : 0);
          aimed = true;
        } else if (gpAx !== 0 || gpAy !== 0) {
          // Move-to-face: face left joystick movement angle
          player.angle = Math.atan2(gpAy, gpAx) + (faction === 'light' ? Math.PI : 0);
          aimed = true;
        }
      }

      if (!aimed) {
        const canvas = canvasRef.current;
        if (canvas) {
          const screenCenterX = isTwoPlayers ? canvas.width / 4 : canvas.width / 2;
          const screenCenterY = canvas.height / 2;
          const dx = mousePos.current.x - screenCenterX;
          const dy = mousePos.current.y - screenCenterY;
          // If Light side, the screen is rotated 180 degrees, so we rotate the target angle by 180 degrees in world coordinates
          player.angle = Math.atan2(dy, dx) + (faction === 'light' ? Math.PI : 0);
        }
      }

      // Engine particles
      if ((ax !== 0 || ay !== 0) && Math.random() < 0.4) {
        const flameAngle = player.angle + Math.PI + (Math.random() - 0.5) * 0.4;
        state.particles.push({
          id: `p_${Math.random()}`,
          x: player.x - Math.cos(player.angle) * 16,
          y: player.y - Math.sin(player.angle) * 16,
          vx: Math.cos(flameAngle) * 1.5 + player.vx,
          vy: Math.sin(flameAngle) * 1.5 + player.vy,
          life: 10 + Math.floor(Math.random() * 10),
          maxLife: 20,
          color: player.faction === 'light' ? '#38bdf8' : '#ef4444',
          size: Math.random() < 0.5 ? 3 : 1.5
        });
      }

      // Shoot trigger (using Left Click, KeyI, KeyQ, or Gamepad Y/Triangle Button 3)
      if (isMouseDown.current || keysPressed.current['KeyI'] || keysPressed.current['KeyQ'] || gpShoot) {
        const now = Date.now();
        if (now - player.lastShotTime >= player.stats.rate) {
          fireLaser(player);
          player.lastShotTime = now;
        }
      }
    }

    // --- 2b. Update Player 2 Ship Physics ---
    const player2 = state.player2Ship;
    if (isTwoPlayers && player2 && player2.hp > 0) {
      // Health Regeneration (if not hit for 2s / 2000ms)
      if (player2.lastHitTime && Date.now() - player2.lastHitTime > 2000) {
        player2.hp = Math.min(player2.maxHp, player2.hp + 0.18); // regenerates ~10.8 HP per second
      }

      // Check boost status
      const isBoostActive2 = player2.boostActiveTimer !== undefined && player2.boostActiveTimer > 0;
      const speedMultiplier2 = isBoostActive2 ? 3.0 : 1.0;

      let ax2 = 0;
      let ay2 = 0;
      const accel2 = 0.22 * (isBoostActive2 ? 2.5 : 1.0);
      const controlSign2 = faction2 === 'light' ? -1 : 1;

      // Poll Gamepad 2 inputs if connected
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp2 = gamepads ? Array.from(gamepads).find((g, i) => g !== null && i === 1) : null;

      let gpAx2 = 0;
      let gpAy2 = 0;
      let gpShoot2 = false;
      let gpBomb2 = false;
      let gpBoost2 = false;
      let gpSpecial2 = false;

      if (gp2) {
        const lx2 = gp2.axes[0] || 0;
        const ly2 = gp2.axes[1] || 0;
        // Radial deadzone with magnitude rescaling — smooth circular analog control.
        const mag2 = Math.hypot(lx2, ly2);
        const deadzone = 0.12;
        if (mag2 > deadzone) {
          const scaled2 = (mag2 - deadzone) / (1 - deadzone);
          const norm2 = Math.min(1, scaled2) ** 1.4;
          gpAx2 = (lx2 / mag2) * norm2;
          gpAy2 = (ly2 / mag2) * norm2;
        }

        const l1Pressed2 = gp2.buttons[4] && gp2.buttons[4].pressed;
        const yPressed2 = gp2.buttons[3] && gp2.buttons[3].pressed;
        if (l1Pressed2 || yPressed2) {
          gpShoot2 = true;
        }

        if (gp2.buttons[6] && gp2.buttons[6].pressed) {
          gpBomb2 = true;
        }

        if (gp2.buttons[5] && gp2.buttons[5].pressed) {
          gpBoost2 = true;
        }

        if (gp2.buttons[7] && gp2.buttons[7].pressed) {
          gpSpecial2 = true;
        }
      }

      // Movement controls (Gamepad vs Keyboard)
      if (gpAx2 !== 0 || gpAy2 !== 0) {
        ax2 = gpAx2 * accel2 * controlSign2;
        ay2 = gpAy2 * accel2 * controlSign2;
      } else {
        // Asteroids thrust keyboard controls for Player 2 (ArrowUp thrusts forward, ArrowLeft/Right rotates)
        const p2ControlSign = faction2 === 'light' ? -1 : 1;
        if (keysPressed.current['ArrowLeft']) {
          player2.angle -= 0.05 * p2ControlSign;
        }
        if (keysPressed.current['ArrowRight']) {
          player2.angle += 0.05 * p2ControlSign;
        }
        
        if (keysPressed.current['ArrowUp']) {
          ax2 = Math.cos(player2.angle) * accel2;
          ay2 = Math.sin(player2.angle) * accel2;
        }
        if (keysPressed.current['ArrowDown']) {
          // Brake/Slow down
          player2.vx *= 0.88;
          player2.vy *= 0.88;
        }
      }

      // Apply forces
      player2.vx += ax2;
      player2.vy += ay2;

      // Friction
      player2.vx *= 0.975;
      player2.vy *= 0.975;

      // Speed clamp
      const maxSpeed2 = player2.stats.speed * 0.64 * speedMultiplier2;
      const currentSpeed2 = Math.sqrt(player2.vx * player2.vx + player2.vy * player2.vy);
      if (currentSpeed2 > maxSpeed2) {
        player2.vx = (player2.vx / currentSpeed2) * maxSpeed2;
        player2.vy = (player2.vy / currentSpeed2) * maxSpeed2;
      }

      // Decrement boost timer
      if (player2.boostActiveTimer && player2.boostActiveTimer > 0) {
        player2.boostActiveTimer -= 1;
        if (Math.random() < 0.6) {
          const trailAngle = player2.angle + Math.PI + (Math.random() - 0.5) * 0.5;
          state.particles.push({
            id: `p_trail_p2_${Math.random()}`,
            x: player2.x - Math.cos(player2.angle) * 16,
            y: player2.y - Math.sin(player2.angle) * 16,
            vx: Math.cos(trailAngle) * 3 + player2.vx,
            vy: Math.sin(trailAngle) * 3 + player2.vy,
            life: 15 + Math.floor(Math.random() * 15),
            maxLife: 30,
            color: '#f59e0b',
            size: Math.random() < 0.5 ? 4.5 : 2.5
          });
        }
      }

      // Decrement shield timer
      if (player2.shieldActiveTimer && player2.shieldActiveTimer > 0) {
        player2.shieldActiveTimer -= 1;
        if (Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const px = player2.x + Math.cos(angle) * 55;
          const py = player2.y + Math.sin(angle) * 55;
          state.particles.push({
            id: `p_shield_p2_${Math.random()}`,
            x: px,
            y: py,
            vx: player2.vx + (Math.random() - 0.5) * 0.4,
            vy: player2.vy + (Math.random() - 0.5) * 0.4,
            life: 10 + Math.floor(Math.random() * 10),
            maxLife: 20,
            color: player2.faction === 'light' ? '#38bdf8' : '#ef4444',
            size: 1.5
          });
        }
      }

      // Bomb, Boost, and Special Inputs
      const bombPressed2 = keysPressed.current['KeyK'] || keysPressed.current['Numpad1'] || keysPressed.current['Comma'] || keysPressed.current['KeyM'] || gpBomb2;
      const now = Date.now();
      const lastBomb2 = player2.lastBombTime || 0;
      if (bombPressed2 && now - lastBomb2 >= 5000) {
        fireLaser(player2, true);
        player2.lastBombTime = now;
      }

      const boostPressed2 = keysPressed.current['KeyL'] || keysPressed.current['Numpad3'] || keysPressed.current['Period'] || keysPressed.current['NumpadDecimal'] || gpBoost2;
      const lastBoost2 = player2.lastBoostTime || 0;
      if (boostPressed2 && now - lastBoost2 >= 5000) {
        triggerSpeedBoost(player2);
      }

      const specialPressed2 = keysPressed.current['KeyO'] || keysPressed.current['Numpad2'] || keysPressed.current['Slash'] || gpSpecial2;
      const lastSpecial2 = player2.lastSpecialTime || 0;
      if (specialPressed2 && now - lastSpecial2 >= getSpecialCooldown(player2.specialType)) {
        triggerSpecialMove(player2);
      }

      // Position update
      player2.x += player2.vx;
      player2.y += player2.vy;

      // Map bounds
      player2.x = Math.max(50, Math.min(WORLD_SIZE - 50, player2.x));

      const isNearEnemyHangar2 = faction2 === 'light' 
        ? player2.y > WORLD_SIZE - 100 
        : player2.y < 100;

      if (isNearEnemyHangar2) {
        player2.x = Math.random() * (WORLD_SIZE - 800) + 400;
        player2.y = faction2 === 'light' 
          ? 200 + Math.random() * 500 
          : WORLD_SIZE - 700 + Math.random() * 500;
        player2.vx = 0;
        player2.vy = 0;
        player2.angle = faction2 === 'light' ? Math.PI / 2 : -Math.PI / 2;

        spawnExplosion(player2.x, player2.y, player2.color, 30);
        screenShake2.current = { duration: 25, amplitude: 12 };
      } else {
        player2.y = Math.max(50, Math.min(WORLD_SIZE - 50, player2.y));
      }

      // Aiming angle for Player 2
      let aimed2 = false;
      if (gp2) {
        const rx2 = gp2.axes[2] || 0;
        const ry2 = gp2.axes[3] || 0;
        const rightDeadzone = 0.18;
        const rightStickDist = Math.sqrt(rx2 * rx2 + ry2 * ry2);

        if (rightStickDist > rightDeadzone) {
          player2.angle = Math.atan2(ry2, rx2) + (faction2 === 'light' ? Math.PI : 0);
          aimed2 = true;
        } else if (gpAx2 !== 0 || gpAy2 !== 0) {
          player2.angle = Math.atan2(gpAy2, gpAx2) + (faction2 === 'light' ? Math.PI : 0);
          aimed2 = true;
        }
      }

      // Engine particles
      if ((ax2 !== 0 || ay2 !== 0 || keysPressed.current['ArrowUp']) && Math.random() < 0.4) {
        const flameAngle = player2.angle + Math.PI + (Math.random() - 0.5) * 0.4;
        state.particles.push({
          id: `p_p2_${Math.random()}`,
          x: player2.x - Math.cos(player2.angle) * 16,
          y: player2.y - Math.sin(player2.angle) * 16,
          vx: Math.cos(flameAngle) * 1.5 + player2.vx,
          vy: Math.sin(flameAngle) * 1.5 + player2.vy,
          life: 10 + Math.floor(Math.random() * 10),
          maxLife: 20,
          color: player2.faction === 'light' ? '#38bdf8' : '#ef4444',
          size: Math.random() < 0.5 ? 3 : 1.5
        });
      }

      // Shoot trigger for Player 2
      const shootPressed2 = keysPressed.current['Space'] || keysPressed.current['Numpad0'] || keysPressed.current['Enter'] || gpShoot2;
      if (shootPressed2) {
        const now = Date.now();
        if (now - player2.lastShotTime >= player2.stats.rate) {
          fireLaser(player2);
          player2.lastShotTime = now;
        }
      }
    }

    // --- 3. Update AI Fleet Ships (Skipping dead AI) ---
    state.ships.forEach(ship => {
      if (ship.isPlayer) return;
      if (ship.hp <= 0) return;

      // AI decision tick
      if (!ship.aiDecisionTimer) ship.aiDecisionTimer = 0;
      ship.aiDecisionTimer -= 1;

      if (ship.aiDecisionTimer <= 0) {
        ship.aiDecisionTimer = 15 + Math.floor(Math.random() * 20); // ~0.25s to 0.6s tick rate for high responsiveness

        const now = Date.now();

        // 1. Self-preservation check: escape if very low HP
        // Differed thresholds by ship class
        const isLourd = ['millennium_falcon', 'solar_sailer', 'x_wing'].includes(ship.defId);
        const isIntercepteur = ['tie_vader', 'jedi_interceptor', 'tie_n2', 'delta_7'].includes(ship.defId);
        const escapeHpThreshold = isLourd ? 0.20 : (isIntercepteur ? 0.40 : 0.30);

        if (ship.hp < ship.maxHp * escapeHpThreshold) {
          // Find nearest threat of opposite faction
          let nearestThreat: SpaceShip | null = null;
          let threatDist = 900;

          for (const t of state.ships) {
            if (t.faction !== ship.faction && t.hp > 0) {
              const dx = t.x - ship.x;
              const dy = t.y - ship.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < threatDist) {
                threatDist = dist;
                nearestThreat = t;
              }
            }
          }

          if (nearestThreat) {
            ship.aiState = 'escape';
            ship.targetId = nearestThreat.id;
            
            // Cry for help! Force a nearby ally in patrol/formation to come support
            let nearbyAlly: SpaceShip | null = null;
            let bestAllyDist = 1200;
            for (const ally of state.ships) {
              if (ally.faction === ship.faction && ally.id !== ship.id && ally.hp > ally.maxHp * 0.5 && (ally.aiState === 'patrol' || ally.aiState === 'formation')) {
                const adx = ally.x - ship.x;
                const ady = ally.y - ship.y;
                const adist = Math.sqrt(adx * adx + ady * ady);
                if (adist < bestAllyDist) {
                  bestAllyDist = adist;
                  nearbyAlly = ally;
                }
              }
            }
            if (nearbyAlly) {
              nearbyAlly.aiState = 'support';
              nearbyAlly.targetId = nearestThreat.id;
              nearbyAlly.aiDecisionTimer = 45; // lock support choice for ~1.5s
            }
          } else {
            ship.aiState = 'patrol';
            ship.targetId = undefined;
          }
        } else {
          // 2. Teamwork / Wingman strategy check: check if a nearby ally needs help
          // Interceptors are solo hunters (20% support rate), others are cooperative wingmen (75% support rate)
          const isSoloHunter = ['tie_vader', 'tie_n2', 'delta_7', 'jedi_interceptor', 'tie_silencer'].includes(ship.defId);
          const supportProbability = isSoloHunter ? 0.2 : 0.75;
          let foundAllyToSupport = false;

          if (Math.random() < supportProbability) {
            let distressedAlly: SpaceShip | null = null;
            let allyDist = 800;

            for (const ally of state.ships) {
              if (ally.faction === ship.faction && ally.id !== ship.id && ally.hp > 0 && ally.hp < ally.maxHp * 0.5) {
                const dx = ally.x - ship.x;
                const dy = ally.y - ship.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < allyDist) {
                  allyDist = dist;
                  distressedAlly = ally;
                }
              }
            }

            if (distressedAlly) {
              // Target the enemy closest to our distressed ally
              let attackerOfAlly: SpaceShip | null = null;
              let attackerDist = 800;

              for (const enemy of state.ships) {
                if (enemy.faction !== ship.faction && enemy.hp > 0) {
                  const dx = enemy.x - distressedAlly.x;
                  const dy = enemy.y - distressedAlly.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < attackerDist) {
                    attackerDist = dist;
                    attackerOfAlly = enemy;
                  }
                }
              }

              if (attackerOfAlly) {
                ship.aiState = 'support';
                ship.targetId = attackerOfAlly.id;
                foundAllyToSupport = true;
              }
            }
          }

          // 3. Squadron formation & coordinated hunt
          if (!foundAllyToSupport) {
            let nearestTarget: SpaceShip | null = null;
            let minDist = 1350;

            for (const t of state.ships) {
              if (t.faction !== ship.faction && t.hp > 0) {
                const dx = t.x - ship.x;
                const dy = t.y - ship.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDist) {
                  minDist = dist;
                  nearestTarget = t;
                }
              }
            }

            if (nearestTarget) {
              ship.targetId = nearestTarget.id;
              ship.aiState = 'chase';

              // Coordinated Wingman action: if this is a squad leader, notify wingmen to join chase
              if (ship.isSquadLeader) {
                state.ships.forEach(wingman => {
                  if (wingman.squadLeaderId === ship.id && wingman.hp > wingman.maxHp * 0.4 && wingman.aiState === 'formation') {
                    if (Math.random() < 0.65) {
                      wingman.aiState = 'chase';
                      wingman.targetId = nearestTarget!.id;
                      wingman.aiDecisionTimer = 30 + Math.floor(Math.random() * 20); // lock decision
                    }
                  }
                });
              }
            } else {
              // No enemy nearby -> fly in formation if we have a leader
              if (ship.squadLeaderId) {
                const leader = state.ships.find(s => s.id === ship.squadLeaderId && s.hp > 0);
                if (leader) {
                  ship.aiState = 'formation';
                  ship.targetId = leader.id;
                } else {
                  // Leader dead, find another leader or become leader
                  const otherLeader = state.ships.find(s => s.faction === ship.faction && s.isSquadLeader && s.hp > 0);
                  if (otherLeader) {
                    ship.squadLeaderId = otherLeader.id;
                    ship.aiState = 'formation';
                    ship.targetId = otherLeader.id;
                  } else {
                    ship.isSquadLeader = true;
                    ship.squadLeaderId = undefined;
                    ship.aiState = 'patrol';
                    ship.targetId = undefined;
                  }
                }
              } else {
                ship.aiState = 'patrol';
                ship.targetId = undefined;
              }
            }
          }
        }
      }
      // AI Execution state
      const now = Date.now();

      // Dodge incoming lasers if any are extremely close and threatening
      let threatLaser: any = null;
      let minLaserDist = 180;
      for (const laser of state.lasers) {
        if (laser.faction !== ship.faction) {
          const ldx = laser.x - ship.x;
          const ldy = laser.y - ship.y;
          const ldist = Math.sqrt(ldx * ldx + ldy * ldy);
          if (ldist < minLaserDist) {
            // Check if laser is moving towards us (dot product of relative position and velocity is negative)
            const dot = ldx * laser.vx + ldy * laser.vy;
            if (dot < 0) {
              minLaserDist = ldist;
              threatLaser = laser;
            }
          }
        }
      }

      if (threatLaser) {
        // Evade: apply sudden perpendicular acceleration
        const laserAngle = Math.atan2(threatLaser.vy, threatLaser.vx);
        const dodgeAngle = laserAngle + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
        ship.vx += Math.cos(dodgeAngle) * 0.25;
        ship.vy += Math.sin(dodgeAngle) * 0.25;

        // Trigger shield/dash only occasionally (bots conserve specials, and mostly just dash away)
        if (ship.specialType === 'shield' && Math.random() < 0.15 && now - (ship.lastSpecialTime || 0) >= getSpecialCooldown(ship.specialType) * 1.8) {
          triggerSpecialMove(ship);
        } else if (ship.boostType === 'dash' && now - (ship.lastBoostTime || 0) >= 5000) {
          triggerSpeedBoost(ship);
        }
      }

      // Active threat targeting detection (chased by enemy)
      let isChasedByEnemy = false;
      let activeChaser: SpaceShip | null = null;
      for (const enemy of state.ships) {
        if (enemy.faction !== ship.faction && enemy.hp > 0 && enemy.targetId === ship.id) {
          const edx = enemy.x - ship.x;
          const edy = enemy.y - ship.y;
          const edist = Math.sqrt(edx * edx + edy * edy);
          if (edist < 800) {
            // Check if enemy is looking at us
            const angleToShip = Math.atan2(-edy, -edx);
            let angleDiff = angleToShip - enemy.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (Math.abs(angleDiff) < 0.35) {
              isChasedByEnemy = true;
              activeChaser = enemy;
              break;
            }
          }
        }
      }
      
      ship.isChased = isChasedByEnemy;
      
      if (isChasedByEnemy && activeChaser) {
        // Actively chased! Mostly just dash away; only rarely pop a defensive shield
        if (ship.specialType === 'shield' && Math.random() < 0.18 && now - (ship.lastSpecialTime || 0) >= getSpecialCooldown(ship.specialType) * 1.8) {
          triggerSpecialMove(ship);
        } else if (ship.boostType === 'dash' && now - (ship.lastBoostTime || 0) >= 5000) {
          triggerSpeedBoost(ship);
          // Apply quick side dodge force
          const dodgeAngle = activeChaser.angle + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
          ship.vx += Math.cos(dodgeAngle) * 4.0;
          ship.vy += Math.sin(dodgeAngle) * 4.0;
        }
      }

      // --- Execute AI States ---
      if (ship.aiState === 'chase' && ship.targetId) {
        const target = state.ships.find(s => s.id === ship.targetId && s.hp > 0);
        if (target) {
          const dx = target.x - ship.x;
          const dy = target.y - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const targetAngle = Math.atan2(dy, dx);
          let diff = targetAngle - ship.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          // Zigzag evasive deviation if chased
          let zigzagOffset = 0;
          if (ship.isChased) {
            if (!ship.zigzagTimer || ship.zigzagTimer <= 0) {
              ship.zigzagDirection = -(ship.zigzagDirection || 1);
              ship.zigzagTimer = 10 + Math.floor(Math.random() * 15);
            }
            ship.zigzagTimer -= 1;
            zigzagOffset = Math.sin((ship.zigzagTimer) * 0.2) * 0.35 * (ship.zigzagDirection || 1);
          }

          // Loose, dumb aim tracking so the player can out-turn them, but quick
          // enough that bots actually fly toward the fight instead of crawling
          ship.angle += (diff + zigzagOffset) * 0.08;

          // Speed Boost logic — bots roam/reposition a lot (keeps them moving)
          const lastBoost = ship.lastBoostTime || 0;
          if (now - lastBoost >= 6500) {
            const targetBoosting = target.boostActiveTimer !== undefined && target.boostActiveTimer > 0;
            if (dist > 450 || targetBoosting) {
              triggerSpeedBoost(ship);
            }
          }

          // Bomb Special Power Logic — bots rarely bother with bombs now
          const lastBomb = ship.lastBombTime || 0;
          if (now - lastBomb >= 11000 && Math.random() < 0.25) {
            if (dist > 180 && dist < 420 && Math.abs(diff) < 0.3) {
              fireLaser(ship, true); // true = isBomb
              ship.lastBombTime = now;
            }
          }

          // Special Move logic — bots use heavy specials only occasionally
          const lastSpecial = ship.lastSpecialTime || 0;
          if (now - lastSpecial >= getSpecialCooldown(ship.specialType) * 1.8 && Math.random() < 0.2) {
            if (ship.specialType === 'beam' && dist < 600 && Math.abs(diff) < 0.15) {
              triggerSpecialMove(ship);
            } else if (ship.specialType === 'shield' && (ship.hp < ship.maxHp * 0.4 || dist < 220)) {
              triggerSpecialMove(ship);
            }
          }

          const aiBoostActive = ship.boostActiveTimer !== undefined && ship.boostActiveTimer > 0;
          const aiSpeedMultiplier = aiBoostActive ? 3.0 : 1.0;
          const aiMaxSpeed = ship.stats.speed * 0.66 * aiSpeedMultiplier;
          const accelSpeed = aiMaxSpeed * 0.1 * (aiBoostActive ? 1.8 : 1.0);

          // Fly closer if far, orbit if close to make dogfights dynamic
          if (dist > 250) {
            ship.vx += Math.cos(ship.angle) * accelSpeed;
            ship.vy += Math.sin(ship.angle) * accelSpeed;
          } else {
            // Orbit/strafe: add perpendicular thrust to circle around target
            const strafeAngle = ship.angle + Math.PI / 2 * (ship.id.charCodeAt(0) % 2 === 0 ? 1 : -1);
            ship.vx += Math.cos(strafeAngle) * accelSpeed * 0.5;
            ship.vy += Math.sin(strafeAngle) * accelSpeed * 0.5;

            // Maintain slight distance
            if (dist < 130) {
              ship.vx -= Math.cos(ship.angle) * accelSpeed * 0.7;
              ship.vy -= Math.sin(ship.angle) * accelSpeed * 0.7;
            }
          }

          // Restless wandering — bots juke and drift around far more than before
          if (Math.random() < 0.18) {
            ship.vx += Math.cos(ship.angle + Math.PI / 2) * (Math.random() - 0.5) * 3.2;
            ship.vy += Math.sin(ship.angle + Math.PI / 2) * (Math.random() - 0.5) * 3.2;
          }

          // Loose aim cone but they shoot much less frequently (easy to dodge)
          if (dist < ship.stats.range && Math.abs(diff) < 0.32 && now - ship.lastShotTime >= ship.stats.rate * (2.6 + Math.random() * 1.6)) {
            fireLaser(ship);
            ship.lastShotTime = now;
          }
        } else {
          ship.aiState = 'patrol';
        }
      } else if (ship.aiState === 'escape' && ship.targetId) {
        const threat = state.ships.find(s => s.id === ship.targetId && s.hp > 0);
        
        // Flee towards home base Y position, and away from threat
        const isLight = ship.faction === 'light';
        const homeX = WORLD_SIZE / 2;
        const homeY = isLight ? 400 : 7600;

        let fleeAngle = 0;
        let threatDist = 99999;
        let threatDiff = 0;

        if (threat) {
          const dx = threat.x - ship.x;
          const dy = threat.y - ship.y;
          threatDist = Math.sqrt(dx * dx + dy * dy);
          fleeAngle = Math.atan2(-dy, -dx); // directly away

          // Calculate if the threat is behind us
          const threatAngle = Math.atan2(dy, dx);
          threatDiff = threatAngle - ship.angle;
          while (threatDiff < -Math.PI) threatDiff += Math.PI * 2;
          while (threatDiff > Math.PI) threatDiff -= Math.PI * 2;
        } else {
          ship.aiState = 'patrol';
          fleeAngle = Math.atan2(homeY - ship.y, homeX - ship.x);
        }

        const homeAngle = Math.atan2(homeY - ship.y, homeX - ship.x);
        const targetAngle = threat ? (fleeAngle * 0.6 + homeAngle * 0.4) : homeAngle;

        let diff = targetAngle - ship.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // Zigzag evasive deviation if chased
        let zigzagOffset = 0;
        if (ship.isChased) {
          if (!ship.zigzagTimer || ship.zigzagTimer <= 0) {
            ship.zigzagDirection = -(ship.zigzagDirection || 1);
            ship.zigzagTimer = 10 + Math.floor(Math.random() * 15);
          }
          ship.zigzagTimer -= 1;
          zigzagOffset = Math.sin(ship.zigzagTimer * 0.2) * 0.35 * (ship.zigzagDirection || 1);
        }

        ship.angle += (diff + zigzagOffset) * 0.08;

        // Flee speed: activate boost/dash immediately if threat is close
        const lastBoost = ship.lastBoostTime || 0;
        if (now - lastBoost >= 5000 && threatDist < 700) {
          triggerSpeedBoost(ship);
        }

        // Flee defense: drop a bomb backwards!
        const lastBomb = ship.lastBombTime || 0;
        if (threat && now - lastBomb >= 5000 && threatDist < 350 && Math.abs(Math.abs(threatDiff) - Math.PI) < 0.6) {
          fireLaser(ship, true); // Drops bomb
          ship.lastBombTime = now;
        }

        // Flee shield: activate if low HP and threat is close
        const lastSpecial = ship.lastSpecialTime || 0;
        if (ship.specialType === 'shield' && now - lastSpecial >= getSpecialCooldown(ship.specialType) && threatDist < 300) {
          triggerSpecialMove(ship);
        }

        const aiBoostActive = ship.boostActiveTimer !== undefined && ship.boostActiveTimer > 0;
        const aiSpeedMultiplier = aiBoostActive ? 3.0 : 1.0;
        const accelSpeed = ship.stats.speed * 0.7 * 0.08 * aiSpeedMultiplier;

        ship.vx += Math.cos(ship.angle) * accelSpeed;
        ship.vy += Math.sin(ship.angle) * accelSpeed;

        if (threat && threatDist < 500 && Math.random() < 0.04 && now - ship.lastShotTime >= ship.stats.rate * 2) {
          fireLaser(ship);
          ship.lastShotTime = now;
        }
      } else if (ship.aiState === 'support' && ship.targetId) {
        const enemy = state.ships.find(s => s.id === ship.targetId && s.hp > 0);
        
        if (enemy) {
          const dx = enemy.x - ship.x;
          const dy = enemy.y - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const targetAngle = Math.atan2(dy, dx);
          let diff = targetAngle - ship.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;

          ship.angle += diff * 0.08;

          const aiBoostActive = ship.boostActiveTimer !== undefined && ship.boostActiveTimer > 0;
          const aiSpeedMultiplier = aiBoostActive ? 3.0 : 1.0;
          const accelSpeed = ship.stats.speed * 0.65 * 0.08 * aiSpeedMultiplier;
          
          ship.vx += Math.cos(ship.angle) * accelSpeed;
          ship.vy += Math.sin(ship.angle) * accelSpeed;

          // Boost to intercept
          const lastBoost = ship.lastBoostTime || 0;
          if (now - lastBoost >= 5000 && dist > 550) {
            triggerSpeedBoost(ship);
          }

          // Special moves to save ally
          const lastBomb = ship.lastBombTime || 0;
          if (now - lastBomb >= 5000 && dist > 200 && dist < 450 && Math.abs(diff) < 0.4) {
            fireLaser(ship, true); // Bomb
            ship.lastBombTime = now;
          }

          const lastSpecial = ship.lastSpecialTime || 0;
          if (now - lastSpecial >= getSpecialCooldown(ship.specialType)) {
            if (ship.specialType === 'beam' && dist < 600 && Math.abs(diff) < 0.2) {
              triggerSpecialMove(ship);
            } else if (ship.specialType === 'shield' && dist < 200) {
              triggerSpecialMove(ship);
            }
          }

          if (dist < ship.stats.range && Math.abs(diff) < 0.45 && now - ship.lastShotTime >= ship.stats.rate * (1.1 + Math.random() * 0.5)) {
            fireLaser(ship);
            ship.lastShotTime = now;
          }
        } else {
          ship.aiState = 'patrol';
        }
      } else if (ship.aiState === 'formation' && ship.targetId) {
        const leader = state.ships.find(s => s.id === ship.targetId && s.hp > 0);
        if (leader) {
          const angleOffset = ship.formationAngleOffset || 0;
          const distOffset = ship.formationDistOffset || 120;
          const targetX = leader.x + Math.cos(leader.angle + angleOffset) * distOffset;
          const targetY = leader.y + Math.sin(leader.angle + angleOffset) * distOffset;

          const dx = targetX - ship.x;
          const dy = targetY - ship.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 70) {
            // Perfect formation sync
            ship.angle += (leader.angle - ship.angle) * 0.12;
            ship.vx = leader.vx * 0.95;
            ship.vy = leader.vy * 0.95;
            
            // Random coordinated laser fire if leader is fighting
            if (leader.aiState === 'chase' && Math.random() < 0.025 && now - ship.lastShotTime >= ship.stats.rate * 1.5) {
              fireLaser(ship);
              ship.lastShotTime = now;
            }
          } else {
            const targetAngle = Math.atan2(dy, dx);
            let diff = targetAngle - ship.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            ship.angle += diff * 0.08;

            const cruiseSpeed = ship.stats.speed * 0.75;
            const accelSpeed = cruiseSpeed * 0.08 * (dist > 300 ? 1.5 : 1.0);
            ship.vx += Math.cos(ship.angle) * accelSpeed;
            ship.vy += Math.sin(ship.angle) * accelSpeed;
          }
        } else {
          ship.aiState = 'patrol';
        }
      } else {
        // Patrol
        let targetX = WORLD_SIZE / 2;
        let targetY = WORLD_SIZE / 2;

        targetX = WORLD_SIZE / 2 + (ship.id.charCodeAt(0) % 8 - 4) * 350;
        targetY = WORLD_SIZE / 2 + (ship.id.charCodeAt(0) % 6 - 3) * 350;

        const dx = targetX - ship.x;
        const dy = targetY - ship.y;
        const targetAngle = Math.atan2(dy, dx);

        let diff = targetAngle - ship.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        ship.angle += diff * 0.05;

        const cruiseSpeed = ship.stats.speed * 0.45;
        ship.vx += Math.cos(ship.angle) * cruiseSpeed * 0.08;
        ship.vy += Math.sin(ship.angle) * cruiseSpeed * 0.08;
      }

      // Physics integration
      ship.vx *= 0.96;
      ship.vy *= 0.96;

      const aiBoostActive = ship.boostActiveTimer !== undefined && ship.boostActiveTimer > 0;
      const aiSpeedMultiplier = aiBoostActive ? 3.0 : 1.0;

      if (ship.boostActiveTimer && ship.boostActiveTimer > 0) {
        ship.boostActiveTimer -= 1;
        if (Math.random() < 0.4) {
          const trailAngle = ship.angle + Math.PI + (Math.random() - 0.5) * 0.5;
          state.particles.push({
            id: `p_trail_${Math.random()}`,
            x: ship.x - Math.cos(ship.angle) * 12,
            y: ship.y - Math.sin(ship.angle) * 12,
            vx: Math.cos(trailAngle) * 2 + ship.vx,
            vy: Math.sin(trailAngle) * 2 + ship.vy,
            life: 10 + Math.floor(Math.random() * 10),
            maxLife: 20,
            color: '#f59e0b',
            size: 2
          });
        }
      }

      if (ship.shieldActiveTimer && ship.shieldActiveTimer > 0) {
        ship.shieldActiveTimer -= 1;
        if (Math.random() < 0.25) {
          const angle = Math.random() * Math.PI * 2;
          const px = ship.x + Math.cos(angle) * 45;
          const py = ship.y + Math.sin(angle) * 45;
          state.particles.push({
            id: `p_shield_${Math.random()}`,
            x: px,
            y: py,
            vx: ship.vx + (Math.random() - 0.5) * 0.4,
            vy: ship.vy + (Math.random() - 0.5) * 0.4,
            life: 10 + Math.floor(Math.random() * 10),
            maxLife: 20,
            color: ship.faction === 'light' ? '#38bdf8' : '#ef4444',
            size: 1.5
          });
        }
      }

      const spd = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      const aiMaxSpeed = ship.stats.speed * 0.66 * aiSpeedMultiplier;
      if (spd > aiMaxSpeed) {
        ship.vx = (ship.vx / spd) * aiMaxSpeed;
        ship.vy = (ship.vy / spd) * aiMaxSpeed;
      }

      ship.x += ship.vx;
      ship.y += ship.vy;

      // Clamp AI inside map & check hyperspace warp recycling
      ship.x = Math.max(60, Math.min(WORLD_SIZE - 60, ship.x));
      
      const isAiNearEnemyHangar = ship.faction === 'light'
        ? ship.y > WORLD_SIZE - 100
        : ship.y < 100;

      if (isAiNearEnemyHangar) {
        ship.x = Math.random() * (WORLD_SIZE - 800) + 400;
        ship.y = ship.faction === 'light'
          ? 200 + Math.random() * 500
          : WORLD_SIZE - 700 + Math.random() * 500;
        ship.vx = 0;
        ship.vy = 0;
        ship.angle = ship.faction === 'light' ? Math.PI / 2 : -Math.PI / 2;
        ship.hp = ship.maxHp;
      } else {
        ship.y = Math.max(60, Math.min(WORLD_SIZE - 60, ship.y));
      }
    });

    // --- 4. Update Lasers ---
    state.lasers = state.lasers.filter(laser => {
      const speed = Math.sqrt(laser.vx * laser.vx + laser.vy * laser.vy);
      laser.x += laser.vx;
      laser.y += laser.vy;

      if (laser.isSuperBeam) {
        // Super Beam goes until map border. Dies only when touching borders.
        if (laser.x < 10 || laser.x > WORLD_SIZE - 10 || laser.y < 10 || laser.y > WORLD_SIZE - 10) {
          return false;
        }
      } else {
        laser.rangeRemaining -= speed;
        if (laser.rangeRemaining <= 0) {
          if (laser.isBomb) {
            detonateBomb(laser);
          }
          return false;
        }
      }

      // Laser collision check with ships
      let hit = false;
      for (const ship of state.ships) {
        if (ship.hp <= 0) continue; // Skip dead ships
        if (laser.ownerId === ship.id) continue; // Cannot hit itself
        if (ship.faction === laser.faction) continue; // friendly-fire safety (works for players and AI)

        const dx = ship.x - laser.x;
        const dy = ship.y - laser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const hasShield = ship.shieldActiveTimer !== undefined && ship.shieldActiveTimer > 0;
        const collisionRadius = hasShield ? 55 : 40; // hit radius (larger for shield bubble)

        if (dist < collisionRadius) {
          if (hasShield) {
            // Reflect/Bounce back!
            if (laser.ownerId !== ship.id) {
              laser.vx = -laser.vx;
              laser.vy = -laser.vy;
              laser.ownerId = ship.id;
              laser.faction = ship.faction;
              laser.color = ship.color || (ship.faction === 'light' ? '#38bdf8' : '#ef4444');
              
              if (!laser.isSuperBeam && !laser.isBomb) {
                laser.rangeRemaining = Math.max(laser.rangeRemaining, 400); 
              } else if (laser.isBomb) {
                laser.rangeRemaining = Math.max(laser.rangeRemaining, 500);
              }
              
              // Spawn reflections particles
              spawnExplosion(laser.x, laser.y, laser.color, 12, 'beam');
              
              if (ship.isPlayer) {
                if (ship.id === 'player2') {
                  screenShake2.current = { duration: 12, amplitude: 5 };
                } else {
                  screenShake.current = { duration: 12, amplitude: 5 };
                }
              }
            }
            continue; // Doesn't disappear, doesn't damage. Continue loop.
          }

          if (laser.isBomb) {
            detonateBomb(laser);
            hit = true;
            break;
          } else if (laser.isSuperBeam) {
            // Deal damage but don't stop the beam (no hit = true)
            ship.hp = Math.max(0, ship.hp - laser.damage);
            ship.lastHitTime = Date.now();
            
            // Spark particle splash
            spawnExplosion(laser.x, laser.y, laser.color, 15, 'beam');
            
            if (ship.isPlayer) {
              if (ship.id === 'player2') {
                screenShake2.current = { duration: 20, amplitude: 8 };
              } else {
                screenShake.current = { duration: 20, amplitude: 8 };
              }
            }

            // Check fainted ship
            if (ship.hp <= 0) {
              spawnExplosion(ship.x, ship.y, '#eab308', 35);
              spawnExplosion(ship.x, ship.y, '#f97316', 25);

              ship.deaths = (ship.deaths || 0) + 1;

              const killer = state.ships.find(s => s.id === laser.ownerId);
              if (killer) {
                killer.kills = (killer.kills || 0) + 1;
                if (killer.isPlayer) {
                  state.score += ship.stats.shield * 10;
                  const killerName = killer.id === 'player2' ? playerName2 : playerName;
                  const killerFaction = killer.id === 'player2' ? faction2 : faction;
                  onKillFeed?.(`💥 Pilot ${killerName} destroyed ${ship.name} with a Super Beam!`, killerFaction);
                }
              }

              if (ship.id === 'player') {
                setIsDead(true);
                const killerName = killer ? killer.name : 'Unknown Enemy';
                const killerFaction = killer ? killer.faction : (faction === 'light' ? 'dark' : 'light');
                onKillFeed?.(`💀 Pilot ${playerName} was fainted by ${killerName}!`, killerFaction);
              } else if (ship.id === 'player2') {
                setIsDead2(true);
                const killerName = killer ? killer.name : 'Unknown Enemy';
                const killerFaction = killer ? killer.faction : (faction2 === 'light' ? 'dark' : 'light');
                onKillFeed?.(`💀 Pilot ${playerName2} was fainted by ${killerName}!`, killerFaction);
              } else {
                const deadShip = ship;
                setTimeout(() => {
                  if (game.current.playerShip && !isMatchOver) {
                    deadShip.hp = deadShip.maxHp;
                    deadShip.x = Math.random() * (WORLD_SIZE - 800) + 400;
                    if (deadShip.faction === 'light') {
                      deadShip.y = 200 + Math.random() * 500;
                      deadShip.angle = Math.PI / 2;
                    } else {
                      deadShip.y = WORLD_SIZE - 700 + Math.random() * 500;
                      deadShip.angle = -Math.PI / 2;
                    }
                    deadShip.vx = 0;
                    deadShip.vy = 0;
                  }
                }, 5000);
              }
            }
          } else {
            // Normal laser hit logic
            ship.hp = Math.max(0, ship.hp - laser.damage);
            ship.lastHitTime = Date.now();
            hit = true;

            // Spark particle splash
            spawnExplosion(laser.x, laser.y, laser.color, 8, 'normal');

            if (ship.isPlayer) {
              if (ship.id === 'player2') {
                screenShake2.current = { duration: 15, amplitude: 6 };
              } else {
                screenShake.current = { duration: 15, amplitude: 6 };
              }
            }

            // Check fainted ship
            if (ship.hp <= 0) {
              spawnExplosion(ship.x, ship.y, '#eab308', 35);
              spawnExplosion(ship.x, ship.y, '#f97316', 25);

              ship.deaths = (ship.deaths || 0) + 1;

              const killer = state.ships.find(s => s.id === laser.ownerId);
              if (killer) {
                killer.kills = (killer.kills || 0) + 1;
                if (killer.isPlayer) {
                  state.score += ship.stats.shield * 10;
                  const killerName = killer.id === 'player2' ? playerName2 : playerName;
                  const killerFaction = killer.id === 'player2' ? faction2 : faction;
                  onKillFeed?.(`💥 Pilot ${killerName} destroyed ${ship.name}!`, killerFaction);
                }
              }

              if (ship.id === 'player') {
                setIsDead(true);
                const killerName = killer ? killer.name : 'Unknown Enemy';
                const killerFaction = killer ? killer.faction : (faction === 'light' ? 'dark' : 'light');
                onKillFeed?.(`💀 Pilot ${playerName} was fainted by ${killerName}!`, killerFaction);
              } else if (ship.id === 'player2') {
                setIsDead2(true);
                const killerName = killer ? killer.name : 'Unknown Enemy';
                const killerFaction = killer ? killer.faction : (faction2 === 'light' ? 'dark' : 'light');
                onKillFeed?.(`💀 Pilot ${playerName2} was fainted by ${killerName}!`, killerFaction);
              } else {
                const deadShip = ship;
                setTimeout(() => {
                  if (game.current.playerShip && !isMatchOver) {
                    deadShip.hp = deadShip.maxHp;
                    deadShip.x = Math.random() * (WORLD_SIZE - 800) + 400;
                    if (deadShip.faction === 'light') {
                      deadShip.y = 200 + Math.random() * 500;
                      deadShip.angle = Math.PI / 2;
                    } else {
                      deadShip.y = WORLD_SIZE - 700 + Math.random() * 500;
                      deadShip.angle = -Math.PI / 2;
                    }
                    deadShip.vx = 0;
                    deadShip.vy = 0;
                  }
                }, 5000);
              }
            }
            break; // Break the ships loop since the normal laser hit
          }
        }
      }

      if (hit) return false;

      // Laser collision check with asteroids
      for (const ast of state.asteroids) {
        if (ast.hp <= 0) continue;
        const dx = ast.x - laser.x;
        const dy = ast.y - laser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = ast.size * 14;
        if (dist < hitRadius) {
          if (laser.isBomb) {
            detonateBomb(laser);
            hit = true;
            break;
          } else if (laser.isSuperBeam) {
            // Damaging asteroid but don't destroy beam (no hit = true)
            ast.hp -= laser.damage;
            spawnExplosion(laser.x, laser.y, '#78350f', 5, 'asteroid');

            if (ast.hp <= 0) {
              spawnExplosion(ast.x, ast.y, '#9ca3af', 15, 'asteroid');
              
              if (ast.size > 1) {
                const newSize = ast.size - 1;
                state.asteroids.push(
                  {
                    id: `ast_${ast.id}_1_${Math.random()}`,
                    x: ast.x + (Math.random() - 0.5) * 20,
                    y: ast.y + (Math.random() - 0.5) * 20,
                    vx: ast.vx + (Math.random() - 0.5) * 1.2,
                    vy: ast.vy + (Math.random() - 0.5) * 1.2,
                    size: newSize,
                    hp: newSize * 15
                  },
                  {
                    id: `ast_${ast.id}_2_${Math.random()}`,
                    x: ast.x + (Math.random() - 0.5) * 20,
                    y: ast.y + (Math.random() - 0.5) * 20,
                    vx: ast.vx + (Math.random() - 0.5) * 1.2,
                    vy: ast.vy + (Math.random() - 0.5) * 1.2,
                    size: newSize,
                    hp: newSize * 15
                  }
                );
              }
              state.score += ast.size * 50;
            }
          } else {
            // Normal laser hits asteroid
            ast.hp -= laser.damage;
            hit = true;

            spawnExplosion(laser.x, laser.y, '#78350f', 5, 'asteroid');

            if (ast.hp <= 0) {
              spawnExplosion(ast.x, ast.y, '#9ca3af', 15, 'asteroid');
              
              if (ast.size > 1) {
                const newSize = ast.size - 1;
                state.asteroids.push(
                  {
                    id: `ast_${ast.id}_1_${Math.random()}`,
                    x: ast.x + (Math.random() - 0.5) * 20,
                    y: ast.y + (Math.random() - 0.5) * 20,
                    vx: ast.vx + (Math.random() - 0.5) * 1.2,
                    vy: ast.vy + (Math.random() - 0.5) * 1.2,
                    size: newSize,
                    hp: newSize * 15
                  },
                  {
                    id: `ast_${ast.id}_2_${Math.random()}`,
                    x: ast.x + (Math.random() - 0.5) * 20,
                    y: ast.y + (Math.random() - 0.5) * 20,
                    vx: ast.vx + (Math.random() - 0.5) * 1.2,
                    vy: ast.vy + (Math.random() - 0.5) * 1.2,
                    size: newSize,
                    hp: newSize * 15
                  }
                );
              }
              state.score += ast.size * 50;
            }
            break; // Break asteroid loop since normal laser hit
          }
        }
      }

      return !hit;
    });

    // --- 5. Update Asteroids ---
    state.asteroids.forEach(ast => {
      ast.x += ast.vx;
      ast.y += ast.vy;

      // Bounce off boundaries
      const buffer = ast.size * 15;
      if (ast.x < buffer || ast.x > WORLD_SIZE - buffer) ast.vx *= -1;
      if (ast.y < buffer || ast.y > WORLD_SIZE - buffer) ast.vy *= -1;

      // Ship collision with asteroids
      state.ships.forEach(ship => {
        if (ship.hp <= 0) return; // Skip dead ships
        const dx = ship.x - ast.x;
        const dy = ship.y - ast.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = ast.size * 12 + 32; // larger radius for scaled-up ship size

        if (dist < radius) {
          // Bounce ship
          const pushAngle = Math.atan2(dy, dx);
          ship.x += Math.cos(pushAngle) * 4;
          ship.y += Math.sin(pushAngle) * 4;
          ship.vx += Math.cos(pushAngle) * 1.2;
          ship.vy += Math.sin(pushAngle) * 1.2;

          ship.hp = Math.max(0, ship.hp - ast.size * 3);
          ship.lastHitTime = Date.now();
          
          if (ship.hp <= 0) {
            ship.deaths = (ship.deaths || 0) + 1;

            if (ship.id === 'player') {
              setIsDead(true);
              onKillFeed?.(`💀 Pilot ${playerName} crashed into an asteroid!`, 'system');
            } else if (ship.id === 'player2') {
              setIsDead2(true);
              onKillFeed?.(`💀 Pilot ${playerName2} crashed into an asteroid!`, 'system');
            } else {
              // Spawn explosion for AI
              spawnExplosion(ship.x, ship.y, '#eab308', 35);
              spawnExplosion(ship.x, ship.y, '#f97316', 25);
              
              // respawn timer for AI
              const deadShip = ship;
              setTimeout(() => {
                if (game.current.playerShip && !isMatchOver) {
                  deadShip.hp = deadShip.maxHp;
                  deadShip.x = Math.random() * (WORLD_SIZE - 800) + 400;
                  if (deadShip.faction === 'light') {
                    deadShip.y = 200 + Math.random() * 500;
                    deadShip.angle = Math.PI / 2;
                  } else {
                    deadShip.y = WORLD_SIZE - 700 + Math.random() * 500;
                    deadShip.angle = -Math.PI / 2;
                  }
                  deadShip.vx = 0;
                  deadShip.vy = 0;
                }
              }, 5000);
            }
          }

          if (ship.isPlayer) {
            if (ship.id === 'player2') {
              screenShake2.current = { duration: 10, amplitude: 4 };
            } else {
              screenShake.current = { duration: 10, amplitude: 4 };
            }
          }
        }
      });
    });

    state.asteroids = state.asteroids.filter(a => a.hp > 0);

    // --- 6. Update Particles ---
    state.particles = state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      return p.life > 0;
    });

    // --- 7. Sync HUD ---
    const now = Date.now();
    const bombElapsed = now - (player.lastBombTime || 0);
    const bombCooldownPercent = Math.min(100, Math.floor((bombElapsed / 5000) * 100));

    const boostElapsed = now - (player.lastBoostTime || 0);
    const boostCooldownPercent = Math.min(100, Math.floor((boostElapsed / 5000) * 100));

    const boostActive = player.boostActiveTimer !== undefined && player.boostActiveTimer > 0;
    const boostRemainingSec = boostActive ? ((player.boostActiveTimer || 0) / 60) : 0;

    const specialElapsed = now - (player.lastSpecialTime || 0);
    const specialCooldownLimit = getSpecialCooldown(player.specialType);
    const specialCooldownPercent = Math.min(100, Math.floor((specialElapsed / specialCooldownLimit) * 100));

    const specialActive = player.shieldActiveTimer !== undefined && player.shieldActiveTimer > 0;
    const specialRemainingSec = specialActive ? Math.ceil((player.shieldActiveTimer || 0) / 60) : 0;

    const { lightKills, darkKills } = getFactionScores();
    setHud({
      hp: player.hp,
      maxHp: player.maxHp,
      score: state.score,
      kills: player.kills || 0,
      deaths: player.deaths || 0,
      alliesCount: state.ships.filter(s => s.faction === faction && !s.isPlayer && s.hp > 0).length,
      enemiesCount: state.ships.filter(s => s.faction !== faction && s.hp > 0).length,
      speed: Math.round(Math.sqrt(player.vx * player.vx + player.vy * player.vy) * 10),
      lightKills,
      darkKills,
      bombCooldownPercent,
      boostCooldownPercent,
      boostActive,
      boostRemainingSec,
      boostType: player.boostType || 'dash',
      specialCooldownPercent,
      specialActive,
      specialRemainingSec,
      specialType: player.specialType || 'beam'
    });

    // Sync HUD 2 for co-op split-screen
    if (isTwoPlayers && player2) {
      const bombElapsed2 = now - (player2.lastBombTime || 0);
      const bombCooldownPercent2 = Math.min(100, Math.floor((bombElapsed2 / 5000) * 100));

      const boostElapsed2 = now - (player2.lastBoostTime || 0);
      const boostCooldownPercent2 = Math.min(100, Math.floor((boostElapsed2 / 5000) * 100));

      const boostActive2 = player2.boostActiveTimer !== undefined && player2.boostActiveTimer > 0;
      const boostRemainingSec2 = boostActive2 ? ((player2.boostActiveTimer || 0) / 60) : 0;

      const specialCooldownLimit2 = getSpecialCooldown(player2.specialType);
      const specialElapsed2 = now - (player2.lastSpecialTime || 0);
      const specialCooldownPercent2 = Math.min(100, Math.floor((specialElapsed2 / specialCooldownLimit2) * 100));

      const specialActive2 = player2.shieldActiveTimer !== undefined && player2.shieldActiveTimer > 0;
      const specialRemainingSec2 = specialActive2 ? Math.ceil((player2.shieldActiveTimer || 0) / 60) : 0;

      setHud2({
        hp: player2.hp,
        maxHp: player2.maxHp,
        score: state.score,
        kills: player2.kills || 0,
        deaths: player2.deaths || 0,
        alliesCount: state.ships.filter(s => s.faction === faction2 && !s.isPlayer && s.hp > 0).length,
        enemiesCount: state.ships.filter(s => s.faction !== faction2 && s.hp > 0).length,
        speed: Math.round(Math.sqrt(player2.vx * player2.vx + player2.vy * player2.vy) * 10),
        lightKills,
        darkKills,
        bombCooldownPercent: bombCooldownPercent2,
        boostCooldownPercent: boostCooldownPercent2,
        boostActive: boostActive2,
        boostRemainingSec: boostRemainingSec2,
        boostType: player2.boostType || 'dash',
        specialCooldownPercent: specialCooldownPercent2,
        specialActive: specialActive2,
        specialRemainingSec: specialRemainingSec2,
        specialType: player2.specialType || 'beam'
      });
    }
  };

  // Launch a laser shot
  const fireLaser = (ship: SpaceShip, isBomb = false) => {
    const state = game.current;
    
    if (isBomb) {
      const lx = ship.x + Math.cos(ship.angle) * 20;
      const ly = ship.y + Math.sin(ship.angle) * 20;
      const speed = LASER_SPEED * 0.35; // moves slowly
      const vx = Math.cos(ship.angle) * speed;
      const vy = Math.sin(ship.angle) * speed;

      state.lasers.push({
        id: `las_bomb_${Math.random()}`,
        ownerId: ship.id,
        faction: ship.faction,
        x: lx,
        y: ly,
        vx,
        vy,
        damage: 80, // 80 splash damage
        rangeRemaining: 380, // range limit in pixels
        color: '#c084fc', // purple bomb color
        isBomb: true
      });
      return;
    }

    // AI ships aim imperfectly (easy to dodge); the player always fires precisely.
    const aimAngle = ship.isPlayer ? ship.angle : ship.angle + (Math.random() - 0.5) * 0.26;

    // Millennium Falcon has dual turrets!
    if (ship.defId === 'falcon') {
      const offsetL = aimAngle - Math.PI / 2;
      const offsetR = aimAngle + Math.PI / 2;

      const lx1 = ship.x + Math.cos(aimAngle) * 12 + Math.cos(offsetL) * 10;
      const ly1 = ship.y + Math.sin(aimAngle) * 12 + Math.sin(offsetL) * 10;
      const lx2 = ship.x + Math.cos(aimAngle) * 12 + Math.cos(offsetR) * 10;
      const ly2 = ship.y + Math.sin(aimAngle) * 12 + Math.sin(offsetR) * 10;

      const vx = Math.cos(aimAngle) * LASER_SPEED;
      const vy = Math.sin(aimAngle) * LASER_SPEED;

      state.lasers.push(
        {
          id: `las_${Math.random()}`,
          ownerId: ship.id,
          faction: ship.faction,
          x: lx1,
          y: ly1,
          vx,
          vy,
          damage: ship.stats.power,
          rangeRemaining: ship.stats.range,
          color: ship.color
        },
        {
          id: `las_${Math.random()}`,
          ownerId: ship.id,
          faction: ship.faction,
          x: lx2,
          y: ly2,
          vx,
          vy,
          damage: ship.stats.power,
          rangeRemaining: ship.stats.range,
          color: ship.color
        }
      );
    } else {
      const lx = ship.x + Math.cos(aimAngle) * 20;
      const ly = ship.y + Math.sin(aimAngle) * 20;
      const vx = Math.cos(aimAngle) * LASER_SPEED;
      const vy = Math.sin(aimAngle) * LASER_SPEED;

      state.lasers.push({
        id: `las_${Math.random()}`,
        ownerId: ship.id,
        faction: ship.faction,
        x: lx,
        y: ly,
        vx,
        vy,
        damage: ship.stats.power,
        rangeRemaining: ship.stats.range,
        color: ship.color
      });
    }
  };

  // Draw a single minimap viewport
  const drawMinimap = (canvas: HTMLCanvasElement | null, player: SpaceShip | null, playerFaction: Faction) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear minimap
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!player) return;

    ctx.save();

    // If Light faction: rotate the minimap 180 degrees so their base (North) is at the bottom.
    if (playerFaction === 'light') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    const state = game.current;
    const scale = canvas.width / WORLD_SIZE;

    // Draw grid lines inside minimap
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    const divisions = 4;
    const step = canvas.width / divisions;
    for (let i = 1; i < divisions; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(canvas.width, i * step);
      ctx.stroke();
    }

    // Draw base zones
    // Light base (North: Y = 0 to 800)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.fillRect(0, 0, canvas.width, 800 * scale);
    // Dark base (South: Y = WORLD_SIZE - 800 to WORLD_SIZE)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
    ctx.fillRect(0, (WORLD_SIZE - 800) * scale, canvas.width, 800 * scale);

    // Draw Asteroids
    ctx.fillStyle = '#52525b';
    state.asteroids.forEach(ast => {
      const mx = ast.x * scale;
      const my = ast.y * scale;
      const r = Math.max(1, ast.size * 1.0);
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Ships
    state.ships.forEach(ship => {
      if (ship.hp <= 0) return;

      const mx = ship.x * scale;
      const my = ship.y * scale;

      if (ship.id === player.id) {
        // Current player: Blinking yellow/white dot
        const flash = Math.floor(Date.now() / 250) % 2 === 0;
        ctx.fillStyle = flash ? '#ffffff' : '#eab308';
        ctx.beginPath();
        ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Crosshair ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isTwoPlayers && game.current.playerShip && game.current.player2Ship && (ship.id === game.current.playerShip.id || ship.id === game.current.player2Ship.id)) {
        // Other player in co-op/split-screen: Flashing cyan dot
        const flash = Math.floor(Date.now() / 250) % 2 === 0;
        ctx.fillStyle = flash ? '#ffffff' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(mx, my, 3.0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // AI Ships: Light is Blue, Dark is Red
        ctx.fillStyle = ship.faction === 'light' ? '#38bdf8' : '#ef4444';
        ctx.beginPath();
        ctx.arc(mx, my, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw screen viewport bounds
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const viewW = isTwoPlayers ? mainCanvas.width / 2 : mainCanvas.width;
      const viewH = mainCanvas.height;

      // Centered on player.x, player.y
      const rx = (player.x - viewW / 2) * scale;
      const ry = (player.y - viewH / 2) * scale;
      const rw = viewW * scale;
      const rh = viewH * scale;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);
    }

    ctx.restore();
  };

  // Render Minimap wrappers
  const renderMinimap = () => {
    drawMinimap(minimapRef.current, game.current.playerShip, faction);
    if (isTwoPlayers && game.current.player2Ship) {
      drawMinimap(minimap2Ref.current, game.current.player2Ship, faction2!);
    }
  };

  // Draw a player's viewport onto a canvas region
  const drawViewport = (
    ctx: CanvasRenderingContext2D,
    player: SpaceShip,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number,
    playerFaction: Faction,
    shake: { duration: number; amplitude: number },
    warpTimer: number,
    flash: { duration: number; maxDuration: number; color: string }
  ) => {
    // Apply Screen Shake
    ctx.save();

    // Clear the FULL viewport to black in screen space first — the zoom-out scale
    // below shrinks all subsequent fills toward the center, so without this the
    // border ring would never get cleared and would accumulate stale garbage.
    ctx.fillStyle = '#000000';
    ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

    if (shake.duration > 0) {
      const dx = (Math.random() - 0.5) * shake.amplitude;
      const dy = (Math.random() - 0.5) * shake.amplitude;
      ctx.translate(dx, dy);
    }

    // Apply Zoom-out for a wider tactical view (scaled around the viewport center)
    const vcx = viewportX + viewportWidth / 2;
    const vcy = viewportY + viewportHeight / 2;
    ctx.translate(vcx, vcy);
    ctx.scale(VIEW_ZOOM, VIEW_ZOOM);
    ctx.translate(-vcx, -vcy);

    // Apply Camera Rotation based on Faction View
    // Light faction: rotated 180 degrees so that South (center) points UP.
    if (playerFaction === 'light') {
      ctx.translate(viewportX + viewportWidth / 2, viewportY + viewportHeight / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-(viewportX + viewportWidth / 2), -(viewportY + viewportHeight / 2));
    }

    const cameraX = player.x;
    const cameraY = player.y;

    const offsetX = viewportX + viewportWidth / 2 - cameraX;
    const offsetY = viewportY + viewportHeight / 2 - cameraY;

    // 1. Draw Space Void (Solid retro arcade black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

    // 2. Draw Nebula clouds
    nebulas.current.forEach(neb => {
      const sx = neb.x + offsetX;
      const sy = neb.y + offsetY;
      
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, neb.r);
      grad.addColorStop(0, neb.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, neb.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Parallax Starfield (Chunky flashing Galaga colors with twinkling animation)
    starsBackground.current.forEach((star, index) => {
      const sx = ((star.x - cameraX * star.speed) % viewportWidth + viewportWidth) % viewportWidth;
      const sy = ((star.y - cameraY * star.speed) % viewportHeight + viewportHeight) % viewportHeight;
      
      // Periodically twinkle: make ~15% of stars dim out or blink
      const twinklePhase = (Math.floor(Date.now() / 150) + index) % 7;
      if (twinklePhase === 0) {
        ctx.fillStyle = '#111827'; // very dim
      } else {
        ctx.fillStyle = star.color;
      }
      ctx.fillRect(Math.floor(viewportX + sx), Math.floor(viewportY + sy), star.size, star.size);
    });

    // 4. Draw North Base Area (Light Side Green glowing border)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.fillRect(offsetX, offsetY, WORLD_SIZE, 800);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + 800);
    ctx.lineTo(offsetX + WORLD_SIZE, offsetY + 800);
    ctx.stroke();

    // Hangar markers
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('=== LIGHT SIDE BASE AREA (NORTH) ===', offsetX + 80, offsetY + 120);
    ctx.fillText('SECURE REPLENISH ZONE', offsetX + 80, offsetY + 145);

    // 5. Draw South Base Area (Dark Side Red glowing border)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
    ctx.fillRect(offsetX, offsetY + WORLD_SIZE - 800, WORLD_SIZE, 800);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + WORLD_SIZE - 800);
    ctx.lineTo(offsetX + WORLD_SIZE, offsetY + WORLD_SIZE - 800);
    ctx.stroke();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.font = 'bold 16px Courier New';
    ctx.fillText('=== DARK SIDE BASTION AREA (SOUTH) ===', offsetX + 80, offsetY + WORLD_SIZE - 150);
    ctx.fillText('TACTICAL ASSAULT STATION', offsetX + 80, offsetY + WORLD_SIZE - 125);

    // 6. Draw Scrolling Tactical Radar Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSpacing = 160;
    const startX = Math.floor(-offsetX / gridSpacing) * gridSpacing;
    const endX = startX + viewportWidth + gridSpacing;
    const startY = Math.floor(-offsetY / gridSpacing) * gridSpacing;
    const endY = startY + viewportHeight + gridSpacing;

    for (let x = startX; x < endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x + offsetX, viewportY);
      ctx.lineTo(x + offsetX, viewportY + viewportHeight);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(viewportX, y + offsetY);
      ctx.lineTo(viewportX + viewportWidth, y + offsetY);
      ctx.stroke();
    }

    // 7. Draw World Boundary Fence
    ctx.strokeStyle = playerFaction === 'light' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 5;
    ctx.strokeRect(offsetX, offsetY, WORLD_SIZE, WORLD_SIZE);

    const state = game.current;

    // 8. Draw Asteroids (Chunky flat pixel-art rocks)
    state.asteroids.forEach(ast => {
      const sx = ast.x + offsetX;
      const sy = ast.y + offsetY;
      const r = ast.size * 12;

      ctx.fillStyle = '#27272a';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(sx - r * 0.35, sy - r * 0.15, r * 0.25, 0, Math.PI * 2);
      ctx.arc(sx + r * 0.4, sy + r * 0.3, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    });

    // 9. Draw Lasers (Chunky arcade strokes)
    state.lasers.forEach(laser => {
      const sx = laser.x + offsetX;
      const sy = laser.y + offsetY;

      if (laser.isSuperBeam) {
        // Thick outer glowing line with faction color
        ctx.save();
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 20;
        
        const beamLength = 180;
        const vLen = Math.sqrt(laser.vx * laser.vx + laser.vy * laser.vy);
        const lvx = vLen > 0 ? (laser.vx / vLen) * beamLength : 0;
        const lvy = vLen > 0 ? (laser.vy / vLen) * beamLength : 0;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - lvx, sy - lvy);
        ctx.stroke();
        ctx.restore();

        // White inner core
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - lvx, sy - lvy);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = laser.isBomb ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - (laser.vx / LASER_SPEED) * 20, sy - (laser.vy / LASER_SPEED) * 20);
        ctx.stroke();
      }
    });

    // 10. Draw Fleet Ships (Skipping dead ones)
    state.ships.forEach(ship => {
      if (ship.hp <= 0) return;
      const sx = ship.x + offsetX;
      const sy = ship.y + offsetY;

      drawPixelShip(
        ctx,
        sx,
        sy,
        ship.isPlayer ? 56 : 48, // spacecraft sizes scaled up further for better arcade visibility and rich detail
        ship.angle,
        ship.defId,
        ship.faction,
        ship.color,
        Math.abs(ship.vx) > 0.3 || Math.abs(ship.vy) > 0.3
      );

      // Draw active deflection shield bubble
      if (ship.shieldActiveTimer && ship.shieldActiveTimer > 0) {
        ctx.save();
        ctx.shadowColor = ship.faction === 'light' ? '#38bdf8' : '#ef4444';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = ship.faction === 'light' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 3.5;

        // Pulsate shield bubble slightly
        const pulse = 1.0 + Math.sin(ship.shieldActiveTimer * 0.15) * 0.04;
        const shieldRadius = 55 * pulse;

        ctx.beginPath();
        ctx.arc(sx, sy, shieldRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing gradient overlay
        const grad = ctx.createRadialGradient(sx, sy, shieldRadius * 0.6, sx, sy, shieldRadius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.7, ship.faction === 'light' ? 'rgba(56, 189, 248, 0.04)' : 'rgba(239, 68, 68, 0.04)');
        grad.addColorStop(1, ship.faction === 'light' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(239, 68, 68, 0.18)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw health indicators
      const hpPct = ship.hp / ship.maxHp;
      const barW = ship.isPlayer ? 36 : 28;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(sx - barW / 2, sy - (ship.isPlayer ? 32 : 28), barW, 4);

      ctx.fillStyle = ship.faction === 'light' ? '#10b981' : '#ef4444';
      ctx.fillRect(sx - barW / 2, sy - (ship.isPlayer ? 32 : 28), barW * hpPct, 3);
    });

    // 11. Draw Explosion Particles
    state.particles.forEach(p => {
      const sx = p.x + offsetX;
      const sy = p.y + offsetY;
      const lifePct = p.life / p.maxLife;

      if (p.isShockwave) {
        // Draw expansive circular shockwave
        const currentRadius = (1 - lifePct) * (p.maxRadius || 600);
        
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.5 * lifePct; // Thins out as it expands
        ctx.beginPath();
        ctx.arc(sx, sy, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Soft internal filling glow
        ctx.fillStyle = p.color.replace('0.45', (0.12 * lifePct).toString()).replace('0.65', (0.18 * lifePct).toString());
        ctx.beginPath();
        ctx.arc(sx, sy, currentRadius * 0.95, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.isFire) {
        // Draw fire/smoke expanding particle
        ctx.save();
        ctx.globalAlpha = lifePct * 0.85;
        
        // Dynamic color transition based on lifePct
        let fireColor = '#4b5563'; // gray smoke fallback
        if (lifePct > 0.75) {
          fireColor = '#ffffff'; // white-hot core
        } else if (lifePct > 0.5) {
          fireColor = '#fef08a'; // bright yellow
        } else if (lifePct > 0.3) {
          fireColor = '#f97316'; // orange flame
        } else if (lifePct > 0.15) {
          fireColor = '#ef4444'; // red-violet outer flame
        } else {
          fireColor = '#374151'; // dark smoke
        }
        
        ctx.fillStyle = fireColor;
        
        // Size grows and then shrinks
        const currentSize = p.size * (1.0 + Math.sin((1.0 - lifePct) * Math.PI) * 1.5);
        ctx.beginPath();
        ctx.arc(sx, sy, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.isLightning) {
        // Draw jagged electric bolt
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * lifePct;
        ctx.globalAlpha = lifePct;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        
        let cx = sx;
        let cy = sy;
        const segments = 3;
        for (let j = 0; j < segments; j++) {
          cx += (Math.random() - 0.5) * 16;
          cy += (Math.random() - 0.5) * 16;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
      } else {
        // Draw normal square pixel particle
        ctx.fillStyle = p.color;
        ctx.globalAlpha = lifePct;
        ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
      }
    });
    ctx.globalAlpha = 1.0;

    // 12. Draw offscreen indicators
    state.ships.forEach(ship => {
      if (ship.id === player.id || ship.hp <= 0) return;
      
      const dx = ship.x - player.x;
      const dy = ship.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > viewportWidth / 2 && dist < 2200) {
        const angle = Math.atan2(dy, dx);
        const margin = 32;
        const rx = viewportX + viewportWidth / 2 + Math.cos(angle) * (viewportWidth / 2 - margin);
        const ry = viewportY + viewportHeight / 2 + Math.sin(angle) * (viewportHeight / 2 - margin);

        ctx.fillStyle = ship.faction === 'light' ? '#10b981' : '#ef4444';
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -7);
        ctx.lineTo(-6, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore(); // Restore camera translation/rotation

    // 13. Draw Hyperspace Warp Lines (Viewport relative overlay)
    if (warpTimer > 0) {
      const pPct = warpTimer / 30; // 30 frames total
      ctx.save();
      ctx.strokeStyle = playerFaction === 'light' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 3;
      const numLines = 45;
      const centerX = viewportX + viewportWidth / 2;
      const centerY = viewportY + viewportHeight / 2;
      
      // Radiant starfield tunnel lines
      for (let i = 0; i < numLines; i++) {
        const angle = (i / numLines) * Math.PI * 2 + (pPct * Math.PI * 0.4);
        const lengthMultiplier = 1.0 - pPct;
        const innerR = 40 + lengthMultiplier * 140;
        const outerR = innerR + 120 + lengthMultiplier * 400;
        
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
        ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
        ctx.stroke();
      }
      
      // Draw concentric portal circles contracting/expanding
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (1.0 - pPct) * 160, 0, Math.PI * 2);
      ctx.stroke();
      
      // Center warp portal glow
      const portalRadius = (1.0 - pPct) * 140;
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, portalRadius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, playerFaction === 'light' ? 'rgba(56, 189, 248, 0.9)' : 'rgba(239, 68, 68, 0.9)');
      grad.addColorStop(0.7, playerFaction === 'light' ? 'rgba(14, 165, 233, 0.45)' : 'rgba(225, 29, 72, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, portalRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // 14. Draw Screen Flash Overlay
    if (flash.duration > 0) {
      const fPct = flash.duration / flash.maxDuration;
      ctx.save();
      ctx.fillStyle = flash.color;
      ctx.globalAlpha = fPct;
      ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
      ctx.restore();
    }
  };

  // Render Scene loop (handles split-screen)
  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const player = game.current.playerShip;
    const player2 = game.current.player2Ship;

    if (!player) return;

    if (isTwoPlayers && player2) {
      const w = canvas.width / 2;
      const h = canvas.height;

      // Draw Player 1 (Left Viewport)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.clip();
      drawViewport(
        ctx,
        player,
        0,
        0,
        w,
        h,
        faction,
        screenShake.current,
        playerWarpTimer.current,
        screenFlash.current
      );
      ctx.restore();

      // Draw Player 2 (Right Viewport)
      ctx.save();
      ctx.beginPath();
      ctx.rect(w, 0, w, h);
      ctx.clip();
      drawViewport(
        ctx,
        player2,
        w,
        0,
        w,
        h,
        faction2!,
        screenShake2.current,
        playerWarpTimer2.current,
        screenFlash2.current
      );
      ctx.restore();

      // Draw Split-Screen double line separator
      ctx.fillStyle = '#09090b';
      ctx.fillRect(w - 6, 0, 12, h);
      
      ctx.strokeStyle = '#eab308'; // retro arcade yellow separator line
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w - 2.5, 0);
      ctx.lineTo(w - 2.5, h);
      ctx.moveTo(w + 2.5, 0);
      ctx.lineTo(w + 2.5, h);
      ctx.stroke();
    } else {
      // Single player full viewport
      drawViewport(
        ctx,
        player,
        0,
        0,
        canvas.width,
        canvas.height,
        faction,
        screenShake.current,
        playerWarpTimer.current,
        screenFlash.current
      );
    }
  };

  const handleReturn = () => {
    onGameOver(hud.score, hud.kills);
  };

  const shieldPercent = (hud.hp / hud.maxHp) * 100;
  const shieldPercent2 = (hud2.hp / hud2.maxHp) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current ship selection list for respawn screen
  const respawnShips = faction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
  const selectedRespawnShipDef = [...LIGHT_SHIPS, ...DARK_SHIPS].find(s => s.id === respawnShipId);

  const respawnShips2 = faction2 === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
  const selectedRespawnShipDef2 = [...LIGHT_SHIPS, ...DARK_SHIPS].find(s => s.id === respawnShipId2);

  // Leaderboard ranking list
  const rankings = getLeaderboard();
  const topPilot = rankings[0];

  // Determine faction winner: side with most kills AND best K/D ratio wins
  const factionScores = getFactionScores();
  const lightRatio = factionScores.lightDeaths === 0 ? factionScores.lightKills * 999 : factionScores.lightKills / factionScores.lightDeaths;
  const darkRatio = factionScores.darkDeaths === 0 ? factionScores.darkKills * 999 : factionScores.darkKills / factionScores.darkDeaths;

  let factionWinnerMsg = 'CONTESTED STANDOFF';
  let factionWinnerColor = 'text-yellow-400';
  
  if (factionScores.lightKills > factionScores.darkKills && lightRatio > darkRatio) {
    factionWinnerMsg = 'LIGHT SIDE WINS (KILLS & RATIO)';
    factionWinnerColor = 'text-sky-400';
  } else if (factionScores.darkKills > factionScores.lightKills && darkRatio > lightRatio) {
    factionWinnerMsg = 'DARK SIDE WINS (KILLS & RATIO)';
    factionWinnerColor = 'text-rose-500';
  }

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#020205] flex flex-col select-none pixel-font crt-effect">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .crt-effect::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%);
          background-size: 100% 3px;
          z-index: 20;
          pointer-events: none;
          opacity: 0.45;
        }
        .crt-glow {
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.35), 0 0 10px currentColor;
        }
        .pixel-font {
          font-family: 'Press Start 2P', monospace;
          font-size: 9px;
          line-height: 1.6;
        }
        .pixel-font button, .pixel-font kbd, .pixel-font span, .pixel-font div, .pixel-font table {
          font-family: 'Press Start 2P', monospace;
        }
        ::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Global HUD elements (Match Timer, Gamepadbadge, and Pause button indicator) */}
      <div className="absolute top-4 left-0 right-0 z-30 flex flex-col items-center pointer-events-none gap-2">
        {/* Match Timer (Centered) */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-6 py-2 shadow-2xl backdrop-blur-md flex flex-col items-center">
          <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase">MATCH TIME</span>
          <span className={`text-sm font-extrabold crt-glow ${matchTimeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            {formatTime(matchTimeLeft)}
          </span>
        </div>

        {/* Global Faction Score Indicator */}
        <div className="flex gap-4 items-center bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md text-[9px] font-bold">
          {gamepadConnected && (
            <span className="text-sky-400 animate-pulse flex items-center gap-1 mr-1 text-[8px] tracking-wider uppercase">
              <Gamepad2 className="w-3.5 h-3.5" /> GP-ACTIVE
            </span>
          )}
          <span className="text-sky-400 flex items-center gap-1">
            REBELS: <span className="text-white crt-glow">{hud.lightKills}</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-rose-500 flex items-center gap-1">
            EMPIRE: <span className="text-white crt-glow">{hud.darkKills}</span>
          </span>
        </div>
      </div>

      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="w-full h-full cursor-crosshair block bg-black"
      />

      {/* --- HUD RENDER SYSTEM --- */}
      {!isTwoPlayers ? (
        // --- ORIGINAL 1 PLAYER HUD LAYOUT ---
        <>
          {/* Header Stats */}
          <div className="absolute top-4 left-6 z-30 flex flex-col gap-1 bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md pointer-events-none">
            <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">{playerName} (YOU)</span>
            <div className="flex gap-4">
              <span className="text-[9px] text-zinc-400">SCORE: <span className="text-white font-bold crt-glow">{hud.score}</span></span>
              <span className="text-[9px] text-zinc-400">KILLS: <span className="text-sky-400 font-bold crt-glow">{hud.kills}</span></span>
              <span className="text-[9px] text-zinc-400">DEATHS: <span className="text-rose-400 font-bold crt-glow">{hud.deaths}</span></span>
            </div>
          </div>

          {/* Tactical Minimap */}
          <div className="absolute bottom-[80px] left-6 z-30 bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2 w-[160px] pointer-events-none">
            <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase border-b border-zinc-900 pb-1.5 mb-0.5 text-center">
              TACTICAL MAP
            </span>
            <canvas
              ref={minimapRef}
              width={136}
              height={136}
              className="bg-[#020205] border border-zinc-900 rounded-md block"
            />
          </div>

          {/* Live Leaderboard */}
          <div className="absolute top-[80px] right-6 z-30 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-2 w-[240px] pointer-events-none">
            <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase border-b border-zinc-900 pb-1.5 mb-1 text-center">
              LEADERBOARD (TOP 5)
            </span>
            {rankings.slice(0, 5).map((ship, index) => {
              const rank = index + 1;
              const isPlayerRow = ship.isPlayer;
              return (
                <div key={ship.id} className={`flex justify-between items-center text-[7.5px] font-mono leading-none ${isPlayerRow ? 'text-sky-400 font-bold' : 'text-zinc-400'}`}>
                  <span className="truncate max-w-[155px]">
                    {rank}. {ship.name.split(' (')[0]}
                  </span>
                  <span>
                    {ship.kills || 0}K/{ship.deaths || 0}D
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer Overlays */}
          <div className="absolute bottom-6 left-0 right-0 z-30 px-6 flex justify-between items-center pointer-events-none">
            {/* Speed */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md text-[10px] text-zinc-400 font-bold">
              SPEED: <span className="text-white crt-glow">{hud.speed} km/s</span>
            </div>

            {/* Specials */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md flex gap-5 text-[8px] text-zinc-400 font-bold pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="text-purple-400">BOMB (E/L2)</span>
                <div className="w-16 h-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                  <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${hud.bombCooldownPercent}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 uppercase leading-none">{hud.boostType === 'dash' ? 'DASH (R/R1)' : 'BOOST (R/R1)'}</span>
                <div className="w-16 h-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                  <div className={`h-full transition-all duration-100 ${hud.boostActive ? 'bg-amber-300 animate-pulse' : 'bg-amber-500'}`} style={{ width: `${hud.boostCooldownPercent}%` }} />
                </div>
                {hud.boostActive && <span className="text-[7px] text-amber-300 animate-pulse font-extrabold">{Math.ceil(hud.boostRemainingSec)}s</span>}
              </div>
              <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                <span className={hud.specialType === 'beam' ? 'text-cyan-400' : 'text-blue-400 uppercase leading-none'}>{hud.specialType === 'beam' ? 'SUPER BEAM (W/R2)' : 'SHIELD (W/R2)'}</span>
                <div className="w-16 h-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                  <div className={`h-full transition-all duration-100 ${hud.specialActive ? 'bg-cyan-300 animate-pulse' : (hud.specialType === 'beam' ? 'bg-cyan-500' : 'bg-blue-500')}`} style={{ width: `${hud.specialCooldownPercent}%` }} />
                </div>
                {hud.specialActive && <span className="text-[7px] text-blue-300 animate-pulse font-extrabold">{hud.specialRemainingSec}s</span>}
              </div>
            </div>

            {/* Shields */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-md w-[280px]">
              <span className={`text-[10px] font-bold ${faction === 'light' ? 'text-sky-400' : 'text-rose-500'}`}>SHIELDS:</span>
              <div className="flex-1 h-2.5 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                <div className={`h-full transition-all duration-300 ${faction === 'light' ? 'bg-sky-500' : 'bg-rose-600'}`} style={{ width: `${shieldPercent}%` }} />
              </div>
              <span className="text-[10px] font-bold text-white font-mono">{hud.hp}</span>
            </div>
          </div>
        </>
      ) : (
        // --- 2 PLAYERS SPLIT-SCREEN HUD LAYOUT ---
        <>
          {/* PLAYER 1 HUD PANEL (LEFT HALF) */}
          <div className="absolute top-0 left-0 w-1/2 h-full z-30 pointer-events-none p-6 flex flex-col justify-between">
            {/* Header (Top-Left of screen) */}
            <div className="flex flex-col gap-1 bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md self-start">
              <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">{playerName} (J1)</span>
              <div className="flex gap-4">
                <span className="text-[8px] text-zinc-400">SCORE: <span className="text-white font-bold">{hud.score}</span></span>
                <span className="text-[8px] text-zinc-400">KILLS: <span className="text-sky-400 font-bold">{hud.kills}</span></span>
                <span className="text-[8px] text-zinc-400">DEATHS: <span className="text-rose-400 font-bold">{hud.deaths}</span></span>
              </div>
            </div>

            {/* Bottom Section (Minimap & Footer) */}
            <div className="flex flex-col gap-4 self-stretch">
              {/* Tactical Minimap */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-1.5 w-[140px]">
                <span className="text-[7px] text-zinc-500 font-bold tracking-widest uppercase border-b border-zinc-900 pb-1 mb-0.5 text-center">
                  MAP P1
                </span>
                <canvas
                  ref={minimapRef}
                  width={120}
                  height={120}
                  className="bg-[#020205] border border-zinc-900 rounded-md block"
                />
              </div>

              {/* Bottom stats layout */}
              <div className="flex flex-col gap-2.5 bg-zinc-950/95 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md self-stretch pointer-events-auto">
                {/* Shield Bar */}
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold ${faction === 'light' ? 'text-sky-400' : 'text-rose-500'}`}>SHIELD:</span>
                  <div className="flex-1 h-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                    <div className={`h-full transition-all duration-300 ${faction === 'light' ? 'bg-sky-500' : 'bg-rose-600'}`} style={{ width: `${shieldPercent}%` }} />
                  </div>
                  <span className="text-[8px] font-bold text-white font-mono">{hud.hp}</span>
                </div>

                {/* Speed & Specials Row */}
                <div className="flex justify-between items-center gap-2 border-t border-zinc-900 pt-2.5">
                  <span className="text-[8px] text-zinc-400 font-bold">SPEED: <span className="text-white">{hud.speed} km/s</span></span>
                  <div className="flex gap-3 text-[7.5px] text-zinc-400 font-bold">
                    <div className="flex items-center gap-1">
                      <span className="text-purple-400 text-[6.5px]">BOMB</span>
                      <div className="w-8 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                        <div className="h-full bg-purple-500" style={{ width: `${hud.bombCooldownPercent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-[6.5px]">{hud.boostType === 'dash' ? 'DASH' : 'BOOST'}</span>
                      <div className="w-8 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                        <div className={`h-full ${hud.boostActive ? 'bg-amber-300 animate-pulse' : 'bg-amber-500'}`} style={{ width: `${hud.boostCooldownPercent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 border-l border-zinc-900 pl-2">
                      <span className={`${hud.specialType === 'beam' ? 'text-cyan-400' : 'text-blue-400'} text-[6.5px]`}>{hud.specialType === 'beam' ? 'BEAM' : 'SHLD'}</span>
                      <div className="w-8 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                        <div className={`h-full ${hud.specialActive ? 'bg-cyan-300 animate-pulse' : (hud.specialType === 'beam' ? 'bg-cyan-500' : 'bg-blue-500')}`} style={{ width: `${hud.specialCooldownPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PLAYER 2 HUD PANEL (RIGHT HALF) */}
          <div className="absolute top-0 right-0 w-1/2 h-full z-30 pointer-events-none p-6 flex flex-col justify-between items-end">
            {/* Header (Top-Right of screen) */}
            <div className="flex flex-col gap-1 bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md self-end items-end">
              <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">{playerName2} (J2)</span>
              <div className="flex gap-4">
                <span className="text-[8px] text-zinc-400">SCORE: <span className="text-white font-bold">{hud2.score}</span></span>
                <span className="text-[8px] text-zinc-400">KILLS: <span className="text-sky-400 font-bold">{hud2.kills}</span></span>
                <span className="text-[8px] text-zinc-400">DEATHS: <span className="text-rose-400 font-bold">{hud2.deaths}</span></span>
              </div>
            </div>

            {/* Bottom Section (Minimap & Footer) */}
            <div className="flex flex-col gap-4 self-stretch items-end">
              {/* Tactical Minimap */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-1.5 w-[140px]">
                <span className="text-[7px] text-zinc-500 font-bold tracking-widest uppercase border-b border-zinc-900 pb-1 mb-0.5 text-center">
                  MAP P2
                </span>
                <canvas
                  ref={minimap2Ref}
                  width={120}
                  height={120}
                  className="bg-[#020205] border border-zinc-900 rounded-md block"
                />
              </div>

              {/* Bottom stats layout */}
              <div className="flex flex-col gap-2.5 bg-zinc-950/95 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md self-stretch pointer-events-auto">
                {/* Shield Bar */}
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold ${faction2 === 'light' ? 'text-sky-400' : 'text-rose-500'}`}>SHIELD:</span>
                  <div className="flex-1 h-2 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
                    <div className={`h-full transition-all duration-300 ${faction2 === 'light' ? 'bg-sky-500' : 'bg-rose-600'}`} style={{ width: `${shieldPercent2}%` }} />
                  </div>
                  <span className="text-[8px] font-bold text-white font-mono">{hud2.hp}</span>
                </div>

                {/* Speed & Specials Row */}
                <div className="flex justify-between items-center gap-2 border-t border-zinc-900 pt-2.5">
                  <span className="text-[8px] text-zinc-400 font-bold">SPEED: <span className="text-white">{hud2.speed} km/s</span></span>
                  <div className="flex gap-3 text-[7.5px] text-zinc-400 font-bold">
                    <div className="flex items-center gap-1">
                      <span className="text-purple-400 text-[6.5px]">BOMB</span>
                      <div className="w-8 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                        <div className="h-full bg-purple-500" style={{ width: `${hud2.bombCooldownPercent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400 text-[6.5px]">{hud2.boostType === 'dash' ? 'DASH' : 'BOOST'}</span>
                      <div className="w-8 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                        <div className={`h-full ${hud2.boostActive ? 'bg-amber-300 animate-pulse' : 'bg-amber-500'}`} style={{ width: `${hud2.boostCooldownPercent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 border-l border-zinc-900 pl-2">
                      <span className={`${hud2.specialType === 'beam' ? 'text-cyan-400' : 'text-blue-400'} text-[6.5px]`}>{hud2.specialType === 'beam' ? 'BEAM' : 'SHLD'}</span>
                      <div className="w-8 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                        <div className={`h-full ${hud2.specialActive ? 'bg-cyan-300 animate-pulse' : (hud2.specialType === 'beam' ? 'bg-cyan-500' : 'bg-blue-500')}`} style={{ width: `${hud2.specialCooldownPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Control Help bar (Centered bottom) */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 text-[6.5px] text-zinc-500 font-bold uppercase tracking-wider pointer-events-none text-center whitespace-nowrap">
        {!isTwoPlayers ? (
          <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">ESC</kbd> to Pause | Move: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">ZQSD</kbd> | Fire: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">LEFT CLICK / A</kbd> | Bomb: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">E</kbd> | Boost: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">R</kbd> | Special: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">W</kbd></span>
        ) : (
          <span>P1 (ZQSD, A-Shoot, E-Bomb, R-Boost, W-Special) | P2 (Arrows, Space-Shoot, Comma-Bomb, Period-Boost, Slash-Special)</span>
        )}
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="border-4 border-double border-zinc-700 bg-zinc-950 p-8 rounded-2xl max-w-[400px] w-full flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-2xl font-extrabold uppercase tracking-[0.2em] text-yellow-400 crt-glow animate-pulse">
                SYSTEM PAUSED
              </h2>
              <p className="text-[10px] text-zinc-500 tracking-widest">
                --- MISSION STATUS: ON HOLD ---
              </p>
            </div>

            <div className="flex flex-col gap-3.5 w-full">
              <button
                onClick={() => setIsPaused(false)}
                onMouseEnter={() => setPauseSelect('resume')}
                className={`w-full py-3 px-4 border text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-between rounded-xl pointer-events-auto cursor-pointer ${
                  pauseSelect === 'resume'
                    ? 'border-sky-500 bg-sky-950/20 text-sky-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{pauseSelect === 'resume' ? '► RESUME MISSION' : '  RESUME MISSION'}</span>
                <span className="text-[9px] text-zinc-600">ESC / ENTER</span>
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  onExit();
                }}
                onMouseEnter={() => setPauseSelect('quit')}
                className={`w-full py-3 px-4 border text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-between rounded-xl pointer-events-auto cursor-pointer ${
                  pauseSelect === 'quit'
                    ? 'border-rose-500 bg-rose-950/20 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{pauseSelect === 'quit' ? '► ABORT TO HANGAR' : '  ABORT TO HANGAR'}</span>
                <span className="text-[9px] text-zinc-600">ENTER</span>
              </button>
            </div>

            <div className="text-[9px] text-zinc-600 uppercase tracking-wider text-center mt-2 border-t border-zinc-900 pt-4 w-full">
              USE <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850">↓</kbd> OR MOUSE TO SELECT
            </div>
          </div>
        </div>
      )}

      {/* Player 1 Respawn Menu Overlay (Left Side when splitscreen) */}
      {isDead && !isMatchOver && (
        <div className={`absolute top-0 left-0 ${isTwoPlayers ? 'w-1/2 border-r-4 border-double border-zinc-800' : 'w-full'} h-full z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 gap-4 animate-in fade-in duration-300 pointer-events-auto`}>
          <div className="w-10 h-10 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-pulse">
            <Skull className="w-5 h-5" />
          </div>

          <div className="text-center flex flex-col gap-1 items-center">
            <h2 className={`font-extrabold uppercase tracking-wider text-white crt-glow ${isTwoPlayers ? 'text-xs' : 'text-lg'}`}>
              {playerName} ELIMINATED
            </h2>
            <p className="text-[7.5px] text-zinc-500 uppercase tracking-widest">
              Choose P1 starfighter from base hangar
            </p>
          </div>

          {/* Grid */}
          <div className={`grid grid-cols-2 ${isTwoPlayers ? 'gap-2 max-w-[320px]' : 'md:grid-cols-4 gap-3 max-w-[660px]'} w-full p-2 border border-zinc-800 bg-zinc-950/80 rounded-2xl shadow-inner`}>
            {respawnShips.map((ship) => {
              const active = ship.id === respawnShipId;
              const activeBorderCol = faction === 'light' ? 'border-sky-500 bg-sky-950/20' : 'border-rose-500 bg-rose-950/20';
              return (
                <div
                  key={ship.id}
                  onClick={() => setRespawnShipId(ship.id)}
                  className={`p-2 rounded-xl border text-center cursor-pointer transition-all flex flex-col gap-1 ${
                    active ? activeBorderCol : `border-zinc-900 bg-zinc-900/10 hover:border-zinc-800`
                  }`}
                >
                  <span className="font-bold text-[8px] text-white uppercase tracking-wider block truncate">{ship.name.split(' ').pop() || ship.name}</span>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500" style={{ width: `${(ship.stats.speed / 8) * 100}%` }} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono">
                    SPD:{ship.stats.speed} HP:{ship.stats.shield}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedRespawnShipDef && (
            <div className={`flex flex-col gap-2.5 ${isTwoPlayers ? 'max-w-[320px]' : 'max-w-[660px]'} w-full border border-zinc-800/80 bg-zinc-950/70 p-3 rounded-xl shadow-inner font-mono text-[8px] text-zinc-400`}>
              <div className="text-center font-sans italic text-zinc-300 text-[9px] leading-relaxed truncate">
                "{selectedRespawnShipDef.description}"
              </div>
              <div className="grid grid-cols-5 gap-1 border-t border-zinc-900 pt-2 text-center text-[7.5px]">
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">SPD</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef.stats.speed}</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">PWR</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef.stats.power}</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">RAT</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef.stats.rate}ms</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">RNG</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef.stats.range}px</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">HP</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef.stats.shield}</span>
                </div>
              </div>
              <div className="border-t border-zinc-900 pt-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[7px]">
                  <span className="text-zinc-500 uppercase">Special (W):</span>
                  {getSpecialTypeForShip(selectedRespawnShipDef.id) === 'beam' ? (
                    <span className="text-cyan-400">⚡ Super Beam</span>
                  ) : (
                    <span className="text-blue-400">🛡️ Shield Reflect</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spawn lock and launch */}
          <div className="flex flex-col items-center gap-1.5 mt-1">
            <span className="text-[8px] font-bold text-yellow-500">
              {respawnTimeLeft > 0 ? `LOCKED: ${respawnTimeLeft}s` : 'READY'}
            </span>
            <button
              onClick={respawnPlayer}
              disabled={respawnTimeLeft > 0}
              className={`py-2.5 px-8 text-[8px] font-bold text-white rounded-lg transition-all uppercase cursor-pointer ${
                respawnTimeLeft > 0
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : faction === 'light'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-600 hover:from-sky-500 hover:to-sky-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
            >
              {respawnTimeLeft > 0 ? `WAIT (${respawnTimeLeft}s)` : 'LAUNCH (E)'}
            </button>
          </div>
        </div>
      )}

      {/* Player 2 Respawn Menu Overlay (Right Side when splitscreen) */}
      {isTwoPlayers && isDead2 && !isMatchOver && (
        <div className="absolute top-0 right-0 w-1/2 h-full z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 gap-4 animate-in fade-in duration-300 pointer-events-auto border-l-4 border-double border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-pulse">
            <Skull className="w-5 h-5" />
          </div>

          <div className="text-center flex flex-col gap-1 items-center">
            <h2 className="font-extrabold uppercase tracking-wider text-white crt-glow text-xs">
              {playerName2} ELIMINATED
            </h2>
            <p className="text-[7.5px] text-zinc-500 uppercase tracking-widest">
              Choose P2 starfighter from base hangar
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-2 max-w-[320px] w-full p-2 border border-zinc-800 bg-zinc-950/80 rounded-2xl shadow-inner">
            {respawnShips2.map((ship) => {
              const active = ship.id === respawnShipId2;
              const activeBorderCol = faction2 === 'light' ? 'border-sky-500 bg-sky-950/20' : 'border-rose-500 bg-rose-950/20';
              return (
                <div
                  key={ship.id}
                  onClick={() => setRespawnShipId2(ship.id)}
                  className={`p-2 rounded-xl border text-center cursor-pointer transition-all flex flex-col gap-1 ${
                    active ? activeBorderCol : `border-zinc-900 bg-zinc-900/10 hover:border-zinc-800`
                  }`}
                >
                  <span className="font-bold text-[8px] text-white uppercase tracking-wider block truncate">{ship.name.split(' ').pop() || ship.name}</span>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500" style={{ width: `${(ship.stats.speed / 8) * 100}%` }} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono">
                    SPD:{ship.stats.speed} HP:{ship.stats.shield}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedRespawnShipDef2 && (
            <div className="flex flex-col gap-2.5 max-w-[320px] w-full border border-zinc-800/80 bg-zinc-950/70 p-3 rounded-xl shadow-inner font-mono text-[8px] text-zinc-400">
              <div className="text-center font-sans italic text-zinc-300 text-[9px] leading-relaxed truncate">
                "{selectedRespawnShipDef2.description}"
              </div>
              <div className="grid grid-cols-5 gap-1 border-t border-zinc-900 pt-2 text-center text-[7.5px]">
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">SPD</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef2.stats.speed}</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">PWR</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef2.stats.power}</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">RAT</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef2.stats.rate}ms</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">RNG</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef2.stats.range}px</span>
                </div>
                <div className="flex flex-col bg-zinc-900/40 p-1 rounded border border-zinc-850">
                  <span className="text-[6.5px] text-zinc-500">HP</span>
                  <span className="font-bold text-white">{selectedRespawnShipDef2.stats.shield}</span>
                </div>
              </div>
              <div className="border-t border-zinc-900 pt-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[7px]">
                  <span className="text-zinc-500 uppercase">Special (Slash):</span>
                  {getSpecialTypeForShip(selectedRespawnShipDef2.id) === 'beam' ? (
                    <span className="text-cyan-400">⚡ Super Beam</span>
                  ) : (
                    <span className="text-blue-400">🛡️ Shield Reflect</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spawn lock and launch */}
          <div className="flex flex-col items-center gap-1.5 mt-1">
            <span className="text-[8px] font-bold text-yellow-500">
              {respawnTimeLeft2 > 0 ? `LOCKED: ${respawnTimeLeft2}s` : 'READY'}
            </span>
            <button
              onClick={respawnPlayer2}
              disabled={respawnTimeLeft2 > 0}
              className={`py-2.5 px-8 text-[8px] font-bold text-white rounded-lg transition-all uppercase cursor-pointer ${
                respawnTimeLeft2 > 0
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : faction2 === 'light'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-600 hover:from-sky-500 hover:to-sky-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
            >
              {respawnTimeLeft2 > 0 ? `WAIT (${respawnTimeLeft2}s)` : 'LAUNCH (SPACE)'}
            </button>
          </div>
        </div>
      )}

      {/* Match Over / Final Leaderboard Screen */}
      {isMatchOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 gap-6 animate-in fade-in duration-300 pointer-events-auto">
          <div className="border-4 border-double border-zinc-700 bg-zinc-950 p-6 md:p-8 rounded-3xl max-w-[680px] w-full flex flex-col items-center gap-6 shadow-[0_0_60px_rgba(0,0,0,0.95)]">
            
            <div className="text-center flex flex-col gap-1.5">
              <h2 className="text-2xl font-extrabold uppercase tracking-[0.2em] text-yellow-400 crt-glow animate-pulse">
                MATCH TIME ELAPSED
              </h2>
              <h3 className={`text-sm font-extrabold uppercase tracking-wider ${factionWinnerColor}`}>
                {factionWinnerMsg}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">
                Final standing - rebels: {factionScores.lightKills} Kills | Empire: {factionScores.darkKills} Kills
              </p>
              <p className="text-[8px] text-zinc-650 font-mono uppercase tracking-widest mt-0.5">
                Rebels Ratio: {(factionScores.lightDeaths === 0 ? factionScores.lightKills : (factionScores.lightKills / factionScores.lightDeaths)).toFixed(2)} | Empire Ratio: {(factionScores.darkDeaths === 0 ? factionScores.darkKills : (factionScores.darkKills / factionScores.darkDeaths)).toFixed(2)}
              </p>
            </div>

            {/* Scoreboard Table */}
            <div className="w-full border border-zinc-850 bg-zinc-950/50 rounded-xl overflow-hidden shadow-inner max-h-[250px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-850 font-bold uppercase text-[8px] tracking-wider">
                    <th className="py-2.5 px-4">RANK</th>
                    <th className="py-2.5 px-4">PILOT IDENTIFICATION</th>
                    <th className="py-2.5 px-4">SIDE</th>
                    <th className="py-2.5 px-4 text-center">KILLS</th>
                    <th className="py-2.5 px-4 text-center">DEATHS</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.slice(0, 10).map((ship, index) => {
                    const isPlayerRow = ship.isPlayer;
                    const rank = index + 1;
                    
                    return (
                      <tr
                        key={ship.id}
                        className={`border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 ${
                          isPlayerRow ? 'bg-zinc-800/40 font-bold text-white shadow-inner' : 'text-zinc-400'
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          {rank === 1 ? (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <Award className="w-3.5 h-3.5" /> 1ST
                            </span>
                          ) : (
                            `#${rank}`
                          )}
                        </td>
                        <td className="py-2.5 px-4 flex items-center gap-1.5">
                          {isPlayerRow && <User className="w-3 h-3 text-sky-400" />}
                          <span className={isPlayerRow ? 'text-sky-300' : 'text-zinc-300'}>{ship.name}</span>
                        </td>
                        <td className="py-2.5 px-4 uppercase text-[8px] font-bold">
                          <span className={ship.faction === 'light' ? 'text-sky-400' : 'text-rose-500'}>
                            {ship.faction === 'light' ? 'rebels' : 'empire'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-zinc-100 font-bold">{ship.kills || 0}</td>
                        <td className="py-2.5 px-4 text-center text-zinc-500">{ship.deaths || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Top Pilot Ace Badge */}
            {topPilot && (
              <div className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-yellow-500/20 bg-yellow-950/10 rounded-xl text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                TOP ACE OF THE REGION: {topPilot.name} ({topPilot.kills || 0} KILLS)
              </div>
            )}

            {/* Action Return Button */}
            <button
              onClick={handleReturn}
              className="py-3 px-8 text-xs font-bold text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 rounded-xl transition-all uppercase cursor-pointer"
            >
              RETURN TO HANGAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
