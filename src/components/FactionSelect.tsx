import React, { useState, useEffect, useRef } from 'react';
import { Faction, ShipDef } from '../types/space';
import { LIGHT_SHIPS, DARK_SHIPS } from '../utils/spaceShips';
import { drawPixelShip } from '../utils/shipRenderer';
import { Shield, Zap, Swords, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const getSpecialTypeForShip = (defId: string): 'beam' | 'shield' => {
  if (defId === 'x_wing' || defId === 'falcon') return 'shield';
  if (defId === 'delta_7' || defId === 'jedi_interceptor') return 'beam';
  if (defId === 'tie_vader' || defId === 'tie_n2') return 'beam';
  return 'shield';
};

const getBoostTypeForShip = (defId: string): 'dash' | 'multiplier' => {
  // Light side: x_wing, delta_7 -> dash; falcon, jedi_interceptor -> multiplier
  if (defId === 'x_wing' || defId === 'delta_7') return 'dash';
  if (defId === 'falcon' || defId === 'jedi_interceptor') return 'multiplier';
  // Dark side: tie_fighter, tie_silencer -> dash; tie_vader, tie_n2, solar_sailer -> multiplier
  if (defId === 'tie_fighter' || defId === 'tie_silencer') return 'dash';
  return 'multiplier';
};

interface FactionSelectProps {
  onLaunch: (faction: Faction, shipId: string, playerName: string) => void;
}

export const FactionSelect: React.FC<FactionSelectProps> = ({ onLaunch }) => {
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string>('');
  const [pilotName, setPilotName] = useState<string>('');
  const [isNameValidated, setIsNameValidated] = useState<boolean>(false);
  
  // Rotating ship canvas variables
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotateAngle = useRef(0);

  const activeShips = selectedFaction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
  const currentShip = activeShips.find(s => s.id === selectedShipId) || activeShips[0];

  // Set default ship when faction changes
  useEffect(() => {
    if (selectedFaction) {
      setSelectedShipId(selectedFaction === 'light' ? 'x_wing' : 'tie_fighter');
    }
  }, [selectedFaction]);

  // Handle ship preview rotation animation
  useEffect(() => {
    let animationId: number;

    const animatePreview = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas || !currentShip) {
        animationId = requestAnimationFrame(animatePreview);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw spinning ship
      ctx.fillStyle = '#09090d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw faint background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw stars crawling in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      const starOffset = (Date.now() / 50) % canvas.width;
      ctx.fillRect((canvas.width - starOffset) % canvas.width, 40, 2, 2);
      ctx.fillRect((canvas.width * 1.5 - starOffset) % canvas.width, 140, 1.5, 1.5);
      ctx.fillRect((canvas.width * 0.8 - starOffset) % canvas.width, 220, 2.5, 2.5);

      rotateAngle.current += 0.015;
      drawPixelShip(
        ctx,
        canvas.width / 2,
        canvas.height / 2,
        60, // size
        rotateAngle.current,
        currentShip.id,
        currentShip.faction,
        currentShip.color,
        true // moving engine glow
      );

      animationId = requestAnimationFrame(animatePreview);
    };

    if (selectedFaction) {
      animatePreview();
    }

    return () => cancelAnimationFrame(animationId);
  }, [selectedFaction, selectedShipId, currentShip]);

  const handleLaunch = () => {
    if (selectedFaction && selectedShipId) {
      const defaultName = selectedFaction === 'light' ? 'Rogue Leader' : 'Sith Commander';
      onLaunch(selectedFaction, selectedShipId, pilotName.trim() || defaultName);
    }
  };

  // Stats bar helper
  const renderStatBar = (label: string, value: number, max: number, barColor: string) => {
    const percentage = (value / max) * 100;
    return (
      <div className="flex flex-col gap-1 w-full text-xs font-mono">
        <div className="flex justify-between text-zinc-400">
          <span>{label}</span>
          <span className="text-white font-bold">{value}</span>
        </div>
        <div className="w-full h-2 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (!selectedFaction) {
    // Faction Selection Screen
    return (
      <div className="w-full max-w-[1000px] min-h-[500px] flex flex-col items-center justify-center gap-10 p-6 md:p-8 rounded-3xl border border-zinc-800 bg-[#07070a]/90 backdrop-blur-xl shadow-2xl select-none animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-widest text-white font-display uppercase">
            CHOOSE YOUR ALLEGIANCE
          </h2>
          <p className="text-xs text-zinc-500 tracking-widest font-mono uppercase">
            The galaxy is divided. Select your faction to command your starfighter.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-[800px]">
          {/* Light Side Card */}
          <div
            onClick={() => setSelectedFaction('light')}
            className="group relative flex flex-col items-center justify-between p-8 rounded-2xl border border-emerald-950 hover:border-emerald-500 bg-[#0a0f0d]/50 hover:bg-emerald-950/20 text-center cursor-pointer transition-all duration-300 hover:scale-[1.03] shadow-[0_0_20px_rgba(16,185,129,0.02)] hover:shadow-[0_0_35px_rgba(16,185,129,0.15)]"
          >
            {/* Rebel Symbol outline watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity">
              <svg viewBox="0 0 100 100" className="w-40 h-40 fill-emerald-500">
                <path d="M50 0 C55 25 75 35 100 45 C80 50 65 65 60 100 C50 75 30 65 0 55 C20 50 35 35 50 0 Z" />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-4 z-10">
              <span className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all">
                <Shield className="w-8 h-8" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold tracking-widest text-emerald-400 font-display uppercase group-hover:text-emerald-300">
                  THE LIGHT SIDE
                </h3>
                <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest uppercase">
                  Rebel Alliance & Jedi Order
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mt-2">
                "May the Force be with you." Defend hope and restore peace in the galaxy. Pilot agile fighters equipped with shielding and cooperative AI wings.
              </p>
            </div>
            
            <button className="mt-8 py-2.5 px-6 rounded-xl text-xs font-bold bg-emerald-600 group-hover:bg-emerald-500 text-white transition-all shadow-md">
              COMMAND THE LIGHT
            </button>
          </div>

          {/* Dark Side Card */}
          <div
            onClick={() => setSelectedFaction('dark')}
            className="group relative flex flex-col items-center justify-between p-8 rounded-2xl border border-rose-950/40 hover:border-rose-500 bg-[#0f0a0b]/50 hover:bg-rose-950/20 text-center cursor-pointer transition-all duration-300 hover:scale-[1.03] shadow-[0_0_20px_rgba(239,68,68,0.02)] hover:shadow-[0_0_35px_rgba(239,68,68,0.15)]"
          >
            {/* Empire symbol watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity">
              <svg viewBox="0 0 100 100" className="w-40 h-40 fill-rose-500">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="none" />
                <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="6" />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-4 z-10">
              <span className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all">
                <Swords className="w-8 h-8" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold tracking-widest text-rose-500 font-display uppercase group-hover:text-rose-400">
                  THE DARK SIDE
                </h3>
                <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest uppercase">
                  Galactic Empire & Sith Order
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mt-2">
                "You underestimate the power of the Dark Side." Strike with raw power and crush all resistance. Command lethal, unshielded but heavily powered swarm fighters.
              </p>
            </div>

            <button className="mt-8 py-2.5 px-6 rounded-xl text-xs font-bold bg-rose-600 group-hover:bg-rose-500 text-white transition-all shadow-md">
              COMMAND THE DARK
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFaction && !isNameValidated) {
    const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const defaultName = selectedFaction === 'light' ? 'Rogue Leader' : 'Sith Commander';
      const finalName = pilotName.trim() || defaultName;
      setPilotName(finalName);
      setIsNameValidated(true);
    };

    const isLight = selectedFaction === 'light';
    const accentColor = isLight ? 'text-emerald-400' : 'text-rose-500';
    const accentBorder = isLight ? 'focus:border-emerald-500' : 'focus:border-rose-500';
    const accentBg = isLight ? 'bg-emerald-950/20' : 'bg-rose-950/20';
    const accentBtn = isLight 
      ? 'bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]' 
      : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.25)]';

    return (
      <div className="w-full max-w-[500px] flex flex-col gap-6 p-6 md:p-8 rounded-3xl border border-zinc-800 bg-[#07070a]/90 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Back to faction */}
        <button
          onClick={() => {
            setSelectedFaction(null);
            setIsNameValidated(false);
          }}
          className="w-fit flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 hover:text-white font-mono uppercase transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> CHANGE SIDE
        </button>

        <div className="text-center flex flex-col gap-2 border-b border-zinc-850 pb-4">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-widest text-white font-display uppercase">
            CALLSIGN REGISTRATION
          </h2>
          <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${accentColor}`}>
            COMMISSIONING FOR THE {isLight ? 'REBEL ALLIANCE' : 'GALACTIC EMPIRE'}
          </span>
        </div>

        <form onSubmit={handleNameSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-zinc-500 font-mono font-bold text-[9px] uppercase tracking-wider">
              Enter your Pilot Callsign / Name
            </label>
            <input
              type="text"
              autoFocus
              maxLength={15}
              placeholder={isLight ? "e.g. Luke Skywalker" : "e.g. Darth Vader"}
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs font-mono text-white placeholder-zinc-700 outline-none transition-all ${accentBorder} ${accentBg} focus:shadow-[0_0_15px_rgba(255,255,255,0.02)]`}
            />
            <p className="text-[9.5px] text-zinc-500 leading-normal font-sans italic">
              *Leave empty for default callsign: <span className="font-bold text-zinc-400 font-mono">{isLight ? 'Rogue Leader' : 'Sith Commander'}</span>
            </p>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 px-6 rounded-xl font-mono font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${accentBtn}`}
          >
            <Play className="w-4 h-4 fill-current" /> REGISTER CALLSIGN
          </button>
        </form>
      </div>
    );
  }

  // Ship Selection Screen
  return (
    <div className="w-full max-w-[1050px] flex flex-col gap-6 p-6 md:p-8 rounded-3xl border border-zinc-800 bg-[#07070a]/90 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      {/* Back to faction */}
      <button
        onClick={() => {
          setSelectedFaction(null);
          setIsNameValidated(false);
        }}
        className="w-fit flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-[10px] font-bold tracking-wider text-zinc-400 hover:text-white font-mono uppercase transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> CHANGE SIDE
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Starship List */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold tracking-wider text-white uppercase font-sans">
              SELECT YOUR FIGHTER
            </h2>
            <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${
              selectedFaction === 'light' ? 'text-emerald-400' : 'text-rose-500'
            }`}>
              Available {selectedFaction === 'light' ? 'Alliance' : 'Imperial'} Starships
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {activeShips.map((ship) => {
              const active = ship.id === selectedShipId;
              const accentBorder = selectedFaction === 'light' ? 'hover:border-emerald-500/50 border-emerald-950' : 'hover:border-rose-500/50 border-rose-950/40';
              const activeBorder = selectedFaction === 'light' ? 'border-emerald-500 bg-emerald-950/10' : 'border-rose-500 bg-rose-950/10';
              
              return (
                <div
                  key={ship.id}
                  onClick={() => setSelectedShipId(ship.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    active ? activeBorder : `bg-zinc-950/50 ${accentBorder}`
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">{ship.name}</span>
                    <span className="text-[10px] text-zinc-500 leading-snug line-clamp-1 max-w-[280px]">
                      {ship.description}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    active ? (selectedFaction === 'light' ? 'text-emerald-400 translate-x-1' : 'text-rose-500 translate-x-1') : 'text-zinc-600'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Starship Detail & Preview */}
        {currentShip && (
          <div className="lg:col-span-6 border border-zinc-800 bg-[#09090d]/80 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            {/* Title / Description */}
            <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase tracking-wider">Starfighter Spec</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{currentShip.name}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                selectedFaction === 'light' ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' : 'border-rose-500/30 bg-rose-950/20 text-rose-500'
              }`}>
                {selectedFaction === 'light' ? 'Light Side' : 'Dark Side'}
              </span>
            </div>

            {/* Model Preview Canvas */}
            <div className="w-full h-[160px] border border-zinc-850 bg-zinc-950 rounded-xl overflow-hidden shadow-inner flex justify-center items-center">
              <canvas
                ref={previewCanvasRef}
                width={260}
                height={160}
                className="w-full h-full"
              />
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans italic">
              "{currentShip.description}"
            </p>

            {/* Attributes sliders */}
            <div className="flex flex-col gap-3 border-t border-zinc-850 pt-3">
              {renderStatBar('Engine Speed', currentShip.stats.speed, 8, selectedFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-600')}
              {renderStatBar('Laser Power', currentShip.stats.power, 40, selectedFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-600')}
              {/* Rate represents cooldown, lower is better. We invert it for the slider: Max cooldown 500ms, Min 100ms */}
              {renderStatBar('Fire Frequency', Math.round(10000 / currentShip.stats.rate), 100, selectedFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-600')}
              {renderStatBar('Laser Range', currentShip.stats.range, 1000, selectedFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-600')}
              {renderStatBar('Defensive Shield', currentShip.stats.shield, 300, selectedFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-600')}
            </div>

            {/* Special Power Info */}
            <div className="border-t border-zinc-850 pt-3 flex flex-col gap-2.5 text-[9px] font-mono">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Dash / Boost (R / R1)</span>
                {getBoostTypeForShip(currentShip.id) === 'dash' ? (
                  <div className="flex flex-col gap-0.5 border border-purple-950/60 bg-purple-950/10 p-2 rounded-xl text-purple-400">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">🚀 Dagger Dash</span>
                    <span className="text-zinc-400 font-sans leading-relaxed text-[9.5px]">
                      Triggers a sudden 320px micro-jump teleport dash in the direction of travel to evade enemy fire. Cooldown: 5s.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 border border-amber-950/60 bg-amber-950/10 p-2 rounded-xl text-amber-400">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">🔥 Overdrive Boost</span>
                    <span className="text-zinc-400 font-sans leading-relaxed text-[9.5px]">
                      Increases engines speed output by +200% for 6 seconds, leaving an energy trail behind. Cooldown: 5s.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Bomb (E / L2)</span>
                <div className="flex flex-col gap-0.5 border border-violet-950/60 bg-violet-950/10 p-2 rounded-xl text-violet-400">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">💣 Space Bomb</span>
                  <span className="text-zinc-400 font-sans leading-relaxed text-[9.5px]">
                    Fires a massive gravity bomb that detonates in a wide area (350px radius), clearing enemy fighters and asteroids. Cooldown: 5s.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">Shield / Laser Beam (W / R2)</span>
                {getSpecialTypeForShip(currentShip.id) === 'beam' ? (
                  <div className="flex flex-col gap-0.5 border border-cyan-950/60 bg-cyan-950/10 p-2 rounded-xl text-cyan-400">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">⚡ Super Piercing Beam</span>
                    <span className="text-zinc-400 font-sans leading-relaxed text-[9.5px]">
                      Fires a colossal piercing energy beam across the entire map, dealing 1,000 damage. Cooldown: 7s.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 border border-blue-950/60 bg-blue-950/10 p-2 rounded-xl text-blue-400">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5">🛡️ Deflector Shield</span>
                    <span className="text-zinc-400 font-sans leading-relaxed text-[9.5px]">
                      Activates a reflective energy bubble for 5 seconds that bounces enemy lasers back. Cooldown: 7s.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleLaunch}
              className={`w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedFaction === 'light'
                  ? 'bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> LAUNCH IN HYPERSPACE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
