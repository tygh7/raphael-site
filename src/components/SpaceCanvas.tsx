import React, { useRef, useEffect, useState } from 'react';
import { Faction, SpaceShip, Laser, Particle, Asteroid, GameState } from '../types/space';
import { drawPixelShip } from '../utils/shipRenderer';
import { LIGHT_SHIPS, DARK_SHIPS, getShipDefById } from '../utils/spaceShips';
import { Shield, Skull, Award, User, RefreshCw } from 'lucide-react';

interface SpaceCanvasProps {
  faction: Faction;
  selectedShipId: string;
  onGameOver: (score: number, kills: number) => void;
  onExit: () => void;
}

const WORLD_SIZE = 8000;
const INITIAL_ASTEROIDS = 80;
const LASER_SPEED = 7.5;

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
  'Poe Dameron',
  'Snap Wexley'
];

const DARK_PILOT_NAMES = [
  'Iden Versio',
  'Gideon Hask',
  'Del Meeko',
  'Mauler Mithel',
  'Backstabber',
  'Dark Curse',
  'Scythe One',
  'Night Beast',
  'Obsidian Leader',
  'Black Eight',
  'Baron Soontir Fel',
  'Major Mihel'
];

export const SpaceCanvas: React.FC<SpaceCanvasProps> = ({
  faction,
  selectedShipId,
  onGameOver,
  onExit
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Input states
  const keysPressed = useRef<Record<string, boolean>>({});
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
    darkKills: 0
  });

  // Flow states
  const [isDead, setIsDead] = useState(false);
  const [respawnTimeLeft, setRespawnTimeLeft] = useState(5);
  const [respawnShipId, setRespawnShipId] = useState<string>(selectedShipId);

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [pauseSelect, setPauseSelect] = useState<'resume' | 'quit'>('resume');

  // Match timer (3 minutes = 180 seconds)
  const [matchTimeLeft, setMatchTimeLeft] = useState(180);
  const [isMatchOver, setIsMatchOver] = useState(false);
  const matchTimeLeftRef = useRef(180);

  // Dynamic canvas size state
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });

  // Screen shake timer/amplitude
  const screenShake = useRef({ duration: 0, amplitude: 0 });

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

    return {
      id: `ai_${fact}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      defId: def.id,
      name: pilotName,
      faction: fact,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: fact === 'light' ? Math.PI / 2 : -Math.PI / 2,
      hp: def.stats.shield,
      maxHp: def.stats.shield,
      lastShotTime: 0,
      isPlayer: false,
      stats: def.stats,
      color: def.color,
      aiState: 'patrol',
      aiDecisionTimer: 0,
      kills: 0,
      deaths: 0
    };
  };

  // Helper to trigger particles (chunkier retro explosion fragments)
  const spawnExplosion = (x: number, y: number, color: string, count = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 3;
      game.current.particles.push({
        id: `p_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.floor(Math.random() * 25),
        maxLife: 50,
        color,
        size: Math.random() < 0.3 ? 4 : 2
      });
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
      name: `Rogue Leader (You)`,
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
      deaths: 0
    };

    game.current.playerShip = player;
    game.current.ships = [player];
    game.current.lasers = [];
    game.current.particles = [];
    game.current.score = 0;
    game.current.kills = 0;
    game.current.deaths = 0;
    setIsDead(false);
    setIsPaused(false);
    setIsMatchOver(false);
    setMatchTimeLeft(180);

    // 2. Spawn Asteroids
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < INITIAL_ASTEROIDS; i++) {
      asteroids.push({
        id: `ast_${i}`,
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * (WORLD_SIZE - 1800) + 900, // spawn mostly in the middle neutral zone
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.floor(Math.random() * 3) + 1,
        hp: 40
      });
    }
    game.current.asteroids = asteroids;

    // 3. Spawn Fleet AI (even number of fighters: 10 vs 10)
    const teamSize = 10;
    const oppFaction = faction === 'light' ? 'dark' : 'light';
    
    // Spawn team AI (9 allies + player = 10)
    for (let i = 0; i < teamSize - 1; i++) {
      game.current.ships.push(createAiShipWithPilot(faction, i));
    }
    // Spawn opponent AI (10 enemies)
    for (let i = 0; i < teamSize; i++) {
      game.current.ships.push(createAiShipWithPilot(oppFaction, i));
    }
  };

  // Trigger setup on mount
  useEffect(() => {
    initGame();
  }, [faction]);

  // Set keyboard / mouse listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (game.current.playerShip && game.current.playerShip.hp > 0 && !isDead && !isMatchOver) {
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

  // Main 60fps Game Tick Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameTick = () => {
      updateGamePhysics();
      renderScene();
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
      state.playerShip.name = `Rogue Leader (You)`;
      state.playerShip.color = playerDef.color;
      state.playerShip.stats = playerDef.stats;
      state.playerShip.hp = playerDef.stats.shield;
      state.playerShip.maxHp = playerDef.stats.shield;
      state.playerShip.x = px;
      state.playerShip.y = py;
      state.playerShip.vx = 0;
      state.playerShip.vy = 0;
      state.playerShip.angle = faction === 'light' ? Math.PI / 2 : -Math.PI / 2;
    }
    setIsDead(false);
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

  // Physics Updates
  const updateGamePhysics = () => {
    if (isPausedRef.current || isMatchOver) return;
    const state = game.current;
    if (!state.playerShip) return;

    // --- 1. Screen Shake Decay ---
    if (screenShake.current.duration > 0) {
      screenShake.current.duration -= 1;
    }

    // --- 2. Update Player Ship Physics ---
    const player = state.playerShip;
    if (player.hp > 0) {
      let ax = 0;
      let ay = 0;
      const accel = 0.16;

      // ZQSD movement
      if (keysPressed.current['KeyW'] || keysPressed.current['KeyZ'] || keysPressed.current['ArrowUp']) {
        ay = -accel;
      }
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
        ay = accel;
      }
      if (keysPressed.current['KeyA'] || keysPressed.current['KeyQ'] || keysPressed.current['ArrowLeft']) {
        ax = -accel;
      }
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        ax = accel;
      }

      // Apply forces
      player.vx += ax;
      player.vy += ay;

      // Friction/Damping
      player.vx *= 0.96;
      player.vy *= 0.96;

      // Speed clamp
      const maxSpeed = player.stats.speed * 0.45;
      const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (currentSpeed > maxSpeed) {
        player.vx = (player.vx / currentSpeed) * maxSpeed;
        player.vy = (player.vy / currentSpeed) * maxSpeed;
      }

      // Update position
      player.x += player.vx;
      player.y += player.vy;

      // Keep player inside world bounds
      player.x = Math.max(50, Math.min(WORLD_SIZE - 50, player.x));
      player.y = Math.max(50, Math.min(WORLD_SIZE - 50, player.y));

      // Steer/Aim towards mouse cursor
      const canvas = canvasRef.current;
      if (canvas) {
        const screenCenterX = canvas.width / 2;
        const screenCenterY = canvas.height / 2;
        const dx = mousePos.current.x - screenCenterX;
        const dy = mousePos.current.y - screenCenterY;
        player.angle = Math.atan2(dy, dx);
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

      // Shoot trigger
      if (isMouseDown.current || keysPressed.current['KeyI']) {
        const now = Date.now();
        if (now - player.lastShotTime >= player.stats.rate) {
          fireLaser(player);
          player.lastShotTime = now;
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
        ship.aiDecisionTimer = 20 + Math.floor(Math.random() * 30); // 0.5s

        // 1. Scan for nearest target of opposite faction
        let nearestTarget: SpaceShip | null = null;
        let minDist = 1200;

        state.ships.forEach(t => {
          if (t.faction !== ship.faction && t.hp > 0) {
            const dx = t.x - ship.x;
            const dy = t.y - ship.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              nearestTarget = t;
            }
          }
        });

        if (nearestTarget) {
          ship.targetId = (nearestTarget as SpaceShip).id;
          ship.aiState = 'chase';
        } else {
          ship.targetId = undefined;
          ship.aiState = 'patrol';
        }
      }

      // AI Execution state
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
          ship.angle += diff * 0.08;

          const aiMaxSpeed = ship.stats.speed * 0.45;
          const accelSpeed = aiMaxSpeed * 0.06;
          if (dist > 300) {
            ship.vx += Math.cos(ship.angle) * accelSpeed;
            ship.vy += Math.sin(ship.angle) * accelSpeed;
          } else if (dist < 150) {
            ship.vx -= Math.cos(ship.angle) * accelSpeed;
            ship.vy -= Math.sin(ship.angle) * accelSpeed;
          }

          if (Math.random() < 0.05) {
            ship.vx += Math.cos(ship.angle + Math.PI / 2) * (Math.random() - 0.5) * 1.5;
            ship.vy += Math.sin(ship.angle + Math.PI / 2) * (Math.random() - 0.5) * 1.5;
          }

          const now = Date.now();
          if (dist < ship.stats.range && Math.abs(diff) < 0.45 && now - ship.lastShotTime >= ship.stats.rate * (1.3 + Math.random() * 0.6)) {
            fireLaser(ship);
            ship.lastShotTime = now;
          }
        }
      } else {
        // Patrol / Drift randomly
        if (Math.random() < 0.02) {
          ship.angle += (Math.random() - 0.5) * 1.2;
        }
        ship.vx += Math.cos(ship.angle) * 0.07;
        ship.vy += Math.sin(ship.angle) * 0.07;
      }

      // Physics integration
      ship.vx *= 0.96;
      ship.vy *= 0.96;
      const spd = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      const aiMaxSpeed = ship.stats.speed * 0.45;
      if (spd > aiMaxSpeed) {
        ship.vx = (ship.vx / spd) * aiMaxSpeed;
        ship.vy = (ship.vy / spd) * aiMaxSpeed;
      }

      ship.x += ship.vx;
      ship.y += ship.vy;

      // Clamp AI inside map
      ship.x = Math.max(60, Math.min(WORLD_SIZE - 60, ship.x));
      ship.y = Math.max(60, Math.min(WORLD_SIZE - 60, ship.y));
    });

    // --- 4. Update Lasers ---
    state.lasers = state.lasers.filter(laser => {
      laser.x += laser.vx;
      laser.y += laser.vy;
      laser.rangeRemaining -= LASER_SPEED;

      if (laser.rangeRemaining <= 0) return false;

      // Laser collision check with ships
      let hit = false;
      for (const ship of state.ships) {
        if (ship.hp <= 0) continue; // Skip dead ships
        if (ship.faction === laser.faction && !ship.isPlayer) continue; // friendly-fire safety
        if (ship.isPlayer && laser.faction === player.faction) continue;

        const dx = ship.x - laser.x;
        const dy = ship.y - laser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 22) { // hit radius
          ship.hp = Math.max(0, ship.hp - laser.damage);
          hit = true;

          // Spark particle splash
          spawnExplosion(laser.x, laser.y, laser.color, 6);

          // Screen shake on player hit
          if (ship.isPlayer) {
            screenShake.current = { duration: 15, amplitude: 6 };
          }

          // Check fainted ship
          if (ship.hp <= 0) {
            spawnExplosion(ship.x, ship.y, '#eab308', 35);
            spawnExplosion(ship.x, ship.y, '#f97316', 25);

            // Increment deaths
            ship.deaths = (ship.deaths || 0) + 1;

            // Increment kills on the killer ship
            const killer = state.ships.find(s => s.id === laser.ownerId);
            if (killer) {
              killer.kills = (killer.kills || 0) + 1;
              if (killer.isPlayer) {
                state.score += ship.stats.shield * 10;
              }
            }

            if (ship.isPlayer) {
              setIsDead(true);
            } else {
              // Respawn AI ship after a delay at its base
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
          break;
        }
      }

      if (hit) return false;

      // Laser collision check with asteroids
      for (const ast of state.asteroids) {
        const dx = ast.x - laser.x;
        const dy = ast.y - laser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = ast.size * 14;

        if (dist < hitRadius) {
          ast.hp -= laser.damage;
          hit = true;

          spawnExplosion(laser.x, laser.y, '#78350f', 5);

          if (ast.hp <= 0) {
            spawnExplosion(ast.x, ast.y, '#9ca3af', 15);
            
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
          break;
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
        const radius = ast.size * 12 + 16;

        if (dist < radius) {
          // Bounce ship
          const pushAngle = Math.atan2(dy, dx);
          ship.x += Math.cos(pushAngle) * 4;
          ship.y += Math.sin(pushAngle) * 4;
          ship.vx += Math.cos(pushAngle) * 1.2;
          ship.vy += Math.sin(pushAngle) * 1.2;

          ship.hp = Math.max(0, ship.hp - ast.size * 3);
          
          if (ship.hp <= 0) {
            ship.deaths = (ship.deaths || 0) + 1;

            if (ship.isPlayer) {
              setIsDead(true);
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
            screenShake.current = { duration: 10, amplitude: 4 };
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
      darkKills
    });
  };

  // Launch a laser shot
  const fireLaser = (ship: SpaceShip) => {
    const state = game.current;
    
    // Millennium Falcon has dual turrets!
    if (ship.defId === 'falcon') {
      const offsetL = ship.angle - Math.PI / 2;
      const offsetR = ship.angle + Math.PI / 2;
      
      const lx1 = ship.x + Math.cos(ship.angle) * 12 + Math.cos(offsetL) * 10;
      const ly1 = ship.y + Math.sin(ship.angle) * 12 + Math.sin(offsetL) * 10;
      const lx2 = ship.x + Math.cos(ship.angle) * 12 + Math.cos(offsetR) * 10;
      const ly2 = ship.y + Math.sin(ship.angle) * 12 + Math.sin(offsetR) * 10;

      const vx = Math.cos(ship.angle) * LASER_SPEED;
      const vy = Math.sin(ship.angle) * LASER_SPEED;

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
      const lx = ship.x + Math.cos(ship.angle) * 20;
      const ly = ship.y + Math.sin(ship.angle) * 20;
      const vx = Math.cos(ship.angle) * LASER_SPEED;
      const vy = Math.sin(ship.angle) * LASER_SPEED;

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

  // Render Scene loop
  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Apply Screen Shake
    ctx.save();
    if (screenShake.current.duration > 0) {
      const dx = (Math.random() - 0.5) * screenShake.current.amplitude;
      const dy = (Math.random() - 0.5) * screenShake.current.amplitude;
      ctx.translate(dx, dy);
    }

    const player = game.current.playerShip;
    if (!player) {
      ctx.restore();
      return;
    }

    const offsetX = canvas.width / 2 - player.x;
    const offsetY = canvas.height / 2 - player.y;

    // 1. Draw Space Void (Solid retro arcade black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
      const sx = ((star.x - player.x * star.speed) % canvas.width + canvas.width) % canvas.width;
      const sy = ((star.y - player.y * star.speed) % canvas.height + canvas.height) % canvas.height;
      
      // Periodically twinkle: make ~15% of stars dim out or blink
      const twinklePhase = (Math.floor(Date.now() / 150) + index) % 7;
      if (twinklePhase === 0) {
        ctx.fillStyle = '#111827'; // very dim
      } else {
        ctx.fillStyle = star.color;
      }
      ctx.fillRect(Math.floor(sx), Math.floor(sy), star.size, star.size);
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
    const endX = startX + canvas.width + gridSpacing;
    const startY = Math.floor(-offsetY / gridSpacing) * gridSpacing;
    const endY = startY + canvas.height + gridSpacing;

    for (let x = startX; x < endX; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x + offsetX, 0);
      ctx.lineTo(x + offsetX, canvas.height);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y + offsetY);
      ctx.lineTo(canvas.width, y + offsetY);
      ctx.stroke();
    }

    // 7. Draw World Boundary Fence
    ctx.strokeStyle = faction === 'light' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 5;
    ctx.strokeRect(offsetX, offsetY, WORLD_SIZE, WORLD_SIZE);

    // 8. Draw Asteroids (Chunky flat pixel-art rocks)
    game.current.asteroids.forEach(ast => {
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
    game.current.lasers.forEach(laser => {
      const sx = laser.x + offsetX;
      const sy = laser.y + offsetY;

      ctx.strokeStyle = laser.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - (laser.vx / LASER_SPEED) * 20, sy - (laser.vy / LASER_SPEED) * 20);
      ctx.stroke();
    });

    // 10. Draw Fleet Ships (Skipping dead ones)
    game.current.ships.forEach(ship => {
      if (ship.hp <= 0) return;
      const sx = ship.x + offsetX;
      const sy = ship.y + offsetY;

      drawPixelShip(
        ctx,
        sx,
        sy,
        ship.isPlayer ? 26 : 21,
        ship.angle,
        ship.defId,
        ship.faction,
        ship.color,
        Math.abs(ship.vx) > 0.3 || Math.abs(ship.vy) > 0.3
      );

      // Draw health indicators
      const hpPct = ship.hp / ship.maxHp;
      const barW = 28;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(sx - barW / 2, sy - 24, barW, 4);

      ctx.fillStyle = ship.faction === 'light' ? '#10b981' : '#ef4444';
      ctx.fillRect(sx - barW / 2, sy - 24, barW * hpPct, 3);
    });

    // 11. Draw Explosion Particles
    game.current.particles.forEach(p => {
      const sx = p.x + offsetX;
      const sy = p.y + offsetY;
      const lifePct = p.life / p.maxLife;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = lifePct;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // 12. Draw offscreen indicators
    game.current.ships.forEach(ship => {
      if (ship.isPlayer || ship.hp <= 0) return;
      
      const dx = ship.x - player.x;
      const dy = ship.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > canvas.width / 2 && dist < 2200) {
        const angle = Math.atan2(dy, dx);
        const margin = 32;
        const rx = canvas.width / 2 + Math.cos(angle) * (canvas.width / 2 - margin);
        const ry = canvas.height / 2 + Math.sin(angle) * (canvas.height / 2 - margin);

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

    ctx.restore();
  };

  const handleReturn = () => {
    onGameOver(hud.score, hud.kills);
  };

  const shieldPercent = (hud.hp / hud.maxHp) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current ship selection list for respawn screen
  const respawnShips = faction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
  const selectedRespawnShipDef = [...LIGHT_SHIPS, ...DARK_SHIPS].find(s => s.id === respawnShipId);

  // Leaderboard ranking list
  const rankings = getLeaderboard();
  const topPilot = rankings[0];

  // Determine faction winner
  const factionScores = getFactionScores();
  let factionWinnerMsg = 'DRAW';
  let factionWinnerColor = 'text-yellow-400';
  if (factionScores.lightKills > factionScores.darkKills) {
    factionWinnerMsg = 'LIGHT SIDE WINS THE REGION';
    factionWinnerColor = 'text-emerald-400';
  } else if (factionScores.darkKills > factionScores.lightKills) {
    factionWinnerMsg = 'DARK SIDE WINS THE REGION';
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

      {/* Full-Screen HUD Overlay Header */}
      <div className="absolute top-4 left-0 right-0 z-30 px-6 flex justify-between items-center pointer-events-none">
        {/* Player Stats */}
        <div className="flex gap-6 bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            SCORE: <span className="text-white font-bold crt-glow">{hud.score}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            KILLS: <span className="text-emerald-400 font-bold crt-glow">{hud.kills}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            DEATHS: <span className="text-rose-400 font-bold crt-glow">{hud.deaths}</span>
          </span>
        </div>

        {/* Match Timer */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-6 py-2 shadow-2xl backdrop-blur-md flex flex-col items-center">
          <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase">MATCH TIME</span>
          <span className={`text-sm font-extrabold crt-glow ${matchTimeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            {formatTime(matchTimeLeft)}
          </span>
        </div>

        {/* Faction Score (Light vs Dark kills) */}
        <div className="flex gap-4 bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md text-[10px] font-bold">
          <span className="text-emerald-400 flex items-center gap-1">
            LIGHT SIDE: <span className="text-white crt-glow">{hud.lightKills}</span>
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-rose-500 flex items-center gap-1">
            DARK SIDE: <span className="text-white crt-glow">{hud.darkKills}</span>
          </span>
        </div>
      </div>

      {/* Canvas viewport */}
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        className="w-full h-full cursor-crosshair block bg-black"
      />

      {/* Full-Screen HUD Overlay Footer */}
      <div className="absolute bottom-6 left-0 right-0 z-30 px-6 flex justify-between items-center pointer-events-none">
        {/* Thruster Speed */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md text-[10px] text-zinc-400 font-bold">
          SPEED: <span className="text-white crt-glow">{hud.speed} km/s</span>
        </div>

        {/* Shield Integrity Meter */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-md w-[280px]">
          <span className={`text-[10px] font-bold ${faction === 'light' ? 'text-emerald-400' : 'text-rose-500'}`}>
            SHIELDS:
          </span>
          <div className="flex-1 h-2.5 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-300 ${
                faction === 'light' ? 'bg-emerald-500' : 'bg-rose-600'
              }`}
              style={{ width: `${shieldPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-white font-mono">{hud.hp}</span>
        </div>
      </div>

      {/* Control Help bar */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 text-[8px] text-zinc-600 font-bold uppercase tracking-widest pointer-events-none">
        Press <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">ESC</kbd> to Pause | Move: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">ZQSD</kbd> | Shoot: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">LEFT CLICK / I</kbd>
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
                className={`w-full py-3 px-4 border text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-between rounded-xl pointer-events-auto ${
                  pauseSelect === 'resume'
                    ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
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
                className={`w-full py-3 px-4 border text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-between rounded-xl pointer-events-auto ${
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

      {/* Respawn Overlay Screen with Ship Selection (5s countdown lock) */}
      {isDead && !isMatchOver && (
        <div className="absolute inset-0 z-45 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 gap-5 animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-pulse">
            <Skull className="w-6 h-6" />
          </div>

          <div className="text-center flex flex-col gap-1.5">
            <h2 className="text-xl font-extrabold uppercase tracking-widest text-white crt-glow">
              STARFIGHTER ELIMINATED
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Choose a fighter from base hangar for hyperspace deploy
            </p>
          </div>

          {/* Ship Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-[660px] w-full p-3 border border-zinc-800 bg-zinc-950/80 rounded-2xl shadow-inner">
            {respawnShips.map((ship) => {
              const active = ship.id === respawnShipId;
              const activeBorderCol = faction === 'light' ? 'border-emerald-500 bg-emerald-950/20' : 'border-rose-500 bg-rose-950/20';
              
              return (
                <div
                  key={ship.id}
                  onClick={() => setRespawnShipId(ship.id)}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col gap-1.5 ${
                    active ? activeBorderCol : `border-zinc-900 bg-zinc-900/10 hover:border-zinc-800`
                  }`}
                >
                  <span className="font-bold text-[9px] text-white uppercase tracking-wider block truncate">{ship.name.split(' ').pop() || ship.name}</span>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500" style={{ width: `${(ship.stats.speed / 8) * 100}%` }} />
                  </div>
                  <span className="text-[7.5px] text-zinc-500 font-mono">
                    SPD:{ship.stats.speed} HP:{ship.stats.shield}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedRespawnShipDef && (
            <div className="text-center text-[10px] text-zinc-500 italic max-w-[400px]">
              "{selectedRespawnShipDef.description}"
            </div>
          )}

          {/* Locked timer button */}
          <div className="flex flex-col items-center gap-2 mt-2">
            {respawnTimeLeft > 0 ? (
              <span className="text-xs font-mono font-bold text-yellow-500 animate-pulse uppercase tracking-wider">
                RESPAWN LOCKED FOR {respawnTimeLeft}s
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-emerald-400 animate-pulse uppercase tracking-wider">
                READY FOR LAUNCH
              </span>
            )}
            
            <button
              onClick={respawnPlayer}
              disabled={respawnTimeLeft > 0}
              className={`py-3.5 px-10 text-xs font-bold text-white rounded-xl transition-all uppercase ${
                respawnTimeLeft > 0
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : faction === 'light'
                    ? 'bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer'
                    : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] cursor-pointer'
              }`}
            >
              {respawnTimeLeft > 0 ? `LOCKED (${respawnTimeLeft}s)` : 'LAUNCH FIGHTER'}
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
                Final standing - Light Side: {factionScores.lightKills} Kills | Dark Side: {factionScores.darkKills} Kills
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
                          <span className={ship.faction === 'light' ? 'text-emerald-400' : 'text-rose-500'}>
                            {ship.faction}
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
