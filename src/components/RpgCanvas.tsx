import React, { useRef, useEffect, useState } from 'react';
import { WorldMapState, Player, Direction, NPC, Chest, TileType } from '../types/rpg';
import { Swords, Compass, HelpCircle, X, ChevronRight } from 'lucide-react';

interface RpgCanvasProps {
  mapState: WorldMapState;
  playerState: Player;
  onUpdatePlayer: (updater: (prev: Player) => Player) => void;
  onTriggerBattle: (enemyType: string, level: number, name: string, isTrainer: boolean, npcId?: string) => void;
  onOpenChest: (chestId: string, rewardMsg: string, rewardType: string) => void;
  onToggleMap: () => void;
  onShowNotification: (msg: string) => void;
}

const TILE_SIZE = 32;
const VIEW_WIDTH = 15; // 15x15 viewport
const VIEW_HEIGHT = 15;

export const RpgCanvas: React.FC<RpgCanvasProps> = ({
  mapState,
  playerState,
  onUpdatePlayer,
  onTriggerBattle,
  onOpenChest,
  onToggleMap,
  onShowNotification
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Input keys tracking
  const keysPressed = useRef<Record<string, boolean>>({});
  
  // Dialogue state
  const [activeDialogue, setActiveDialogue] = useState<{
    speaker: string;
    lines: string[];
    lineIndex: number;
  } | null>(null);

  // Smooth camera positions
  const camera = useRef({ x: playerState.x * TILE_SIZE, y: playerState.y * TILE_SIZE });

  // Animation ticks
  const animTicks = useRef(0);
  const animFrame = useRef(0);

  // Handle interaction check (NPCs or Chests in front of player)
  const checkInteraction = () => {
    if (activeDialogue) {
      // Advance dialogue
      if (activeDialogue.lineIndex < activeDialogue.lines.length - 1) {
        setActiveDialogue(prev => prev ? { ...prev, lineIndex: prev.lineIndex + 1 } : null);
      } else {
        // Dialogue finished
        const npc = mapState.npcs.find(n => n.name === activeDialogue.speaker);
        setActiveDialogue(null);
        
        // If NPC is a trainer and not defeated, start the battle!
        if (npc && npc.isTrainer && !npc.defeated) {
          // Find the level of the trainer's monster based on player's level
          const monLevel = npc.monsterType === 'q' ? 4 : npc.monsterType === 'r' ? 3 : 2;
          onTriggerBattle(npc.monsterType || 'n', monLevel, npc.name, true, npc.id);
        }
      }
      return;
    }

    // Determine target coordinate in front of the player
    let tx = playerState.x;
    let ty = playerState.y;
    switch (playerState.dir) {
      case 'up': ty -= 1; break;
      case 'down': ty += 1; break;
      case 'left': tx -= 1; break;
      case 'right': tx += 1; break;
    }

    // Check Chest
    const chest = mapState.chests.find(c => c.x === tx && c.y === ty);
    if (chest && !chest.opened) {
      onOpenChest(chest.id, chest.rewardMessage, chest.rewardType);
      return;
    }

    // Check NPC
    const npc = mapState.npcs.find(n => n.x === tx && n.y === ty);
    if (npc) {
      setActiveDialogue({
        speaker: npc.name,
        lines: npc.dialogue,
        lineIndex: 0
      });
    }
  };

  // Setup Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      // Prevent standard page scroll on arrow/space
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      keysPressed.current[code] = true;

      // Interaction key: E or Enter
      if (code === 'KeyE' || code === 'Enter') {
        checkInteraction();
      }

      // Map key: C
      if (code === 'KeyC' && !activeDialogue) {
        onToggleMap();
      }

      // Jump key: Space
      if (code === 'Space' && !playerState.isMoving && !playerState.isJumping && !activeDialogue) {
        onUpdatePlayer(prev => ({
          ...prev,
          isJumping: true,
          jumpProgress: 0
        }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerState, activeDialogue]);

  // Main RPG Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameTick = () => {
      // 1. Process movement if not currently translating
      if (!playerState.isMoving && !activeDialogue) {
        let dx = 0;
        let dy = 0;
        let targetDir: Direction = playerState.dir;

        // Support ZQSD and WASD
        if (keysPressed.current['KeyW'] || keysPressed.current['KeyZ'] || keysPressed.current['ArrowUp']) {
          dy = -1; targetDir = 'up';
        } else if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
          dy = 1; targetDir = 'down';
        } else if (keysPressed.current['KeyA'] || keysPressed.current['KeyQ'] || keysPressed.current['ArrowLeft']) {
          dx = -1; targetDir = 'left';
        } else if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
          dx = 1; targetDir = 'right';
        }

        if (dx !== 0 || dy !== 0) {
          // Set direction
          onUpdatePlayer(prev => ({ ...prev, dir: targetDir }));

          const tx = playerState.x + dx;
          const ty = playerState.y + dy;

          // Check bounds
          if (tx >= 0 && tx < mapState.width && ty >= 0 && ty < mapState.height) {
            const targetTile = mapState.grid[ty][tx];
            const currentTile = mapState.grid[playerState.y][playerState.x];
            
            // Ledge check (Can only jump down - direction must be 'down' or y-movement positive)
            const isLedgeJump = targetTile.isLedge && targetDir === 'down';
            
            // Check collisions
            let isWalkable = !targetTile.solid;

            // Ramps allow entering mountain layers. Mountains are solid by default.
            // If climbing onto a mountain, check if current tile is ramp/mountain, or target is ramp
            if (targetTile.type === 'mountain') {
              isWalkable = currentTile.type === 'mountain' || currentTile.type === 'ramp';
            }

            // Mountain tile to plain tile: allowed only via ramps or ledges
            if (currentTile.type === 'mountain' && targetTile.type !== 'mountain' && targetTile.type !== 'ramp') {
              // Can only leave via ledge going down
              isWalkable = isLedgeJump;
            }

            // Blocked by NPCs or Chests
            const hasNpc = mapState.npcs.some(n => n.x === tx && n.y === ty);
            const hasChest = mapState.chests.some(c => c.x === tx && c.y === ty);
            if (hasNpc || hasChest) {
              isWalkable = false;
            }

            if (isWalkable) {
              if (isLedgeJump) {
                // Ledge Jump: hops 2 tiles down, enters jumping state
                onUpdatePlayer(prev => ({
                  ...prev,
                  isMoving: true,
                  moveProgress: 0,
                  isJumping: true,
                  jumpProgress: 0,
                  y: prev.y + 2 // Land 2 tiles down
                }));
              } else {
                // Regular walk
                onUpdatePlayer(prev => ({
                  ...prev,
                  isMoving: true,
                  moveProgress: 0,
                  x: prev.x + dx,
                  y: prev.y + dy
                }));
              }
            }
          }
        }
      }

      // 2. Interpolate movement progress
      if (playerState.isMoving) {
        onUpdatePlayer(prev => {
          const nextProgress = prev.moveProgress + 0.125; // Speed multiplier (1/8 steps)
          if (nextProgress >= 1) {
            // Finished step
            // Tall grass battle roll (10% chance)
            const currentTile = mapState.grid[prev.y][prev.x];
            if (currentTile.type === 'tall_grass' && Math.random() < 0.1) {
              // Roll wild pokemon encounter
              onTriggerBattle('p', 1, 'Wild Monster', false);
            }
            return {
              ...prev,
              isMoving: false,
              moveProgress: 0,
              isJumping: false,
              jumpProgress: 0
            };
          }
          return {
            ...prev,
            moveProgress: nextProgress,
            jumpProgress: prev.isJumping ? nextProgress : 0
          };
        });
      }

      // 3. Handle manual jumping progress
      if (playerState.isJumping && !playerState.isMoving) {
        onUpdatePlayer(prev => {
          const nextJump = prev.jumpProgress + 0.1;
          if (nextJump >= 1) {
            return { ...prev, isJumping: false, jumpProgress: 0 };
          }
          return { ...prev, jumpProgress: nextJump };
        });
      }

      // 4. Update animation frames
      animTicks.current += 1;
      if (animTicks.current >= 8) {
        animTicks.current = 0;
        animFrame.current = (animFrame.current + 1) % 4;
      }

      // Render loop call
      renderCanvas();

      animationFrameId = requestAnimationFrame(gameTick);
    };

    gameTick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerState, mapState, activeDialogue]);

  // Procedural Pixel Drawing Engine
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pixelated rendering filter
    ctx.imageSmoothingEnabled = false;

    // Clear Screen
    ctx.fillStyle = '#07070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate Interpolated Player Screen Position
    let playerPixelX = playerState.x * TILE_SIZE;
    let playerPixelY = playerState.y * TILE_SIZE;

    if (playerState.isMoving) {
      const dx = playerState.dir === 'left' ? 1 : playerState.dir === 'right' ? -1 : 0;
      const dy = playerState.dir === 'up' ? 1 : playerState.dir === 'down' ? -1 : 0;
      const offset = (1 - playerState.moveProgress) * TILE_SIZE;
      
      // If ledge jump, movement covers 2 tiles (64px) instead of 32px
      const isLedgeJump = playerState.isJumping && playerState.dir === 'down';
      const stride = isLedgeJump ? TILE_SIZE * 2 : TILE_SIZE;

      playerPixelX += dx * (1 - playerState.moveProgress) * TILE_SIZE;
      playerPixelY += dy * (1 - playerState.moveProgress) * stride;
    }

    // Camera follow (ease toward player)
    camera.current.x += (playerPixelX - camera.current.x) * 0.15;
    camera.current.y += (playerPixelY - camera.current.y) * 0.15;

    // Drawing offsets to center camera in viewport
    const offsetX = canvas.width / 2 - camera.current.x - TILE_SIZE / 2;
    const offsetY = canvas.height / 2 - camera.current.y - TILE_SIZE / 2;

    // Define rendering bounds (viewport clipping)
    const minCol = Math.max(0, Math.floor((camera.current.x - canvas.width / 2) / TILE_SIZE));
    const maxCol = Math.min(mapState.width - 1, Math.ceil((camera.current.x + canvas.width / 2) / TILE_SIZE));
    const minRow = Math.max(0, Math.floor((camera.current.y - canvas.height / 2) / TILE_SIZE));
    const maxRow = Math.min(mapState.height - 1, Math.ceil((camera.current.y + canvas.height / 2) / TILE_SIZE));

    // 1. Draw Tile Map layers
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = mapState.grid[r][c];
        const sx = c * TILE_SIZE + offsetX;
        const sy = r * TILE_SIZE + offsetY;

        // Draw Base tile
        ctx.fillStyle = tile.color;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Draw details overlay
        if (tile.type === 'grass') {
          // Tiny grass pixel blades
          ctx.fillStyle = '#059669';
          ctx.fillRect(sx + 6, sy + 8, 2, 4);
          ctx.fillRect(sx + 20, sy + 22, 2, 4);
          ctx.fillRect(sx + 14, sy + 14, 2, 4);
        } else if (tile.type === 'tall_grass') {
          // Lush tall leaves
          ctx.fillStyle = '#065f46';
          ctx.fillRect(sx + 4, sy + 4, 6, 24);
          ctx.fillRect(sx + 14, sy + 8, 6, 20);
          ctx.fillRect(sx + 24, sy + 4, 4, 24);
          ctx.fillStyle = '#34d399';
          ctx.fillRect(sx + 6, sy + 6, 2, 20);
          ctx.fillRect(sx + 16, sy + 10, 2, 16);
          ctx.fillRect(sx + 26, sy + 6, 2, 20);
        } else if (tile.type === 'water') {
          // Wavy lines
          ctx.fillStyle = '#0369a1';
          const waveShift = Math.floor(Date.now() / 300) % 8;
          ctx.fillRect(sx + waveShift, sy + 8, 8, 2);
          ctx.fillRect(sx + ((waveShift + 16) % 32), sy + 22, 8, 2);
        } else if (tile.type === 'bridge') {
          // Planks
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 2, sy, 28, TILE_SIZE);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 2, sy + 6, 28, 2);
          ctx.fillRect(sx + 2, sy + 18, 28, 2);
        } else if (tile.type === 'mountain') {
          // Rocky textures
          ctx.fillStyle = '#374151';
          ctx.fillRect(sx + 2, sy + 2, 28, 28);
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(sx + 2, sy + 28, 28, 4);
          ctx.fillRect(sx + 28, sy + 2, 4, 28);
        } else if (tile.type === 'ledge') {
          // Shaded ledge line
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(sx, sy, TILE_SIZE, 12);
          ctx.fillStyle = '#374151';
          ctx.fillRect(sx, sy + 12, TILE_SIZE, 8);
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(sx, sy + 20, TILE_SIZE, 4);
        } else if (tile.type === 'dirt') {
          // Sandy spots
          ctx.fillStyle = '#d97706';
          ctx.fillRect(sx + 4, sy + 6, 2, 2);
          ctx.fillRect(sx + 20, sy + 18, 2, 2);
        }
      }
    }

    // 2. Draw Trees & Objects
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = mapState.grid[r][c];
        const sx = c * TILE_SIZE + offsetX;
        const sy = r * TILE_SIZE + offsetY;

        if (tile.type === 'tree') {
          // Tree shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(sx + 6, sy + 24, 20, 8);

          // Trunk
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 13, sy + 16, 6, 12);

          // Leaves (glowing/shaded)
          ctx.fillStyle = '#065f46';
          ctx.beginPath();
          ctx.arc(sx + 16, sy + 12, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(sx + 13, sy + 9, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Draw Chests
    mapState.chests.forEach(chest => {
      if (chest.y >= minRow && chest.y <= maxRow && chest.x >= minCol && chest.x <= maxCol) {
        const sx = chest.x * TILE_SIZE + offsetX;
        const sy = chest.y * TILE_SIZE + offsetY;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(sx + 4, sy + 20, 24, 8);

        if (chest.opened) {
          // Open Chest
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 4, sy + 12, 24, 12);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 4, sy + 4, 24, 6);
          // Golden rewards showing
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx + 8, sy + 10, 16, 4);
        } else {
          // Closed Chest
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 4, sy + 8, 24, 16);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 4, sy + 8, 24, 4);
          // Golden lock latch
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx + 14, sy + 14, 4, 6);
        }
      }
    });

    // 4. Draw NPCs
    mapState.npcs.forEach(npc => {
      if (npc.y >= minRow && npc.y <= maxRow && npc.x >= minCol && npc.x <= maxCol) {
        const sx = npc.x * TILE_SIZE + offsetX;
        const sy = npc.y * TILE_SIZE + offsetY;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(sx + 16, sy + 28, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw NPC body/hat based on sprite type
        if (npc.sprite === 'trainer') {
          // Head
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(sx + 11, sy + 8, 10, 10);
          // Hair
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 10, sy + 6, 12, 4);
          // Red trainer bandana/cap
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(sx + 9, sy + 2, 14, 4);
          // Body/Shirt
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(sx + 10, sy + 18, 12, 10);
        } else if (npc.sprite === 'old_man') {
          // Old oak head
          ctx.fillStyle = '#ffedd5';
          ctx.fillRect(sx + 11, sy + 8, 10, 10);
          // White hair/beard
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(sx + 9, sy + 8, 2, 12);
          ctx.fillRect(sx + 21, sy + 8, 2, 12);
          ctx.fillRect(sx + 11, sy + 16, 10, 4);
          // Body/Coat
          ctx.fillStyle = '#065f46';
          ctx.fillRect(sx + 10, sy + 18, 12, 10);
        } else {
          // Standard villager
          ctx.fillStyle = '#fbcfe8';
          ctx.fillRect(sx + 11, sy + 8, 10, 10);
          ctx.fillStyle = '#a21caf';
          ctx.fillRect(sx + 10, sy + 18, 12, 10);
        }

        // Trainer icon marker if undefeated trainer
        if (npc.isTrainer && !npc.defeated) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(sx + 16, sy - 8);
          ctx.lineTo(sx + 20, sy - 14);
          ctx.lineTo(sx + 12, sy - 14);
          ctx.closePath();
          ctx.fill();
        }
      }
    });

    // 5. Draw Player Character (with jumping bounce/glide offset)
    const px = canvas.width / 2 - TILE_SIZE / 2;
    let py = canvas.height / 2 - TILE_SIZE / 2;

    // Apply Parabolic Jump curve
    if (playerState.isJumping) {
      const x = playerState.jumpProgress;
      // Parabola: h = -4 * max_height * (x - 0.5)^2 + max_height
      const maxHeight = 20; // pixels
      const jumpOffset = -4 * maxHeight * (x - 0.5) * (x - 0.5) + maxHeight;
      py -= jumpOffset;
    }

    // Shadow during jump
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 16, canvas.height / 2 + 12, playerState.isJumping ? 5 : 8, playerState.isJumping ? 2 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Player clothing
    // Face Skin
    ctx.fillStyle = '#ffedd5';
    ctx.fillRect(px + 11, py + 6, 10, 10);

    // Red cap
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(px + 9, py + 2, 14, 5); // Crown
    // Visor direction
    if (playerState.dir === 'right') {
      ctx.fillRect(px + 17, py + 5, 8, 2);
    } else if (playerState.dir === 'left') {
      ctx.fillRect(px + 7, py + 5, 8, 2);
    } else if (playerState.dir === 'down') {
      ctx.fillRect(px + 11, py + 5, 10, 2);
    }

    // Blue Jacket/Shirt
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(px + 10, py + 16, 12, 10);

    // Backpack (Left profile / Right profile / Up)
    ctx.fillStyle = '#b45309';
    if (playerState.dir === 'left') {
      ctx.fillRect(px + 18, py + 14, 4, 8);
    } else if (playerState.dir === 'right') {
      ctx.fillRect(px + 10, py + 14, 4, 8);
    } else if (playerState.dir === 'up') {
      ctx.fillRect(px + 11, py + 14, 10, 6);
    }

    // Walking animation feet/pants
    ctx.fillStyle = '#1e293b'; // dark blue pants
    const walkOffset = playerState.isMoving ? Math.floor(animFrame.current / 2) % 2 : 0;
    
    if (walkOffset === 0) {
      ctx.fillRect(px + 11, py + 26, 4, 4); // Left leg
      ctx.fillRect(px + 17, py + 26, 4, 4); // Right leg
    } else {
      ctx.fillRect(px + 11, py + 25, 4, 5); // Gliding steps
      ctx.fillRect(px + 17, py + 25, 4, 5);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Game Window container */}
      <div className="relative border-4 border-zinc-800 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl w-full max-w-[500px] aspect-square flex flex-col">
        {/* Canvas Screen */}
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          className="w-full h-full bg-[#1e293b]"
        />

        {/* Legend / Interface Bar */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-zinc-900/90 border border-zinc-800 text-sky-400 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5" />
            WORLD: {playerState.x}, {playerState.y}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-zinc-900/90 border border-zinc-800 text-amber-400 backdrop-blur-md uppercase tracking-widest">
            Lv{playerState.level} PARTY
          </span>
        </div>

        {/* Dialog / Subtitle Overlay */}
        {activeDialogue && (
          <div className="absolute bottom-3 left-3 right-3 border border-zinc-700 bg-zinc-950/95 p-4 rounded-xl flex flex-col gap-1.5 shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-3 duration-200">
            <span className="text-[10px] font-bold tracking-wider text-sky-400 uppercase font-mono">
              {activeDialogue.speaker}
            </span>
            <p className="text-xs font-mono text-zinc-100 leading-relaxed min-h-[40px]">
              {activeDialogue.lines[activeDialogue.lineIndex]}
            </p>
            <div className="flex justify-end items-center mt-1">
              <button
                onClick={checkInteraction}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-sky-600 hover:bg-sky-500 text-white font-mono transition-colors"
              >
                CONTINUE <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controller Affordance */}
      <div className="flex flex-col gap-1.5 items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 w-full max-w-[500px]">
        <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px] font-semibold uppercase tracking-widest">
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">ZQSD</kbd> Mouvement</span>
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">E</kbd> Interagir</span>
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">SPACE</kbd> Sauter</span>
          <span className="flex items-center gap-1 text-zinc-400"><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">C</kbd> Carte</span>
        </div>
      </div>
    </div>
  );
};
