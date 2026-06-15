import React, { useRef, useEffect, useState } from 'react';
import { Faction, SpaceShip, Laser, Particle, Asteroid, GameState, ShipDef } from '../types/space';
import { drawPixelShip } from '../utils/shipRenderer';
import { LIGHT_SHIPS, DARK_SHIPS, getShipDefById } from '../utils/spaceShips';
import { Swords, Shield, Zap, RefreshCw, Skull, Star, Play } from 'lucide-react';

interface SpaceCanvasProps {
  faction: Faction;
  selectedShipId: string;
  onGameOver: (score: number, kills: number) => void;
  onExit: () => void;
}

const WORLD_SIZE = 4000;
const INITIAL_ASTEROIDS = 25;
const INITIAL_ALLIES = 6;
const INITIAL_ENEMIES = 8;
const LASER_SPEED = 14;

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
    alliesCount: 0,
    enemiesCount: 0,
    speed: 0
  });

  const [isDead, setIsDead] = useState(false);

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
  const starsBackground = useRef<{ x: number; y: number; size: number; speed: number }[]>([]);
  const nebulas = useRef<{ x: number; y: number; r: number; color: string }[]>([]);

  // Initialize background starfields once
  useEffect(() => {
    // Stars layers
    const stars: { x: number; y: number; size: number; speed: number }[] = [];
    for (let i = 0; i < 350; i++) {
      stars.push({
        x: Math.random() * 2000, // repeated tiling coordinates
        y: Math.random() * 2000,
        size: Math.random() < 0.25 ? 2.0 : 1.0,
        speed: Math.random() < 0.3 ? 0.35 : 0.15 // Parallax speeds
      });
    }
    starsBackground.current = stars;

    // Nebulas
    nebulas.current = [
      { x: 800, y: 800, r: 400, color: 'rgba(99, 102, 241, 0.08)' }, // Purple
      { x: 2800, y: 1200, r: 600, color: 'rgba(239, 68, 68, 0.06)' }, // Red
      { x: 1500, y: 3000, r: 500, color: 'rgba(16, 185, 129, 0.06)' }, // Green
      { x: 3200, y: 2800, r: 450, color: 'rgba(14, 165, 233, 0.08)' }  // Blue
    ];
  }, []);

  // Helper to generate a random ship from a faction
  const createRandomAiShip = (fact: Faction, isAlly: boolean): SpaceShip => {
    const list = fact === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
    const def = list[Math.floor(Math.random() * list.length)];
    
    // Spawn around player
    const px = game.current.playerShip?.x || WORLD_SIZE / 2;
    const py = game.current.playerShip?.y || WORLD_SIZE / 2;
    
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 800; // Spawns offscreen

    const x = Math.max(100, Math.min(WORLD_SIZE - 100, px + Math.cos(angle) * dist));
    const y = Math.max(100, Math.min(WORLD_SIZE - 100, py + Math.sin(angle) * dist));

    return {
      id: `ai_${fact}_${Math.random().toString(36).substr(2, 9)}`,
      defId: def.id,
      name: `${isAlly ? 'Ally' : 'Enemy'} ${def.name.split(' ')[0]}`,
      faction: fact,
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      angle: Math.random() * Math.PI * 2,
      hp: def.stats.shield,
      maxHp: def.stats.shield,
      lastShotTime: 0,
      isPlayer: false,
      stats: def.stats,
      color: def.color,
      aiState: 'patrol',
      aiDecisionTimer: 0
    };
  };

  // Helper to trigger particles
  const spawnExplosion = (x: number, y: number, color: string, count = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      game.current.particles.push({
        id: `p_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.floor(Math.random() * 20),
        maxLife: 50,
        color,
        size: 1.5 + Math.random() * 3
      });
    }
  };

  // Start / Reset Space Match
  const initGame = () => {
    const playerDef = getShipDefById(selectedShipId)!;
    
    // 1. Create player
    const player: SpaceShip = {
      id: 'player',
      defId: selectedShipId,
      name: playerDef.name,
      faction: faction,
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: playerDef.stats.shield,
      maxHp: playerDef.stats.shield,
      lastShotTime: 0,
      isPlayer: true,
      stats: playerDef.stats,
      color: playerDef.color
    };

    game.current.playerShip = player;
    game.current.ships = [player];
    game.current.lasers = [];
    game.current.particles = [];
    game.current.score = 0;
    game.current.kills = 0;
    setIsDead(false);

    // 2. Spawn Asteroids
    const asteroids: Asteroid[] = [];
    for (let i = 0; i < INITIAL_ASTEROIDS; i++) {
      asteroids.push({
        id: `ast_${i}`,
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 3, // Start large
        hp: 40
      });
    }
    game.current.asteroids = asteroids;

    // 3. Spawn initial Fleet AI
    const oppFaction = faction === 'light' ? 'dark' : 'light';
    
    for (let i = 0; i < INITIAL_ALLIES; i++) {
      game.current.ships.push(createRandomAiShip(faction, true));
    }
    for (let i = 0; i < INITIAL_ENEMIES; i++) {
      game.current.ships.push(createRandomAiShip(oppFaction, false));
    }
  };

  // Trigger setup on mount
  useEffect(() => {
    initGame();
  }, [faction, selectedShipId]);

  // Set keyboard / mouse listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, []);

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
  }, []);

  // Physics Updates
  const updateGamePhysics = () => {
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
      const accel = 0.35; // Thruster acceleration

      // ZQSD movement (absolute movement Twin-Stick style)
      // W / Z: Up, S: Down, A / Q: Left, D: Right
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
      player.vx *= 0.95;
      player.vy *= 0.95;

      // Speed clamp
      const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      if (currentSpeed > player.stats.speed) {
        player.vx = (player.vx / currentSpeed) * player.stats.speed;
        player.vy = (player.vy / currentSpeed) * player.stats.speed;
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
          vx: Math.cos(flameAngle) * 3 + player.vx,
          vy: Math.sin(flameAngle) * 3 + player.vy,
          life: 10 + Math.floor(Math.random() * 10),
          maxLife: 20,
          color: player.faction === 'light' ? '#38bdf8' : '#ef4444',
          size: 1 + Math.random() * 2
        });
      }

      // Shoot trigger
      if (isMouseDown.current) {
        const now = Date.now();
        if (now - player.lastShotTime >= player.stats.rate) {
          fireLaser(player);
          player.lastShotTime = now;
        }
      }
    }

    // --- 3. Update AI Fleet Ships ---
    state.ships.forEach(ship => {
      if (ship.isPlayer) return;
      if (ship.hp <= 0) return;

      // AI decision tick
      if (!ship.aiDecisionTimer) ship.aiDecisionTimer = 0;
      ship.aiDecisionTimer -= 1;

      if (ship.aiDecisionTimer <= 0) {
        ship.aiDecisionTimer = 20 + Math.floor(Math.random() * 30); // recalculate every 0.5s

        // 1. Scan for nearest target of opposite faction
        let nearestTarget: SpaceShip | null = null;
        let minDist = 900; // Agro range

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

          // Steer towards target gradually
          const targetAngle = Math.atan2(dy, dx);
          let diff = targetAngle - ship.angle;
          // Normalize diff [-PI, PI]
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          ship.angle += diff * 0.1; // Slerp speed

          // Thruster acceleration
          const accelSpeed = ship.stats.speed * 0.08;
          if (dist > 250) {
            ship.vx += Math.cos(ship.angle) * accelSpeed;
            ship.vy += Math.sin(ship.angle) * accelSpeed;
          } else if (dist < 120) {
            // Back up
            ship.vx -= Math.cos(ship.angle) * accelSpeed;
            ship.vy -= Math.sin(ship.angle) * accelSpeed;
          }

          // Random strafing
          if (Math.random() < 0.05) {
            ship.vx += Math.cos(ship.angle + Math.PI / 2) * (Math.random() - 0.5) * 3;
            ship.vy += Math.sin(ship.angle + Math.PI / 2) * (Math.random() - 0.5) * 3;
          }

          // Shoot AI weapon
          const now = Date.now();
          if (dist < ship.stats.range && Math.abs(diff) < 0.45 && now - ship.lastShotTime >= ship.stats.rate * (1.2 + Math.random() * 0.5)) {
            fireLaser(ship);
            ship.lastShotTime = now;
          }
        }
      } else {
        // Patrol / Drift randomly
        if (Math.random() < 0.02) {
          ship.angle += (Math.random() - 0.5) * 1.5;
        }
        const speed = ship.stats.speed * 0.3;
        ship.vx += Math.cos(ship.angle) * 0.15;
        ship.vy += Math.sin(ship.angle) * 0.15;
      }

      // Physics integration
      ship.vx *= 0.95;
      ship.vy *= 0.95;
      const spd = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      if (spd > ship.stats.speed) {
        ship.vx = (ship.vx / spd) * ship.stats.speed;
        ship.vy = (ship.vy / spd) * ship.stats.speed;
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
        if (ship.hp <= 0) continue;
        // Do not friendly fire
        if (ship.faction === laser.faction && !ship.isPlayer) continue; // AI ignores allies. Player can't shoot allies.
        if (ship.isPlayer && laser.faction === player.faction) continue; // player doesn't friendly fire own lasers

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
            spawnExplosion(ship.x, ship.y, '#eab308', 35); // Yellow core explosion
            spawnExplosion(ship.x, ship.y, '#f97316', 25); // Orange secondary

            if (ship.isPlayer) {
              setIsDead(true);
            } else {
              // Award score/kills
              const killer = state.ships.find(s => s.id === laser.ownerId);
              if (killer?.isPlayer) {
                state.kills += 1;
                state.score += ship.stats.shield * 10;
              }
              
              // Respawn new AI ship offscreen to keep fleet count
              setTimeout(() => {
                state.ships.push(createRandomAiShip(ship.faction, ship.faction === faction));
              }, 4000);
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

          // Sparks
          spawnExplosion(laser.x, laser.y, '#78350f', 5);

          if (ast.hp <= 0) {
            // Break asteroid
            spawnExplosion(ast.x, ast.y, '#9ca3af', 15);
            
            if (ast.size > 1) {
              // Spawn 2 smaller chunks
              const newSize = ast.size - 1;
              state.asteroids.push(
                {
                  id: `ast_${ast.id}_1`,
                  x: ast.x + (Math.random() - 0.5) * 20,
                  y: ast.y + (Math.random() - 0.5) * 20,
                  vx: ast.vx + (Math.random() - 0.5) * 2,
                  vy: ast.vy + (Math.random() - 0.5) * 2,
                  size: newSize,
                  hp: newSize * 15
                },
                {
                  id: `ast_${ast.id}_2`,
                  x: ast.x + (Math.random() - 0.5) * 20,
                  y: ast.y + (Math.random() - 0.5) * 20,
                  vx: ast.vx + (Math.random() - 0.5) * 2,
                  vy: ast.vy + (Math.random() - 0.5) * 2,
                  size: newSize,
                  hp: newSize * 15
                }
              );
            }
            // Add score
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
        if (ship.hp <= 0) return;
        const dx = ship.x - ast.x;
        const dy = ship.y - ast.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = ast.size * 12 + 16;

        if (dist < radius) {
          // Bounce ship back a bit
          const pushAngle = Math.atan2(dy, dx);
          ship.x += Math.cos(pushAngle) * 5;
          ship.y += Math.sin(pushAngle) * 5;
          ship.vx += Math.cos(pushAngle) * 2;
          ship.vy += Math.sin(pushAngle) * 2;

          // Damage ship slightly
          ship.hp = Math.max(0, ship.hp - ast.size * 3);
          
          if (ship.isPlayer) {
            screenShake.current = { duration: 10, amplitude: 4 };
            if (ship.hp <= 0) setIsDead(true);
          }
        }
      });
    });

    // Clean up dead/exhausted asteroids
    state.asteroids = state.asteroids.filter(a => a.hp > 0);

    // --- 6. Update Particles ---
    state.particles = state.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      return p.life > 0;
    });

    // Clean up dead ships
    state.ships = state.ships.filter(s => s.isPlayer || s.hp > 0);

    // --- 7. Sync HUD details ---
    setHud({
      hp: player.hp,
      maxHp: player.maxHp,
      score: state.score,
      kills: state.kills,
      alliesCount: state.ships.filter(s => s.faction === faction && !s.isPlayer).length,
      enemiesCount: state.ships.filter(s => s.faction !== faction).length,
      speed: Math.round(Math.sqrt(player.vx * player.vx + player.vy * player.vy) * 10)
    });
  };

  // Launch a laser shot
  const fireLaser = (ship: SpaceShip) => {
    const state = game.current;
    
    // Millennium Falcon has dual turrets!
    if (ship.defId === 'falcon') {
      // Shoot two parallel lasers offset left/right
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
      // Standard single shot
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

    // Camera center offset (relative to player)
    const player = game.current.playerShip;
    if (!player) {
      ctx.restore();
      return;
    }

    const offsetX = canvas.width / 2 - player.x;
    const offsetY = canvas.height / 2 - player.y;

    // 1. Draw Space Void (Dark background)
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Nebula clouds
    nebulas.current.forEach(neb => {
      const sx = neb.x + offsetX;
      const sy = neb.y + offsetY;
      
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, neb.r);
      grad.addColorStop(0, neb.color);
      grad.addColorStop(1, 'rgba(5, 5, 8, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, neb.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Parallax Starfield
    ctx.fillStyle = '#ffffff';
    starsBackground.current.forEach(star => {
      // Parallax scroll: offset is modulated by camera position multiplied by speed
      const sx = ((star.x - player.x * star.speed) % canvas.width + canvas.width) % canvas.width;
      const sy = ((star.y - player.y * star.speed) % canvas.height + canvas.height) % canvas.height;
      
      ctx.fillRect(sx, sy, star.size, star.size);
    });

    // 4. Draw World Boundary Fence
    ctx.strokeStyle = faction === 'light' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(offsetX, offsetY, WORLD_SIZE, WORLD_SIZE);

    // 5. Draw Asteroids
    game.current.asteroids.forEach(ast => {
      const sx = ast.x + offsetX;
      const sy = ast.y + offsetY;
      const r = ast.size * 12;

      // Draw rocky circle
      ctx.fillStyle = '#374151';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Craters details
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(sx - r * 0.3, sy - r * 0.2, r * 0.2, 0, Math.PI * 2);
      ctx.arc(sx + r * 0.4, sy + r * 0.3, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Draw Lasers
    game.current.lasers.forEach(laser => {
      const sx = laser.x + offsetX;
      const sy = laser.y + offsetY;

      ctx.strokeStyle = laser.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Draw standard tail lines
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - (laser.vx / LASER_SPEED) * 16, sy - (laser.vy / LASER_SPEED) * 16);
      ctx.stroke();
    });

    // 7. Draw Fleet Ships (AI & Player)
    game.current.ships.forEach(ship => {
      if (ship.hp <= 0) return;
      const sx = ship.x + offsetX;
      const sy = ship.y + offsetY;

      // Draw custom pixel model
      drawPixelShip(
        ctx,
        sx,
        sy,
        ship.isPlayer ? 24 : 20,
        ship.angle,
        ship.defId,
        ship.faction,
        ship.color,
        Math.abs(ship.vx) > 0.5 || Math.abs(ship.vy) > 0.5
      );

      // Draw mini health bar above AI ships
      if (!ship.isPlayer) {
        const hpPct = ship.hp / ship.maxHp;
        const barW = 28;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(sx - barW / 2, sy - 22, barW, 4);

        ctx.fillStyle = ship.faction === 'light' ? '#10b981' : '#ef4444';
        ctx.fillRect(sx - barW / 2, sy - 22, barW * hpPct, 3);
      }
    });

    // 8. Draw Particles
    game.current.particles.forEach(p => {
      const sx = p.x + offsetX;
      const sy = p.y + offsetY;
      const lifePct = p.life / p.maxLife;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = lifePct;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1.0;

    // 9. Draw HUD locator markers for offscreen targets
    game.current.ships.forEach(ship => {
      if (ship.isPlayer || ship.hp <= 0) return;
      
      const dx = ship.x - player.x;
      const dy = ship.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only draw locator pointers for off-screen ships within reasonable proximity (1500px)
      if (dist > canvas.width / 2 && dist < 1800) {
        const angle = Math.atan2(dy, dx);
        
        // Project onto border of screen
        const margin = 24;
        const rx = canvas.width / 2 + Math.cos(angle) * (canvas.width / 2 - margin);
        const ry = canvas.height / 2 + Math.sin(angle) * (canvas.height / 2 - margin);

        // Draw small pointer arrow
        ctx.fillStyle = ship.faction === 'light' ? '#10b981' : '#ef4444';
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-4, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore(); // end screen shake
  };

  const handleRespawn = () => {
    initGame();
  };

  const shieldPercent = (hud.hp / hud.maxHp) * 100;

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* HUD Bar */}
      <div className="w-full max-w-[760px] flex items-center justify-between px-4 py-2 bg-zinc-950/80 border border-zinc-850 rounded-xl text-xs font-semibold tracking-wide backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-mono text-zinc-400">
            SCORE: <span className="text-white font-bold">{hud.score}</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-zinc-400">
            KILLS: <span className="text-emerald-400 font-bold">{hud.kills}</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase">
          <span className="flex items-center gap-1 text-emerald-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Allies: {hud.alliesCount}
          </span>
          <span className="flex items-center gap-1 text-rose-500/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Enemies: {hud.enemiesCount}
          </span>
          <span className="text-zinc-400">
            Thruster: {hud.speed} km/s
          </span>
        </div>
      </div>

      {/* Screen Frame */}
      <div className="relative border-4 border-zinc-800 bg-[#020205] rounded-3xl overflow-hidden shadow-2xl w-full max-w-[760px] aspect-[4/3] flex flex-col">
        <canvas
          ref={canvasRef}
          width={750}
          height={560}
          className="w-full h-full cursor-crosshair"
        />

        {/* Shield Bar Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[220px] bg-zinc-950/90 border border-zinc-800 rounded-full px-3 py-1 flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <Shield className={`w-3.5 h-3.5 ${faction === 'light' ? 'text-emerald-400' : 'text-rose-500'}`} />
          <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${
                faction === 'light' ? 'bg-emerald-500' : 'bg-rose-600'
              }`}
              style={{ width: `${shieldPercent}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-white">{hud.hp}</span>
        </div>

        {/* Death overlay screen */}
        {isDead && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 gap-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
              <Skull className="w-8 h-8" />
            </div>

            <div className="text-center flex flex-col gap-1.5">
              <h2 className="text-xl font-extrabold uppercase tracking-widest text-white font-display">
                STARFIGHTER FAINTED
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Final Kills: {hud.kills} | Score: {hud.score}
              </p>
            </div>

            <div className="flex gap-3 w-full max-w-[280px]">
              <button
                onClick={onExit}
                className="flex-1 py-2.5 px-4 border border-zinc-850 hover:border-zinc-700 bg-zinc-900 text-[10px] font-bold text-zinc-400 rounded-xl transition-all"
              >
                SELECT SHIP
              </button>
              <button
                onClick={handleRespawn}
                className={`flex-1 py-2.5 px-4 text-[10px] font-bold text-white rounded-xl transition-all ${
                  faction === 'light'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                }`}
              >
                RESPAWN FIGHTER
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Instruction Pill */}
      <div className="flex flex-col gap-1 items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 w-full max-w-[760px]">
        <div className="flex items-center justify-center gap-6 text-zinc-500 font-mono text-[9px] font-semibold uppercase tracking-widest">
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px]">ZQSD</kbd> Navigation</span>
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px]">MOUSE MOVEMENT</kbd> Viser</span>
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px]">LEFT CLICK</kbd> Tirer Laser</span>
        </div>
      </div>
    </div>
  );
};
