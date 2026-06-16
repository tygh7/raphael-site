import React, { useState, useEffect, useRef } from 'react';
import { Faction, Difficulty, ShipDef } from '../types/space';
import { LIGHT_SHIPS, DARK_SHIPS } from '../utils/spaceShips';
import { drawPixelShip } from '../utils/shipRenderer';
import { Shield, Zap, Swords, ChevronLeft, ChevronRight, Play, User, Gamepad2 } from 'lucide-react';

const getSpecialTypeForShip = (defId: string): 'beam' | 'shield' => {
  if (defId === 'x_wing' || defId === 'falcon') return 'shield';
  if (defId === 'delta_7' || defId === 'jedi_interceptor') return 'beam';
  if (defId === 'tie_vader' || defId === 'tie_n2') return 'beam';
  return 'shield';
};

const getBoostTypeForShip = (defId: string): 'dash' | 'multiplier' => {
  if (defId === 'x_wing' || defId === 'delta_7') return 'dash';
  if (defId === 'falcon' || defId === 'jedi_interceptor') return 'multiplier';
  if (defId === 'tie_fighter' || defId === 'tie_silencer') return 'dash';
  return 'multiplier';
};

interface FactionSelectProps {
  onLaunch: (
    isTwoPlayers: boolean,
    faction1: Faction,
    shipId1: string,
    playerName1: string,
    faction2: Faction | null,
    shipId2: string | null,
    playerName2: string | null,
    difficulty: Difficulty
  ) => void;
}

export const FactionSelect: React.FC<FactionSelectProps> = ({ onLaunch }) => {
  // Step flow: 
  // 0: Select player count (1 vs 2)
  // 1: P1 Faction Selection
  // 2: P1 Callsign registration
  // 3: P1 Ship Selection
  // 4: P2 Faction Selection (if 2 players)
  // 5: P2 Callsign registration (if 2 players)
  // 6: P2 Ship Selection (if 2 players)
  // 7: Difficulty selection and launch
  const [step, setStep] = useState<number>(0);
  const [playerCount, setPlayerCount] = useState<1 | 2 | null>(null);

  const [faction1, setFaction1] = useState<Faction | null>(null);
  const [name1, setName1] = useState<string>('');
  const [ship1, setShip1] = useState<string>('x_wing');

  const [faction2, setFaction2] = useState<Faction | null>(null);
  const [name2, setName2] = useState<string>('');
  const [ship2, setShip2] = useState<string>('tie_fighter');

  const [difficulty, setDifficulty] = useState<Difficulty>('clone');
  
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotateAngle = useRef(0);

  const isConfiguringP2 = step === 4 || step === 5 || step === 6;
  const currentFaction = isConfiguringP2 ? faction2 : faction1;
  const currentShipId = isConfiguringP2 ? ship2 : ship1;
  const currentPilotName = isConfiguringP2 ? name2 : name1;

  const activeShips = currentFaction === 'light' ? LIGHT_SHIPS : DARK_SHIPS;
  const currentShip = activeShips.find(s => s.id === currentShipId) || activeShips[0];

  useEffect(() => {
    if (step === 1 && faction1) {
      setShip1(faction1 === 'light' ? 'x_wing' : 'tie_fighter');
    }
    if (step === 4 && faction2) {
      setShip2(faction2 === 'light' ? 'x_wing' : 'tie_fighter');
    }
  }, [faction1, faction2, step]);

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

      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      const gridSize = 16;
      for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const starOffset = (Date.now() / 40) % canvas.width;
      ctx.fillRect((canvas.width - starOffset) % canvas.width, 30, 2, 2);
      ctx.fillRect((canvas.width * 1.4 - starOffset) % canvas.width, 110, 2, 2);
      ctx.fillRect((canvas.width * 0.7 - starOffset) % canvas.width, 140, 2, 2);

      rotateAngle.current += 0.015;
      drawPixelShip(
        ctx,
        canvas.width / 2,
        canvas.height / 2,
        60,
        rotateAngle.current,
        currentShip.id,
        currentShip.faction,
        currentShip.color,
        true
      );

      animationId = requestAnimationFrame(animatePreview);
    };

    if (currentFaction) {
      animatePreview();
    }

    return () => cancelAnimationFrame(animationId);
  }, [currentFaction, currentShipId, currentShip]);

  const handleLaunch = (chosenDifficulty: Difficulty) => {
    const defaultName1 = faction1 === 'light' ? 'ROGUE LEADER' : 'SITH LORD';
    const defaultName2 = faction2 === 'light' ? 'ROGUE TWO' : 'SITH ASSASSIN';

    onLaunch(
      playerCount === 2,
      faction1 || 'light',
      ship1,
      name1.trim().toUpperCase() || defaultName1,
      faction2,
      playerCount === 2 ? ship2 : null,
      playerCount === 2 ? (name2.trim().toUpperCase() || defaultName2) : null,
      chosenDifficulty
    );
  };

  const renderStatBar = (label: string, value: number, max: number, tickColorClass: string) => {
    const totalTicks = 8;
    const activeTicks = Math.min(totalTicks, Math.max(1, Math.round((value / max) * totalTicks)));
    
    return (
      <div className="flex flex-col gap-1 w-full text-[9px] font-press tracking-wider">
        <div className="flex justify-between text-zinc-400">
          <span>{label}</span>
          <span className="text-white font-bold">{value}</span>
        </div>
        <div className="flex mt-1">
          {Array.from({ length: totalTicks }).map((_, idx) => (
            <div
              key={idx}
              className={`h-3 w-5 mr-1 border border-black ${
                idx < activeTicks ? tickColorClass : 'bg-[#0a0a0f] border-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render Step 0: Player Count Selection
  if (step === 0) {
    return (
      <div className="w-full max-w-[800px] min-h-[450px] flex flex-col items-center justify-center gap-10 p-6 md:p-8 rounded-none pixel-border-zinc bg-[#050508]/95 backdrop-blur-md shadow-2xl select-none animate-in fade-in zoom-in-95 duration-300 crt-scanlines">
        <div className="text-center flex flex-col gap-3">
          <h2 className="text-lg md:text-2xl font-extrabold tracking-widest text-white font-press uppercase pixel-glow-white">
            CHOOSE PLAYER MODE
          </h2>
          <p className="text-[10px] text-zinc-500 tracking-wider font-press leading-relaxed max-w-xl">
            PREPARE FOR BATTLE. SELECT SINGLE PILOT MODE OR LOCAL SPLIT SCREEN DUEL.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-[700px]">
          {/* 1 Player Button */}
          <div
            onClick={() => {
              setPlayerCount(1);
              setStep(1);
            }}
            className="group relative flex flex-col items-center justify-between p-8 rounded-none pixel-border-emerald hover:border-emerald-400 bg-[#060c08]/90 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl"
          >
            <div className="flex flex-col items-center gap-6 z-10">
              <span className="w-16 h-16 rounded-none bg-emerald-950/40 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all">
                <User className="w-8 h-8" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold tracking-widest text-emerald-400 font-press uppercase group-hover:text-emerald-300 pixel-glow-emerald">
                  1 PLAYER
                </h3>
                <span className="text-[8px] font-bold text-zinc-500 tracking-wider uppercase font-press">
                  CAMPAIGN DOGFIGHTS
                </span>
              </div>
              <p className="text-[8px] leading-relaxed text-zinc-400 max-w-xs mt-2 font-press uppercase">
                FLY AGAINST OUTPOST ENEMY FLEET INTELLIGENCE.
              </p>
            </div>
          </div>

          {/* 2 Players Button */}
          <div
            onClick={() => {
              setPlayerCount(2);
              setStep(1);
            }}
            className="group relative flex flex-col items-center justify-between p-8 rounded-none pixel-border-rose hover:border-rose-400 bg-[#0c0608]/90 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl"
          >
            <div className="flex flex-col items-center gap-6 z-10">
              <span className="w-16 h-16 rounded-none bg-rose-950/40 border-2 border-rose-500/50 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all">
                <Gamepad2 className="w-8 h-8" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold tracking-widest text-rose-500 font-press uppercase group-hover:text-rose-400 pixel-glow-rose">
                  2 PLAYERS
                </h3>
                <span className="text-[8px] font-bold text-zinc-500 tracking-wider uppercase font-press">
                  LOCAL SPLIT-SCREEN
                </span>
              </div>
              <p className="text-[8px] leading-relaxed text-zinc-400 max-w-xs mt-2 font-press uppercase">
                VERSUS OR COOP DOGFIGHT. EACH PILOT SELECTS A FIGHTER.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 1 & 4: Faction Selection
  if (step === 1 || step === 4) {
    const isP1 = step === 1;
    return (
      <div className="w-full max-w-[1000px] min-h-[500px] flex flex-col items-center justify-center gap-10 p-6 md:p-8 rounded-none pixel-border-zinc bg-[#050508]/95 backdrop-blur-md shadow-2xl select-none animate-in fade-in zoom-in-95 duration-300 crt-scanlines">
        <button
          onClick={() => setStep(isP1 ? 0 : 3)}
          className="self-start flex items-center gap-1.5 px-3 py-2 rounded-none border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-[9px] font-bold text-zinc-400 hover:text-white font-press transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> BACK
        </button>

        <div className="text-center flex flex-col gap-3">
          <h2 className="text-lg md:text-2xl font-extrabold tracking-widest text-white font-press uppercase pixel-glow-white">
            {isP1 ? 'PLAYER 1' : 'PLAYER 2'}: SELECT ALLEGIANCE
          </h2>
          <p className="text-[10px] text-zinc-500 tracking-wider font-press leading-relaxed max-w-xl">
            THE GALAXY IS SPLIT. CHOOSE A SIDE TO COMMENCE FLEET DOGFIGHTS.
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-[800px]">
          {/* Light Side Card */}
          <div
            onClick={() => {
              if (isP1) {
                setFaction1('light');
                setStep(2);
              } else {
                setFaction2('light');
                setStep(5);
              }
            }}
            className="group relative flex flex-col items-center justify-between p-8 rounded-none pixel-border-emerald hover:border-emerald-400 bg-[#060c08]/90 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity">
              <svg viewBox="0 0 100 100" className="w-40 h-40 fill-emerald-500">
                <path d="M50 0 C55 25 75 35 100 45 C80 50 65 65 60 100 C50 75 30 65 0 55 C20 50 35 35 50 0 Z" />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-6 z-10">
              <span className="w-16 h-16 rounded-none bg-emerald-950/40 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all">
                <Shield className="w-8 h-8" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold tracking-widest text-emerald-400 font-press uppercase group-hover:text-emerald-300 pixel-glow-emerald">
                  REBEL ALLIANCE
                </h3>
                <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase font-press">
                  THE LIGHT SIDE
                </span>
              </div>
              <p className="text-[9px] leading-relaxed text-zinc-400 max-w-xs mt-2 font-press">
                Agile starfighters with shields and tactical wingmen. Defend the Galaxy.
              </p>
            </div>
            
            <button className="mt-8 py-3 px-6 rounded-none text-[10px] font-press font-bold bg-emerald-700 border-2 border-emerald-400 text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:bg-emerald-600">
              JOIN REBELS
            </button>
          </div>

          {/* Dark Side Card */}
          <div
            onClick={() => {
              if (isP1) {
                setFaction1('dark');
                setStep(2);
              } else {
                setFaction2('dark');
                setStep(5);
              }
            }}
            className="group relative flex flex-col items-center justify-between p-8 rounded-none pixel-border-rose hover:border-rose-400 bg-[#0c0608]/90 text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-2xl"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity">
              <svg viewBox="0 0 100 100" className="w-40 h-40 fill-rose-500">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="none" />
                <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="6" />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-6 z-10">
              <span className="w-16 h-16 rounded-none bg-rose-950/40 border-2 border-rose-500/50 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all">
                <Swords className="w-8 h-8" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold tracking-widest text-rose-500 font-press uppercase group-hover:text-rose-400 pixel-glow-rose">
                  GALACTIC EMPIRE
                </h3>
                <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase font-press">
                  THE DARK SIDE
                </span>
              </div>
              <p className="text-[9px] leading-relaxed text-zinc-400 max-w-xs mt-2 font-press">
                High-power firepower interceptors. Crush the resistance with speed.
              </p>
            </div>

            <button className="mt-8 py-3 px-6 rounded-none text-[10px] font-press font-bold bg-rose-700 border-2 border-rose-400 text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] group-hover:bg-rose-600">
              JOIN EMPIRE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Step 2 & 5: Callsign Registration
  if (step === 2 || step === 5) {
    const isP1 = step === 2;
    const currentFactionLocal = isP1 ? faction1 : faction2;
    const currentPilotNameLocal = isP1 ? name1 : name2;
    const setCurrentPilotNameLocal = isP1 ? setName1 : setName2;

    const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const defaultName = currentFactionLocal === 'light' ? (isP1 ? 'ROGUE LEADER' : 'ROGUE TWO') : (isP1 ? 'SITH LORD' : 'SITH ASSASSIN');
      const finalName = currentPilotNameLocal.trim().toUpperCase() || defaultName;
      setCurrentPilotNameLocal(finalName);
      setStep(isP1 ? 3 : 6);
    };

    const isLight = currentFactionLocal === 'light';
    const accentColor = isLight ? 'text-emerald-400' : 'text-rose-500';
    const accentBorder = isLight ? 'pixel-border-emerald' : 'pixel-border-rose';
    const glowClass = isLight ? 'pixel-glow-emerald' : 'pixel-glow-rose';
    const accentBg = isLight ? 'bg-emerald-950/10' : 'bg-rose-950/10';
    const accentBtn = isLight 
      ? 'bg-emerald-700 border-2 border-emerald-400 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
      : 'bg-rose-700 border-2 border-rose-400 hover:bg-rose-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]';

    return (
      <div className={`w-full max-w-[500px] flex flex-col gap-6 p-6 md:p-8 rounded-none ${accentBorder} bg-[#050508]/95 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-300 crt-scanlines`}>
        <button
          onClick={() => setStep(isP1 ? 1 : 4)}
          className="w-fit flex items-center gap-1.5 px-3 py-2 rounded-none border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-[9px] font-bold text-zinc-400 hover:text-white font-press transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> BACK
        </button>

        <div className="text-center flex flex-col gap-3 border-b border-zinc-800 pb-4">
          <h2 className="text-md md:text-lg font-extrabold tracking-widest text-white font-press uppercase pixel-glow-white">
            {isP1 ? 'PLAYER 1' : 'PLAYER 2'} CALLSIGN
          </h2>
          <span className={`text-[9px] font-bold uppercase tracking-wider font-press ${accentColor} ${glowClass}`}>
            PILOT OF THE {isLight ? 'REBEL FLEET' : 'IMPERIAL SQUAD'}
          </span>
        </div>

        <form onSubmit={handleNameSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-zinc-500 font-press font-bold text-[8px] uppercase tracking-wider">
              ENTER PILOT CALLSIGN
            </label>
            <input
              type="text"
              autoFocus
              maxLength={15}
              placeholder={isLight ? "SKYWALKER" : "VADER"}
              value={currentPilotNameLocal}
              onChange={(e) => setCurrentPilotNameLocal(e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 bg-[#0a0a0f] border-2 border-zinc-800 rounded-none text-xs font-press text-white placeholder-zinc-800 outline-none focus:border-zinc-500 transition-all ${accentBg}`}
            />
            <p className="text-[8px] text-zinc-600 leading-relaxed font-press uppercase">
              *DEFAULT CALLSIGN: <span className="font-bold text-zinc-400">{isLight ? (isP1 ? 'ROGUE LEADER' : 'ROGUE TWO') : (isP1 ? 'SITH LORD' : 'SITH ASSASSIN')}</span>
            </p>
          </div>

          <button
            type="submit"
            className={`w-full py-4 px-6 rounded-none font-press font-bold text-[10px] text-white shadow-lg transition-all flex items-center justify-center gap-2 ${accentBtn}`}
          >
            <Play className="w-4 h-4 fill-current" /> REGISTER
          </button>
        </form>
      </div>
    );
  }

  // Render Step 7: Difficulty Selection
  if (step === 7) {
    const isLight = faction1 === 'light';
    const accentColor = isLight ? 'text-emerald-400' : 'text-rose-500';
    const accentBorder = isLight ? 'pixel-border-emerald' : 'pixel-border-rose';
    const glowClass = isLight ? 'pixel-glow-emerald' : 'pixel-glow-rose';

    const difficulties: { id: Difficulty; label: string; sub: string; desc: string; borderClass: string; textClass: string; bgClass: string }[] = [
      {
        id: 'leila',
        label: 'LEILA SKYWALKER',
        sub: 'SUPER EASY',
        desc: 'WEAK OPPONENTS, SLOW FIRE AND REDUCED DAMAGE.',
        borderClass: 'border-emerald-950 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        textClass: 'text-emerald-400',
        bgClass: 'hover:bg-emerald-950/20 bg-[#060c08]/50'
      },
      {
        id: 'c3po',
        label: 'C3-PO',
        sub: 'EASY',
        desc: 'SUBDUED OPPONENTS, SLOWER ENEMY MANEUVERS.',
        borderClass: 'border-sky-950 hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.15)]',
        textClass: 'text-sky-400',
        bgClass: 'hover:bg-sky-950/20 bg-[#060a0c]/50'
      },
      {
        id: 'clone',
        label: 'CLONE WARS',
        sub: 'MEDIUM',
        desc: 'STANDARD COMBAT CONDITIONS. EQUAL WAR BALANCE.',
        borderClass: 'border-zinc-850 hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]',
        textClass: 'text-zinc-300',
        bgClass: 'hover:bg-zinc-900/20 bg-zinc-950/50'
      },
      {
        id: 'jarjar',
        label: 'JAR JAR BINKS',
        sub: 'HARDEST',
        desc: 'WARNING: EXTREMELY AGGRESSIVE AND OVERPOWERED ENEMIES!',
        borderClass: 'border-rose-950 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        textClass: 'text-rose-500',
        bgClass: 'hover:bg-rose-950/20 bg-[#0c0608]/50'
      }
    ];

    return (
      <div className={`w-full max-w-[650px] flex flex-col gap-6 p-6 md:p-8 rounded-none ${accentBorder} bg-[#050508]/95 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-300 crt-scanlines`}>
        <button
          onClick={() => setStep(playerCount === 2 ? 6 : 3)}
          className="w-fit flex items-center gap-1.5 px-3 py-2 rounded-none border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-[9px] font-bold text-zinc-400 hover:text-white font-press transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> BACK
        </button>

        <div className="text-center flex flex-col gap-3 border-b border-zinc-800 pb-4">
          <h2 className="text-md md:text-lg font-extrabold tracking-widest text-white font-press uppercase pixel-glow-white">
            SELECT DIFFICULTY
          </h2>
          <span className={`text-[9px] font-bold uppercase tracking-wider font-press ${accentColor} ${glowClass}`}>
            CONFIGURE OPPONENT FORCE INTELLIGENCE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {difficulties.map((diff) => (
            <div
              key={diff.id}
              onClick={() => {
                setDifficulty(diff.id);
                handleLaunch(diff.id);
              }}
              className={`p-5 border-2 rounded-none cursor-pointer transition-all flex flex-col gap-3 ${diff.bgClass} ${diff.borderClass}`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[9.5px] font-bold font-press ${diff.textClass}`}>
                  {diff.label}
                </span>
                <span className="text-[7px] text-zinc-500 font-press border border-zinc-800 px-1 py-0.5">
                  {diff.sub}
                </span>
              </div>
              <p className="text-[7.5px] text-zinc-500 leading-relaxed font-press uppercase">
                {diff.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render Step 3 & 6: Starship Selection
  const isP1Ship = step === 3;
  const accentBorderClass = currentFaction === 'light' ? 'pixel-border-emerald' : 'pixel-border-rose';
  const glowClass = currentFaction === 'light' ? 'pixel-glow-emerald' : 'pixel-glow-rose';

  return (
    <div className={`w-full max-w-[1050px] flex flex-col gap-6 p-6 md:p-8 rounded-none ${accentBorderClass} bg-[#050508]/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300 crt-scanlines`}>
      <button
        onClick={() => setStep(isP1Ship ? 2 : 5)}
        className="w-fit flex items-center gap-1.5 px-3 py-2 rounded-none border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-[9px] font-bold text-zinc-400 hover:text-white font-press transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> BACK
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Starship List */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-md font-bold tracking-wider text-white uppercase font-press pixel-glow-white">
              {isP1Ship ? 'PLAYER 1' : 'PLAYER 2'}: SELECT YOUR FIGHTER
            </h2>
            <span className={`text-[9px] font-bold uppercase tracking-wider font-press ${
              currentFaction === 'light' ? 'text-emerald-400' : 'text-rose-500'
            } ${glowClass}`}>
              AVAILABLE {currentFaction === 'light' ? 'ALLIANCE' : 'IMPERIAL'} HANGARS
            </span>
          </div>

          <div className="flex flex-col gap-3.5 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
            {activeShips.map((ship) => {
              const active = ship.id === currentShipId;
              const accentBorder = currentFaction === 'light' ? 'hover:border-emerald-500/50 border-zinc-800' : 'hover:border-rose-500/50 border-zinc-800';
              const activeBorder = currentFaction === 'light' ? 'border-emerald-500 bg-emerald-950/20' : 'border-rose-500 bg-rose-950/20';
              
              return (
                <div
                  key={ship.id}
                  onClick={() => {
                    if (isP1Ship) {
                      setShip1(ship.id);
                    } else {
                      setShip2(ship.id);
                    }
                  }}
                  className={`p-4 rounded-none border-2 cursor-pointer transition-all flex justify-between items-center ${
                    active ? activeBorder : `bg-[#0a0a0f]/60 ${accentBorder}`
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-[10px] text-white uppercase tracking-wider font-press">{ship.name}</span>
                    <span className="text-[8px] text-zinc-500 leading-snug line-clamp-1 max-w-[280px] font-press uppercase">
                      {ship.description}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    active ? (currentFaction === 'light' ? 'text-emerald-400 translate-x-1' : 'text-rose-500 translate-x-1') : 'text-zinc-700'
                  }`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Starship Detail & Preview */}
        {currentShip && (
          <div className={`lg:col-span-6 border-2 border-zinc-800 bg-[#08080c]/90 rounded-none p-5 flex flex-col gap-5 shadow-xl`}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-zinc-500 font-press uppercase tracking-wider">STARFIGHTER SPEC</span>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-wider font-press">{currentShip.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-none text-[8px] font-bold uppercase tracking-wider border-2 ${
                currentFaction === 'light' ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400' : 'border-rose-500/40 bg-rose-950/20 text-rose-500'
              }`}>
                {currentFaction === 'light' ? 'LIGHT SIDE' : 'DARK SIDE'}
              </span>
            </div>

            {/* Model Preview Canvas */}
            <div className="w-full h-[160px] border-2 border-zinc-800 bg-[#050508] rounded-none overflow-hidden shadow-inner flex justify-center items-center">
              <canvas
                ref={previewCanvasRef}
                width={260}
                height={160}
                className="w-full h-full"
              />
            </div>

            <p className="text-[9px] text-zinc-400 leading-relaxed font-press uppercase">
              "{currentShip.description}"
            </p>

            {/* Attributes sliders */}
            <div className="flex flex-col gap-3.5 border-t border-zinc-800 pt-4">
              {renderStatBar('ENGINE SPEED', currentShip.stats.speed, 8, currentFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-500')}
              {renderStatBar('LASER POWER', currentShip.stats.power, 40, currentFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-500')}
              {renderStatBar('FIRE FREQUENCY', Math.round(10000 / currentShip.stats.rate), 100, currentFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-500')}
              {renderStatBar('LASER RANGE', currentShip.stats.range, 1000, currentFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-500')}
              {renderStatBar('DEFENSIVE SHIELD', currentShip.stats.shield, 650, currentFaction === 'light' ? 'bg-emerald-500' : 'bg-rose-500')}
            </div>

            {/* Special Power Info */}
            <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3.5 text-[8px] font-press">
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">BOOST SPEED (R / R1)</span>
                {getBoostTypeForShip(currentShip.id) === 'dash' ? (
                  <div className="flex flex-col gap-1 border border-purple-900 bg-purple-950/10 p-3 rounded-none text-purple-400">
                    <span className="font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1.5">🚀 DAGGER DASH</span>
                    <span className="text-zinc-400 leading-relaxed text-[8px]">
                      TELEPORTS 320PX FORWARD TO DODGE INCOMING WEAPONS. COOLDOWN: 5S.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 border border-amber-900 bg-amber-950/10 p-3 rounded-none text-amber-400">
                    <span className="font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1.5">🔥 OVERDRIVE BOOST</span>
                    <span className="text-zinc-400 leading-relaxed text-[8px]">
                      INCREASES ENGINES SPEED BY +200% FOR 6 SECONDS. COOLDOWN: 5S.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">TACTICAL BOMB (E / L2)</span>
                <div className="flex flex-col gap-1 border border-violet-900 bg-violet-950/10 p-3 rounded-none text-violet-400">
                  <span className="font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1.5">💣 SPACE BOMB</span>
                  <span className="text-zinc-400 leading-relaxed text-[8px]">
                    FIRES GRAVITY DETONATOR CLEARING A 350PX RADIUS AREA. COOLDOWN: 5S.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider">DEFENSE / PIERCING BEAM (W / R2)</span>
                {getSpecialTypeForShip(currentShip.id) === 'beam' ? (
                  <div className="flex flex-col gap-1 border border-cyan-900 bg-cyan-950/10 p-3 rounded-none text-cyan-400">
                    <span className="font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1.5">⚡ PIERCING BEAM</span>
                    <span className="text-zinc-400 leading-relaxed text-[8px]">
                      FIRES AN INFINITE ENERGY BEAM DEALING 1000 DAMAGE. COOLDOWN: 7S.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 border border-blue-900 bg-blue-950/10 p-3 rounded-none text-blue-400">
                    <span className="font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1.5">🛡️ DEFLECTOR SHIELD</span>
                    <span className="text-zinc-400 leading-relaxed text-[8px]">
                      GENERATES REFLECTIVE ENERGY SHIELD FOR 5 SECONDS. COOLDOWN: 7S.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Button / Confirm Button */}
            <button
              onClick={() => {
                if (isP1Ship) {
                  if (playerCount === 1) {
                    setStep(7);
                  } else {
                    setStep(4);
                  }
                } else {
                  setStep(7);
                }
              }}
              className={`w-full mt-2 py-4 px-6 rounded-none font-press font-bold text-[10px] text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                currentFaction === 'light'
                  ? 'bg-emerald-700 border-2 border-emerald-400 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-700 border-2 border-rose-400 hover:bg-rose-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
            >
              <Play className="w-4 h-4 fill-current" /> {isP1Ship && playerCount === 2 ? 'CONFIRM PLAYER 1 FIGHTER' : 'LAUNCH IN HYPERSPACE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
