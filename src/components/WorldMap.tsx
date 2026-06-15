import React, { useRef, useEffect } from 'react';
import { WorldMapState, Player } from '../types/rpg';
import { Map, X, Crosshair, HelpCircle } from 'lucide-react';

interface WorldMapProps {
  mapState: WorldMapState;
  playerState: Player;
  onClose: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ mapState, playerState, onClose }) => {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // Draw the minimap on mount/update
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = canvas.width / mapState.width; // scaling factor to fit 64x64 on canvas

    // Draw tiles
    for (let r = 0; r < mapState.height; r++) {
      for (let c = 0; c < mapState.width; c++) {
        const tile = mapState.grid[r][c];
        
        ctx.fillStyle = tile.color;
        // Simplify colors for aesthetic minimap look
        if (tile.type === 'tree') {
          ctx.fillStyle = '#064e3b'; // dark forest green
        } else if (tile.type === 'mountain') {
          ctx.fillStyle = '#374151'; // dark rock grey
        } else if (tile.type === 'water') {
          ctx.fillStyle = '#0369a1'; // deep lake blue
        } else if (tile.type === 'dirt') {
          ctx.fillStyle = '#b45309'; // dirt trails
        } else if (tile.type === 'ledge') {
          ctx.fillStyle = '#1f2937'; // ledge boundary
        }

        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    // Draw Chest positions as small yellow dots
    mapState.chests.forEach(chest => {
      if (!chest.opened) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc((chest.x + 0.5) * scale, (chest.y + 0.5) * scale, scale * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw NPC positions as small red/pink dots
    mapState.npcs.forEach(npc => {
      ctx.fillStyle = npc.isTrainer ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc((npc.x + 0.5) * scale, (npc.y + 0.5) * scale, scale * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player's blinking position
    const blink = Math.floor(Date.now() / 250) % 2;
    if (blink === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      
      const px = (playerState.x + 0.5) * scale;
      const py = (playerState.y + 0.5) * scale;
      
      ctx.beginPath();
      ctx.arc(px, py, scale * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [mapState, playerState]);

  // Request Animation frame loop to handle player position blinking
  useEffect(() => {
    let animationFrameId: number;
    
    const tick = () => {
      const canvas = minimapRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = canvas.width / mapState.width;
          const px = (playerState.x + 0.5) * scale;
          const py = (playerState.y + 0.5) * scale;

          // Redraw region surrounding player to animate blinking
          // Just let the main render run at 15fps or similar
          const tile = mapState.grid[playerState.y][playerState.x];
          ctx.fillStyle = tile.color;
          ctx.fillRect((playerState.x - 2) * scale, (playerState.y - 2) * scale, scale * 5, scale * 5);
          
          // Redraw tiles around player
          for (let r = Math.max(0, playerState.y - 2); r <= Math.min(mapState.height - 1, playerState.y + 2); r++) {
            for (let c = Math.max(0, playerState.x - 2); c <= Math.min(mapState.width - 1, playerState.x + 2); c++) {
              const t = mapState.grid[r][c];
              ctx.fillStyle = t.color;
              if (t.type === 'tree') ctx.fillStyle = '#064e3b';
              else if (t.type === 'mountain') ctx.fillStyle = '#374151';
              else if (t.type === 'water') ctx.fillStyle = '#0369a1';
              else if (t.type === 'dirt') ctx.fillStyle = '#b45309';
              ctx.fillRect(c * scale, r * scale, scale, scale);
            }
          }

          // Blinking Player Red dot
          const blink = Math.floor(Date.now() / 200) % 2;
          ctx.fillStyle = blink === 0 ? '#ef4444' : '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, scale * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mapState, playerState]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative border border-zinc-800 bg-[#0d0d12]/95 p-6 rounded-2xl flex flex-col gap-5 max-w-[480px] w-full shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Map className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm tracking-wide uppercase font-sans">
              Adventurer Map
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Canvas viewport */}
        <div className="flex justify-center items-center w-full aspect-square border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 p-2 shadow-inner">
          <canvas
            ref={minimapRef}
            width={384}
            height={384}
            className="w-full h-full rounded-lg"
          />
        </div>

        {/* Region / Coordinates readouts */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-zinc-850 pt-4">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 uppercase text-[9px] tracking-wider font-bold">Current Region</span>
            <span className="text-zinc-100 font-bold">
              {playerState.y < 14
                ? 'High Peaks'
                : playerState.y < 29
                ? 'Viridian Forest'
                : playerState.y < 44
                ? 'Pallet Town'
                : 'Mystic Lake'}
            </span>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <span className="text-zinc-500 uppercase text-[9px] tracking-wider font-bold">Grid Coordinates</span>
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5" />
              X: {playerState.x}, Y: {playerState.y}
            </span>
          </div>
        </div>

        {/* Map Legend */}
        <div className="flex items-center justify-between border-t border-zinc-850 pt-4 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-800" />
            <span>Grass</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-zinc-600 border border-zinc-800" />
            <span>Mountains</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-600 border border-zinc-800" />
            <span>Water</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            <span className="text-yellow-400">Chest</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400">Trainer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
