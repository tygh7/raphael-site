import React, { useRef, useEffect, useState } from 'react';
import { Faction, SpaceShip, Laser, Particle, Asteroid, GameState } from '../types/space';
import { drawPixelShip } from '../utils/shipRenderer';
import { LIGHT_SHIPS, DARK_SHIPS, getShipDefById } from '../utils/spaceShips';
import { Shield, Skull, Award, User } from 'lucide-react';

interface SpaceCanvasProps {
  faction: Faction;
  selectedShipId: string;
  onGameOver: (score: number, kills: number) => void;
  onExit: () => void;
}

// 3D Space Volume Constants
const WORLD_DEPTH = 12000;
const INITIAL_ASTEROIDS = 60;

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

  // 3D Camera coordinates
  const camera = useRef({ x: 0, y: 0, z: 0 });

  // HUD sync state
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

  // Core Game Loop State (held in refs for 60fps tick rate without React re-renders)
  const game = useRef<GameState>({
    playerShip: null,
    faction: faction,
    ships: [],
    lasers: [],
    particles: [],
    asteroids: [],
    worldSize: WORLD_DEPTH,
    score: 0,
    kills: 0,
    deaths: 0
  });

  // 3D Starfield coordinates
  const starsBackground = useRef<{ x: number; y: number; z: number; size: number; color: string }[]>([]);

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

  // Initialize background starfields in 3D
  useEffect(() => {
    const stars: { x: number; y: number; z: number; size: number; color: string }[] = [];
    const colors = ['#ffffff', '#ffffff', '#eab308', '#38bdf8', '#ef4444', '#ca8a04', '#a855f7'];
    for (let i = 0; i < 500; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 6000,
        y: (Math.random() - 0.5) * 3000,
        z: Math.random() * 3000,
        size: Math.random() < 0.25 ? 4.0 : 1.8,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    starsBackground.current = stars;
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

  // Helper to generate a random ship from a faction with unique pilot name in 3D
  const createAiShipWithPilot = (fact: Faction, index: number): SpaceShip => {
    const list = fact === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
    const def = list[Math.floor(Math.random() * list.length)];
    const namesList = fact === 'light' ? LIGHT_PILOT_NAMES : DARK_PILOT_NAMES;
    const pilotName = namesList[index % namesList.length];

    // Distribute X, Y and Z relative to faction bases
    const x = (Math.random() - 0.5) * 3000;
    const y = (Math.random() - 0.5) * 1000;
    
    // Light spawns near -5900, Dark spawns near 5900
    const factionZDirection = fact === 'light' ? 1 : -1;
    const baseZ = -5900 * factionZDirection;
    // Spread them out along the flight path
    const z = baseZ + factionZDirection * (Math.random() * 3800);

    return {
      id: `ai_${fact}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      defId: def.id,
      name: pilotName,
      faction: fact,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      vz: factionZDirection * def.stats.speed * (1.5 + Math.random() * 1.5),
      angle: 0,
      roll: 0,
      pitch: 0,
      yaw: 0,
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

  // Helper to trigger particles in 3D space
  const spawnExplosion = (x: number, y: number, z: number, color: string, count = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const verticalAngle = (Math.random() - 0.5) * Math.PI;
      const speed = 2.0 + Math.random() * 8;
      
      game.current.particles.push({
        id: `p_${Math.random()}`,
        x,
        y,
        z,
        vx: Math.cos(angle) * Math.cos(verticalAngle) * speed,
        vy: Math.sin(verticalAngle) * speed,
        vz: Math.sin(angle) * Math.cos(verticalAngle) * speed,
        life: 20 + Math.floor(Math.random() * 20),
        maxLife: 40,
        color,
        size: Math.random() < 0.3 ? 5 : 2.5
      });
    }
  };

  // Start / Reset Space Match
  const initGame = () => {
    const playerDef = getShipDefById(selectedShipId)!;
    const pForwardZ = faction === 'light' ? 1 : -1;

    // 1. Create player at their faction base facing the center
    const player: SpaceShip = {
      id: 'player',
      defId: selectedShipId,
      name: `Rogue Leader (You)`,
      faction: faction,
      x: 0,
      y: 0,
      z: -5900 * pForwardZ,
      vx: 0,
      vy: 0,
      vz: pForwardZ * playerDef.stats.speed * 4.5,
      angle: 0,
      roll: 0,
      pitch: 0,
      yaw: 0,
      hp: playerDef.stats.shield,
      maxHp: playerDef.stats.shield,
      lastShotTime: 0,
      isPlayer: true,
      stats: playerDef.stats,
      color: playerDef.color,
      kills: 0,
      deaths: 0
    };

    camera.current = { x: 0, y: 40, z: -5900 * pForwardZ - 260 * pForwardZ };

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

    // 2. Spawn Asteroids in 3D scattered across the battle arena
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < INITIAL_ASTEROIDS; i++) {
      asteroids.push({
        id: `ast_${i}`,
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 1800,
        z: (Math.random() - 0.5) * 10000, // wider distribution
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 1.5,
        size: Math.floor(Math.random() * 3) + 1,
        hp: 40
      });
    }
    game.current.asteroids = asteroids;

    // 3. Spawn Fleet AI (total 60 fighters: 30 vs 30)
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
    const pForwardZ = faction === 'light' ? 1 : -1;

    if (state.playerShip) {
      state.playerShip.defId = respawnShipId;
      state.playerShip.name = `Rogue Leader (You)`;
      state.playerShip.color = playerDef.color;
      state.playerShip.stats = playerDef.stats;
      state.playerShip.hp = playerDef.stats.shield;
      state.playerShip.maxHp = playerDef.stats.shield;
      state.playerShip.x = 0;
      state.playerShip.y = 0;
      state.playerShip.z = -5900 * pForwardZ; // spawn at faction base
      state.playerShip.vx = 0;
      state.playerShip.vy = 0;
      state.playerShip.vz = pForwardZ * playerDef.stats.speed * 4.5;
      state.playerShip.roll = 0;
      state.playerShip.pitch = 0;
      state.playerShip.yaw = 0;
    }
    camera.current.z = -5900 * pForwardZ - 260 * pForwardZ;
    camera.current.x = 0;
    camera.current.y = 45;
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

  // 3D Physics Update Loop
  const updateGamePhysics = () => {
    if (isPausedRef.current || isMatchOver) return;
    const state = game.current;
    if (!state.playerShip) return;

    // --- 1. Screen Shake Decay ---
    if (screenShake.current.duration > 0) {
      screenShake.current.duration -= 1;
    }

    // --- 2. Update Player Ship Physics (3D Behind View) ---
    const player = state.playerShip;
    const forwardZ = faction === 'light' ? 1 : -1;

    // Check for hyperspace loop
    if (player.hp > 0 && (player.z || 0) * forwardZ > 5900) {
      // Warp player back to base
      player.z = -5900 * forwardZ;
      camera.current.z = (player.z || 0) - 260 * forwardZ;
      camera.current.x = player.x;
      camera.current.y = player.y + 45;
      
      // Spawn hyperspace particles
      spawnExplosion(player.x, player.y, player.z || 0, player.color, 45);
      screenShake.current = { duration: 25, amplitude: 12 };
    }

    if (player.hp > 0) {
      const canvas = canvasRef.current;

      // Determine keyboard roll and steer target offsets
      let targetXOffset = 0;
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
        targetXOffset = -380 * forwardZ; // steer left in screen space
        player.roll = Math.max(-0.6, (player.roll || 0) - 0.08);
      } else if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        targetXOffset = 380 * forwardZ; // steer right in screen space
        player.roll = Math.min(0.6, (player.roll || 0) + 0.08);
      } else {
        player.roll = (player.roll || 0) * 0.88; // return to balance
      }

      if (canvas) {
        // Calculate target coordinates under the mouse crosshair (260 depth ahead of camera)
        const relZ = 260;
        const scale = 450 / relZ;
        
        // Inverse projection from screen space to world space coordinates
        const mouseTargetX = camera.current.x + (mousePos.current.x - canvas.width / 2) / (scale * forwardZ);
        const mouseTargetY = camera.current.y + (canvas.height / 2 - mousePos.current.y) / scale;

        const targetX = mouseTargetX + targetXOffset;
        const targetY = mouseTargetY;

        // Easing/spring-damper physics towards target coordinates to prevent sliding
        player.vx += (targetX - player.x) * 0.15 - player.vx * 0.35;
        player.vy += (targetY - player.y) * 0.15 - player.vy * 0.35;
      }

      // Z Accelerate (boost) / S deceleration (brake)
      const baseSpeed = player.stats.speed;
      let targetVz = forwardZ * baseSpeed * 5.0; // cruising speed in 3D
      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
        targetVz = forwardZ * baseSpeed * 8.5; // Hyperspace Boost speed
      } else if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
        targetVz = forwardZ * baseSpeed * 1.5; // Brake speed
      }

      player.vz = (player.vz || 0) + (targetVz - (player.vz || 0)) * 0.08;

      // Friction damping for secondary movements
      player.vx *= 0.82;
      player.vy *= 0.82;

      // Position update
      player.x += player.vx;
      player.y += player.vy;
      player.z = (player.z || 0) + (player.vz || 0);

      // Boundaries inside the 3D tunnel box (kept inside the wireframe walls)
      player.x = Math.max(-1800, Math.min(1800, player.x));
      player.y = Math.max(-850, Math.min(850, player.y));
      player.pitch = player.vy * 0.025;
      player.yaw = player.vx * 0.025 * forwardZ;

      // Engine particles in 3D
      if (Math.random() < 0.55) {
        state.particles.push({
          id: `p_${Math.random()}`,
          x: player.x + (Math.random() - 0.5) * 20,
          y: player.y - 6 + (Math.random() - 0.5) * 8,
          z: player.z - 25 * forwardZ,
          vx: player.vx * 0.5,
          vy: player.vy * 0.5,
          vz: (player.vz || 0) - 15 * forwardZ,
          life: 15 + Math.floor(Math.random() * 15),
          maxLife: 30,
          color: player.faction === 'light' ? '#38bdf8' : '#ef4444',
          size: Math.random() < 0.5 ? 4.5 : 2
        });
      }

      // Shoot trigger
      if (isMouseDown.current || keysPressed.current['KeyI'] || keysPressed.current['KeyQ']) {
        const now = Date.now();
        if (now - player.lastShotTime >= player.stats.rate) {
          fireLaser(player);
          player.lastShotTime = now;
        }
      }
    }

    // --- 3. Camera Chase follow coordinates ---
    camera.current.z = (player.z || 0) - 260 * forwardZ; // offset behind relative to faction heading
    camera.current.x += (player.x - camera.current.x) * 0.15; // lag behind ship X
    camera.current.y += (player.y + 45 - camera.current.y) * 0.15; // lag behind ship Y + offset above

    // --- 4. Update AI Fleet Ships (dogfighting in Z-depth) ---
    state.ships.forEach(ship => {
      if (ship.isPlayer) return;
      if (ship.hp <= 0) return;

      const inClashZone = Math.abs(ship.z || 0) <= 2000;

      // AI decision tick
      if (!ship.aiDecisionTimer) ship.aiDecisionTimer = 0;
      ship.aiDecisionTimer -= 1;

      if (ship.aiDecisionTimer <= 0) {
        ship.aiDecisionTimer = 20 + Math.floor(Math.random() * 30);

        if (inClashZone) {
          // Defender helper behavior: if ship is ally, check if any enemy is targeting player in clash zone
          const isAlly = ship.faction === faction;
          let defenderTargetId: string | undefined = undefined;

          if (isAlly) {
            const playerPursuer = state.ships.find(
              s => s.faction !== faction && s.targetId === 'player' && s.hp > 0 && Math.abs(s.z || 0) <= 2000
            );
            if (playerPursuer && Math.random() < 0.65) {
              defenderTargetId = playerPursuer.id;
            }
          }

          if (defenderTargetId) {
            ship.targetId = defenderTargetId;
            ship.aiState = 'chase';
          } else {
            // Scan for nearest opposite faction target in 3D (within clashing region)
            let nearestTarget: SpaceShip | null = null;
            let minDist = 4500;

            state.ships.forEach(t => {
              if (t.faction !== ship.faction && t.hp > 0 && Math.abs(t.z || 0) <= 2200) {
                const dx = t.x - ship.x;
                const dy = t.y - ship.y;
                const dz = (t.z || 0) - (ship.z || 0);
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
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
        } else {
          // Outside clashing zone, bias to patrol straight towards center
          ship.targetId = undefined;
          ship.aiState = 'patrol';
        }
      }

      // Enforce patrol state when outside the clashing zone
      if (!inClashZone) {
        ship.aiState = 'patrol';
        ship.targetId = undefined;
      }

      // Execute AI
      if (ship.aiState === 'chase' && ship.targetId) {
        const target = state.ships.find(s => s.id === ship.targetId && s.hp > 0);
        if (target) {
          const dx = target.x - ship.x;
          const dy = target.y - ship.y;
          const dz = (target.z || 0) - (ship.z || 0);
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

          // Faster AI chase velocity matching player's cruising pace
          const flySpeed = ship.stats.speed * 4.2;
          const ease = 0.04;
          ship.vx += ((dx / (dist || 1)) * flySpeed - ship.vx) * ease;
          ship.vy += ((dy / (dist || 1)) * flySpeed - ship.vy) * ease;
          ship.vz = (ship.vz || 0) + ((dz / (dist || 1)) * flySpeed - (ship.vz || 0)) * ease;

          ship.roll = ship.vx * 0.035;

          const now = Date.now();
          if (dist < 2600 && now - ship.lastShotTime >= ship.stats.rate * (1.1 + Math.random() * 0.5)) {
            // Check if target is in front of the AI ship
            const isAhead = (ship.vz || 0) >= 0 ? dz > 0 : dz < 0;
            if (isAhead) {
              fireLaser(ship);
              ship.lastShotTime = now;
            }
          }
        }
      } else {
        // Patrol/glide towards center Z = 0
        ship.vx *= 0.95;
        ship.vy *= 0.95;
        const aiForward = ship.faction === 'light' ? 1 : -1;
        // Faster AI patrol velocity
        const targetVz = aiForward * ship.stats.speed * 3.5;
        ship.vz = (ship.vz || 0) + (targetVz - (ship.vz || 0)) * 0.05;
        ship.roll = 0;
      }

      // AI Physics integration
      ship.x += ship.vx;
      ship.y += ship.vy;
      ship.z = (ship.z || 0) + (ship.vz || 0);

      // AI boundaries
      ship.x = Math.max(-1900, Math.min(1900, ship.x));
      ship.y = Math.max(-900, Math.min(900, ship.y));

      // AI recycling when overshooting corridor boundaries in either direction
      const shipForward = ship.faction === 'light' ? 1 : -1;
      if (Math.abs(ship.z || 0) > 6100) {
        ship.z = -6000 * shipForward;
        ship.x = (Math.random() - 0.5) * 3000;
        ship.y = (Math.random() - 0.5) * 1000;
        ship.vx = 0;
        ship.vy = 0;
        ship.vz = shipForward * ship.stats.speed * (3.0 + Math.random() * 1.0);
        ship.hp = ship.maxHp;
      }
    });

    // --- 5. Update Lasers (3D depth flight) ---
    state.lasers = state.lasers.filter(laser => {
      laser.x += laser.vx;
      laser.y += laser.vy;
      laser.z = (laser.z || 0) + (laser.vz || 0);
      laser.rangeRemaining -= Math.abs(laser.vz || 0);

      if (laser.rangeRemaining <= 0) return false;

      // Laser collision with ships in 3D
      let hit = false;
      for (const ship of state.ships) {
        if (ship.hp <= 0) continue;
        if (ship.faction === laser.faction && !ship.isPlayer) continue;
        if (ship.isPlayer && laser.faction === player.faction) continue;

        const dx = ship.x - laser.x;
        const dy = ship.y - laser.y;
        const dz = (ship.z || 0) - (laser.z || 0);
        const distSq = dx*dx + dy*dy + dz*dz;

        // Collision sphere
        const hitRadius = ship.isPlayer ? 50 : 42;
        if (distSq < hitRadius * hitRadius) {
          ship.hp = Math.max(0, ship.hp - laser.damage);
          hit = true;

          // Splash particles
          spawnExplosion(laser.x, laser.y, laser.z || 0, laser.color, 6);

          if (ship.isPlayer) {
            screenShake.current = { duration: 15, amplitude: 8 };
          }

          if (ship.hp <= 0) {
            spawnExplosion(ship.x, ship.y, ship.z || 0, '#eab308', 35);
            spawnExplosion(ship.x, ship.y, ship.z || 0, '#f97316', 25);

            ship.deaths = (ship.deaths || 0) + 1;

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
              const deadShip = ship;
              setTimeout(() => {
                if (!isMatchOver) {
                   const aiForward = deadShip.faction === 'light' ? 1 : -1;
                   deadShip.hp = deadShip.maxHp;
                   deadShip.z = -6000 * aiForward; // respawn at faction base
                   deadShip.x = (Math.random() - 0.5) * 2000;
                   deadShip.y = (Math.random() - 0.5) * 800;
                   deadShip.vx = 0;
                   deadShip.vy = 0;
                   deadShip.vz = aiForward * deadShip.stats.speed * (3.0 + Math.random() * 1.0);
                }
              }, 4000);
            }
          }
          break;
        }
      }

      return !hit;
    });

    // --- 6. Update Asteroids in Z-depth ---
    state.asteroids.forEach(ast => {
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.z = (ast.z || 0) + (ast.vz || 0);

      // If behind camera, recycle ahead relative to flight direction
      if ((ast.z || 0) * forwardZ < (player.z || 0) * forwardZ - 500) {
        ast.z = (player.z || 0) + (3200 * forwardZ) + (Math.random() - 0.5) * 1000;
        ast.x = (Math.random() - 0.5) * 4000;
        ast.y = (Math.random() - 0.5) * 2000;
        ast.hp = 40;
      }

      // Ship collision with asteroids
      state.ships.forEach(ship => {
        if (ship.hp <= 0) return;
        const dx = ship.x - ast.x;
        const dy = ship.y - ast.y;
        const dz = (ship.z || 0) - (ast.z || 0);
        const distSq = dx*dx + dy*dy + dz*dz;

        const crashRadius = ast.size * 25 + 40;
        if (distSq < crashRadius * crashRadius) {
          // Bounce ship back
          ship.vx += (ship.x - ast.x) * 0.06;
          ship.vy += (ship.y - ast.y) * 0.06;
          ship.vz = (ship.vz || 0) - 2.5 * forwardZ;

          ship.hp = Math.max(0, ship.hp - ast.size * 4);

          if (ship.isPlayer) {
            screenShake.current = { duration: 12, amplitude: 6 };
          }

          if (ship.hp <= 0) {
            ship.deaths = (ship.deaths || 0) + 1;
            if (ship.isPlayer) {
              setIsDead(true);
            } else {
              spawnExplosion(ship.x, ship.y, ship.z || 0, '#eab308', 30);
              const deadShip = ship;
              setTimeout(() => {
                if (!isMatchOver) {
                  const aiForward = deadShip.faction === 'light' ? 1 : -1;
                  deadShip.hp = deadShip.maxHp;
                  deadShip.z = -6000 * aiForward; // respawn at faction base
                  deadShip.x = (Math.random() - 0.5) * 2000;
                  deadShip.y = (Math.random() - 0.5) * 800;
                  deadShip.vx = 0;
                  deadShip.vy = 0;
                  deadShip.vz = aiForward * deadShip.stats.speed * (3.0 + Math.random() * 1.0);
                }
              }, 4000);
            }
          }
        }
      });
    });

    // --- 7. Update Particles ---
    state.particles = state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.z = (p.z || 0) + (p.vz || 0);
      p.life -= 1;
      return p.life > 0;
    });

    // --- 8. Sync HUD ---
    const { lightKills, darkKills } = getFactionScores();
    setHud({
      hp: player.hp,
      maxHp: player.maxHp,
      score: state.score,
      kills: player.kills || 0,
      deaths: player.deaths || 0,
      alliesCount: state.ships.filter(s => s.faction === faction && !s.isPlayer && s.hp > 0).length,
      enemiesCount: state.ships.filter(s => s.faction !== faction && s.hp > 0).length,
      speed: Math.abs(Math.round(player.vz || 0)) * 15,
      lightKills,
      darkKills
    });
  };

  // Launch a laser shot in 3D Z-direction
  const fireLaser = (ship: SpaceShip) => {
    const state = game.current;
    const shipForwardZ = ship.faction === 'light' ? 1 : -1;

    // Millennium Falcon has dual turrets!
    if (ship.defId === 'falcon') {
      const lx1 = ship.x - 24;
      const ly1 = ship.y;
      const lz1 = (ship.z || 0) + 25 * shipForwardZ;

      const lx2 = ship.x + 24;
      const ly2 = ship.y;
      const lz2 = (ship.z || 0) + 25 * shipForwardZ;

      const vz = (ship.vz || 0) + 90 * shipForwardZ; // increased laser speed
      const vx = ship.vx;
      const vy = ship.vy;

      state.lasers.push(
        {
          id: `las_${Math.random()}`,
          ownerId: ship.id,
          faction: ship.faction,
          x: lx1,
          y: ly1,
          z: lz1,
          vx,
          vy,
          vz,
          damage: ship.stats.power,
          rangeRemaining: ship.stats.range * 4,
          color: ship.color
        },
        {
          id: `las_${Math.random()}`,
          ownerId: ship.id,
          faction: ship.faction,
          x: lx2,
          y: ly2,
          z: lz2,
          vx,
          vy,
          vz,
          damage: ship.stats.power,
          rangeRemaining: ship.stats.range * 4,
          color: ship.color
        }
      );
    } else {
      const lx = ship.x;
      const ly = ship.y;
      const lz = (ship.z || 0) + 25 * shipForwardZ;
      
      const vz = (ship.vz || 0) + 90 * shipForwardZ; // increased laser speed
      const vx = ship.vx;
      const vy = ship.vy;

      state.lasers.push({
        id: `las_${Math.random()}`,
        ownerId: ship.id,
        faction: ship.faction,
        x: lx,
        y: ly,
        z: lz,
        vx,
        vy,
        vz,
        damage: ship.stats.power,
        rangeRemaining: ship.stats.range * 4,
        color: ship.color
      });
    }
  };

  // Render Scene loop (3D perspective scaling projection)
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

    // 1. Draw Space Void (Solid black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const forwardDir = faction === 'light' ? 1 : -1;

    // 3D Projection Helper
    const project = (x: number, y: number, z: number) => {
      const relX = x - camera.current.x;
      const relY = y - camera.current.y;
      const relZ = (z - camera.current.z) * forwardDir;

      if (relZ <= 10) return null; // Behind camera

      const fov = 450; // Focal length
      const scale = fov / relZ;
      const screenX = canvas.width / 2 + relX * scale * forwardDir;
      const screenY = canvas.height / 2 - relY * scale; // invert Y for screen space

      return { x: screenX, y: screenY, scale };
    };

    // 2. Draw Stars (twinkling starfield emerging from center)
    starsBackground.current.forEach((star, index) => {
      let starZ = star.z;
      if (forwardDir === 1) {
        while (starZ < camera.current.z) starZ += 6000;
        while (starZ > camera.current.z + 6000) starZ -= 6000;
      } else {
        while (starZ > camera.current.z) starZ -= 6000;
        while (starZ < camera.current.z - 6000) starZ += 6000;
      }

      const p = project(star.x, star.y, starZ);
      if (p) {
        const twinklePhase = (Math.floor(Date.now() / 150) + index) % 7;
        if (twinklePhase === 0) {
          ctx.fillStyle = '#111827'; // very dim
        } else {
          ctx.fillStyle = star.color;
        }

        const size = Math.max(1.5, star.size * p.scale * 0.12);
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), size, size);
      }
    });

    // 3. Draw 3D Tunnel wireframe cage (Tempest/Star Fox feel)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const tunnelW = 2000;
    const tunnelH = 950;
    const zSpacing = 350;
    const zStart = Math.floor(camera.current.z / zSpacing) * zSpacing;

    for (let i = 0; i < 20; i++) {
      const z = zStart + i * zSpacing * forwardDir;
      // Project the 4 corners of the tunnel at Z
      const c1 = project(-tunnelW, -tunnelH, z);
      const c2 = project(tunnelW, -tunnelH, z);
      const c3 = project(tunnelW, tunnelH, z);
      const c4 = project(-tunnelW, tunnelH, z);

      if (c1 && c2 && c3 && c4) {
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c4.x, c4.y);
        ctx.closePath();
        ctx.stroke();

        // Floor glow for bases
        const isNearBase = Math.abs(z) > 4000;
        if (isNearBase) {
          const isLightBase = z < 0;
          ctx.fillStyle = isLightBase ? 'rgba(16, 185, 129, 0.006)' : 'rgba(239, 68, 68, 0.006)';
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.lineTo(canvas.width / 2, canvas.height / 2);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw long lines connecting tunnel corners (ensuring all corners project successfully to prevent crash)
    const pFar1 = project(-tunnelW, -tunnelH, camera.current.z + 7000 * forwardDir);
    const pFar2 = project(tunnelW, -tunnelH, camera.current.z + 7000 * forwardDir);
    const pFar3 = project(tunnelW, tunnelH, camera.current.z + 7000 * forwardDir);
    const pFar4 = project(-tunnelW, tunnelH, camera.current.z + 7000 * forwardDir);

    const pNear1 = project(-tunnelW, -tunnelH, camera.current.z + 100 * forwardDir);
    const pNear2 = project(tunnelW, -tunnelH, camera.current.z + 100 * forwardDir);
    const pNear3 = project(tunnelW, tunnelH, camera.current.z + 100 * forwardDir);
    const pNear4 = project(-tunnelW, tunnelH, camera.current.z + 100 * forwardDir);

    if (pFar1 && pNear1 && pFar2 && pNear2 && pFar3 && pNear3 && pFar4 && pNear4) {
      ctx.beginPath();
      ctx.moveTo(pNear1.x, pNear1.y); ctx.lineTo(pFar1.x, pFar1.y);
      ctx.moveTo(pNear2.x, pNear2.y); ctx.lineTo(pFar2.x, pFar2.y);
      ctx.moveTo(pNear3.x, pNear3.y); ctx.lineTo(pFar3.x, pFar3.y);
      ctx.moveTo(pNear4.x, pNear4.y); ctx.lineTo(pFar4.x, pFar4.y);
      ctx.stroke();
    }

    // Render Light Side Base Gate (at Z = -6000)
    const pLightBase = project(0, 0, -6000);
    if (pLightBase) {
      const baseScale = pLightBase.scale * 20;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // Emerald
      ctx.lineWidth = Math.max(1, pLightBase.scale * 0.2);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = pLightBase.x + Math.cos(angle) * baseScale * 12;
        const y = pLightBase.y + Math.sin(angle) * baseScale * 8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      if (pLightBase.scale > 0.5) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
        ctx.font = `${Math.max(6, Math.floor(6 * pLightBase.scale * 0.15))}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText("LIGHT SIDE HANGAR", pLightBase.x, pLightBase.y - baseScale * 4);
      }
    }

    // Render Dark Side Base Gate (at Z = 6000)
    const pDarkBase = project(0, 0, 6000);
    if (pDarkBase) {
      const baseScale = pDarkBase.scale * 20;
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red
      ctx.lineWidth = Math.max(1, pDarkBase.scale * 0.2);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = pDarkBase.x + Math.cos(angle) * baseScale * 12;
        const y = pDarkBase.y + Math.sin(angle) * baseScale * 8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      if (pDarkBase.scale > 0.5) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.font = `${Math.max(6, Math.floor(6 * pDarkBase.scale * 0.15))}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText("DARK SIDE HANGAR", pDarkBase.x, pDarkBase.y - baseScale * 4);
      }
    }

    // 4. Project and render Asteroids
    game.current.asteroids.forEach(ast => {
      const p = project(ast.x, ast.y, ast.z || 0);
      if (p) {
        const r = ast.size * 10 * p.scale * 0.15;
        if (r > 1.5) {
          ctx.fillStyle = '#27272a';
          ctx.strokeStyle = '#18181b';
          ctx.lineWidth = Math.max(1, 2 * p.scale * 0.1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Craters
          ctx.fillStyle = '#09090b';
          ctx.beginPath();
          ctx.arc(p.x - r * 0.35, p.y - r * 0.15, r * 0.25, 0, Math.PI * 2);
          ctx.arc(p.x + r * 0.4, p.y + r * 0.3, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // 5. Project and render Lasers (3D lines)
    game.current.lasers.forEach(laser => {
      const length = 100;
      const p1 = project(laser.x, laser.y, laser.z || 0);
      const p2 = project(laser.x, laser.y, (laser.z || 0) + length * Math.sign(laser.vz || 1));

      if (p1 && p2) {
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = Math.max(1.5, 4.5 * p1.scale * 0.14);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });

    // 6. Project and render Particles
    game.current.particles.forEach(p => {
      const proj = project(p.x, p.y, p.z || 0);
      if (proj) {
        const lifePct = p.life / p.maxLife;
        const size = Math.max(1, p.size * proj.scale * 0.12);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = lifePct;
        ctx.fillRect(proj.x - size / 2, proj.y - size / 2, size, size);
      }
    });
    ctx.globalAlpha = 1.0;

    // 7. Project and render Fleet Ships (Painter's Algorithm: Sort by Z depth descending)
    const renderShips = [...game.current.ships]
      .filter(s => s.hp > 0)
      .sort((a, b) => {
        const depthA = (a.z || 0) * forwardDir;
        const depthB = (b.z || 0) * forwardDir;
        return depthB - depthA; // Sort by relative depth descending (further away drawn first)
      });

    renderShips.forEach(ship => {
      const p = project(ship.x, ship.y, ship.z || 0);
      if (p) {
        const baseSize = ship.isPlayer ? 46 : 38;
        const projectedSize = baseSize * p.scale * 0.16;

        if (projectedSize > 2) {
          const shipVz = ship.vz || 0;
          // Dynamically calculate orientation based on actual flight velocity direction relative to player's camera facing
          const isFlyingSameDir = Math.abs(shipVz) > 0.5 
            ? (shipVz * forwardDir > 0) 
            : (ship.faction === faction);
          const baseAngle = isFlyingSameDir ? -Math.PI / 2 : Math.PI / 2;

          drawPixelShip(
            ctx,
            p.x,
            p.y,
            projectedSize,
            (ship.roll || 0) + baseAngle,
            ship.defId,
            ship.faction,
            ship.color,
            Math.abs(ship.vx) > 0.3 || Math.abs(ship.vy) > 0.3 || Math.abs(shipVz) > 2
          );

          // Draw health bar
          const hpPct = ship.hp / ship.maxHp;
          const barW = projectedSize * 0.8;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(p.x - barW / 2, p.y - projectedSize * 0.65 - 5, barW, 3.5);

          ctx.fillStyle = ship.faction === 'light' ? '#10b981' : '#ef4444';
          ctx.fillRect(p.x - barW / 2, p.y - projectedSize * 0.65 - 5, barW * hpPct, 2.5);

          // Pilot tags when close
          if (!ship.isPlayer && p.scale > 2.2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = '5px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ship.name.split(' ')[0], p.x, p.y - projectedSize * 0.65 - 9);
          }
        }
      }
    });

    // 8. Draw Player aiming reticle/crosshair at mouse cursor
    ctx.strokeStyle = faction === 'light' ? 'rgba(56, 189, 248, 0.6)' : 'rgba(239, 68, 68, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mousePos.current.x, mousePos.current.y, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = faction === 'light' ? '#38bdf8' : '#ef4444';
    ctx.fillRect(mousePos.current.x - 1, mousePos.current.y - 1, 3, 3);

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

  const respawnShips = faction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
  const selectedRespawnShipDef = [...LIGHT_SHIPS, ...DARK_SHIPS].find(s => s.id === respawnShipId);

  const rankings = getLeaderboard();
  const topPilot = rankings[0];

  const factionScores = getFactionScores();
  const lightRatio = factionScores.lightDeaths === 0 ? factionScores.lightKills * 999 : factionScores.lightKills / factionScores.lightDeaths;
  const darkRatio = factionScores.darkDeaths === 0 ? factionScores.darkKills * 999 : factionScores.darkKills / factionScores.darkDeaths;

  let factionWinnerMsg = 'CONTESTED STANDOFF';
  let factionWinnerColor = 'text-yellow-400';
  
  if (factionScores.lightKills > factionScores.darkKills && lightRatio > darkRatio) {
    factionWinnerMsg = 'LIGHT SIDE WINS (KILLS & RATIO)';
    factionWinnerColor = 'text-emerald-400';
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

      {/* Live Leaderboard Overlay (Galaga Retro style top-right kills/deaths pilot list) */}
      <div className="absolute top-[80px] right-6 z-30 bg-zinc-950/90 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-2 w-[240px] pointer-events-none">
        <span className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase border-b border-zinc-900 pb-1.5 mb-1 text-center">
          LEADERBOARD (TOP 5)
        </span>
        {rankings.slice(0, 5).map((ship, index) => {
          const rank = index + 1;
          const isPlayer = ship.isPlayer;
          return (
            <div key={ship.id} className={`flex justify-between items-center text-[7.5px] font-mono leading-none ${isPlayer ? 'text-sky-400 font-bold' : 'text-zinc-400'}`}>
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
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 text-[8px] text-zinc-650 font-bold uppercase tracking-widest pointer-events-none">
        Press <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">ESC</kbd> to Pause | Move: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">ZQSD</kbd> | Shoot: <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">LEFT CLICK / A / I</kbd>
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

            <div className="text-[9px] text-zinc-650 uppercase tracking-wider text-center mt-2 border-t border-zinc-900 pt-4 w-full">
              USE <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-855">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-855">↓</kbd> OR MOUSE TO SELECT
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
              <p className="text-[8px] text-zinc-650 font-mono uppercase tracking-widest mt-0.5">
                Light Ratio: {(factionScores.lightDeaths === 0 ? factionScores.lightKills : (factionScores.lightKills / factionScores.lightDeaths)).toFixed(2)} | Dark Ratio: {(factionScores.darkDeaths === 0 ? factionScores.darkKills : (factionScores.darkKills / factionScores.darkDeaths)).toFixed(2)}
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
