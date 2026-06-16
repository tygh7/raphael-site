'use client';

import React, { useState, useEffect } from 'react';
import { Faction, Difficulty } from '../types/space';
import { FactionSelect } from '../components/FactionSelect';
import { SpaceCanvas } from '../components/SpaceCanvas';
import { SpaceRules } from '../components/SpaceRules';
import { Sparkles, Trophy, BookOpen, Compass, RotateCcw, Swords, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SpacePage() {
  const [gameMode, setGameState] = useState<'select' | 'battle'>('select');
  const [isTwoPlayers, setIsTwoPlayers] = useState<boolean>(false);
  
  const [faction, setFaction] = useState<Faction | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('ROGUE LEADER');
  
  const [faction2, setFaction2] = useState<Faction | null>(null);
  const [selectedShipId2, setSelectedShipId2] = useState<string | null>(null);
  const [playerName2, setPlayerName2] = useState<string>('SITH LORD');
  
  const [difficulty, setDifficulty] = useState<Difficulty>('clone');
  
  // Game stats
  const [highScore, setHighScore] = useState<number>(0);
  const [questHistory, setQuestHistory] = useState<Array<{ text: string; type: 'light' | 'dark' | 'system' }>>([
    { text: 'Hyperdrive core initialized.', type: 'system' },
    { text: 'Awaiting fleet coordinates.', type: 'system' }
  ]);
  const [showRules, setShowRules] = useState(false);

  // Restore high score on mount
  useEffect(() => {
    const savedScore = localStorage.getItem('spacemon_highscore');
    if (savedScore) {
      setHighScore(parseInt(savedScore, 10));
    }
  }, []);

  // Handle ship launch
  const handleLaunch = (
    chosenIsTwoPlayers: boolean,
    chosenFaction: Faction,
    shipId: string,
    name: string,
    chosenFaction2: Faction | null,
    shipId2: string | null,
    name2: string | null,
    chosenDifficulty: Difficulty
  ) => {
    setIsTwoPlayers(chosenIsTwoPlayers);
    setFaction(chosenFaction);
    setSelectedShipId(shipId);
    setPlayerName(name);
    setFaction2(chosenFaction2);
    setSelectedShipId2(shipId2);
    setPlayerName2(name2 || 'SITH LORD');
    setDifficulty(chosenDifficulty);
    setGameState('battle');

    const shipName = shipId.replace('_', ' ').toUpperCase();
    const shipName2 = shipId2 ? shipId2.replace('_', ' ').toUpperCase() : '';
    const diffLabel = chosenDifficulty === 'leila' ? 'LEILA (SUPER EASY)' 
                     : chosenDifficulty === 'c3po' ? 'C3-PO (EASY)' 
                     : chosenDifficulty === 'clone' ? 'CLONE WARS (MEDIUM)' 
                     : 'JAR JAR BINKS (HARDEST)';

    if (chosenIsTwoPlayers) {
      setQuestHistory(prev => [
        ...prev,
        {
          text: `🚀 TWO PLAYER COMBAT LAUNCHED!`,
          type: 'system'
        },
        {
          text: `🎮 PILOT 1: ${name} IN ${shipName} FOR THE ${chosenFaction === 'light' ? 'LIGHT' : 'DARK'} SIDE!`,
          type: chosenFaction
        },
        {
          text: `🎮 PILOT 2: ${name2} IN ${shipName2} FOR THE ${chosenFaction2 === 'light' ? 'LIGHT' : 'DARK'} SIDE!`,
          type: chosenFaction2 || 'system'
        },
        {
          text: `⚙️ DIFFICULTY LEVEL: ${diffLabel}`,
          type: 'system'
        }
      ]);
    } else {
      setQuestHistory(prev => [
        ...prev,
        {
          text: `🚀 PILOT ${name} LAUNCHED IN ${shipName} (${diffLabel}) FOR THE ${chosenFaction === 'light' ? 'LIGHT' : 'DARK'} SIDE!`,
          type: chosenFaction
        }
      ]);
    }
  };

  // Handle game over (death screen exit callback)
  const handleGameOver = (score: number, kills: number) => {
    setGameState('select');
    
    // Check high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('spacemon_highscore', score.toString());
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#10b981', '#38bdf8']
      });
      setQuestHistory(prev => [...prev, { text: `👑 NEW HIGH SCORE: ${score} points!`, type: 'system' }]);
    }

    setQuestHistory(prev => [
      ...prev,
      {
        text: `💥 Starfighter destroyed. Captured ${kills} enemy pilots. Sector score: ${score}`,
        type: 'system'
      }
    ]);
  };

  const handleResetHistory = () => {
    setQuestHistory([
      { text: 'Hyperdrive core initialized.', type: 'system' },
      { text: 'Awaiting fleet coordinates.', type: 'system' }
    ]);
  };

  return (
    <main className="flex-1 w-full min-h-screen p-4 md:p-8 flex flex-col items-center gap-6 relative overflow-x-hidden select-none">
      {/* Background space elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-indigo-950/5 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-rose-950/5 blur-[130px] pointer-events-none -z-10" />

      {/* Main Header */}
      <header className="w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-zinc-800 pb-6">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <h1 className="text-md md:text-xl font-extrabold tracking-widest text-white font-press uppercase pixel-glow-white">
              GALAXY DOGFIGHT
            </h1>
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-press">
            STAR WARS FLEET WARS - 2D RETRO DOGFIGHTS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-2 px-4 py-3 border-2 border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-[9px] font-bold text-zinc-400 hover:text-white rounded-none font-press transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showRules ? 'CLOSE MANUAL' : 'FLIGHT MANUAL'}
          </button>
          
          <button
            onClick={handleResetHistory}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-950 border-2 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-[9px] font-bold text-zinc-300 rounded-none font-press transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET LOGS
          </button>
        </div>
      </header>

      {/* Main View Grid */}
      <div className="w-full max-w-[1200px] flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Rules overlay */}
        {showRules && (
          <div className="lg:col-span-12 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
            <SpaceRules />
          </div>
        )}

        {/* Viewport */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center w-full">
          {gameMode === 'select' ? (
            <FactionSelect onLaunch={handleLaunch} />
          ) : (
            faction && selectedShipId && (
              <SpaceCanvas
                faction={faction}
                selectedShipId={selectedShipId}
                difficulty={difficulty}
                playerName={playerName}
                onGameOver={handleGameOver}
                onExit={() => setGameState('select')}
                onKillFeed={(msg, type) => setQuestHistory(prev => [...prev, { text: msg.toUpperCase(), type: type || 'system' }])}
                isTwoPlayers={isTwoPlayers}
                faction2={faction2 || 'dark'}
                selectedShipId2={selectedShipId2 || 'tie_fighter'}
                playerName2={playerName2}
              />
            )
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* High Score Panel */}
          <div className="pixel-border-amber bg-[#050508]/95 rounded-none p-5 flex flex-col gap-4 shadow-xl crt-scanlines">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-press">
                FLEET RECORD
              </span>
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-extrabold text-yellow-400 font-press tracking-wider pixel-glow-yellow">
                {highScore}
              </span>
              <span className="text-[8px] font-bold text-zinc-500 font-press">PTS</span>
            </div>
          </div>

          {/* Sector Chronicles Log */}
          <div className="pixel-border-zinc bg-[#050508]/95 rounded-none p-5 flex flex-col gap-4 shadow-xl crt-scanlines">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-press">
                SECTOR CHRONICLES
              </span>
              <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
            </div>
            <div className="h-[280px] border-2 border-zinc-800 bg-[#020204]/90 p-3 rounded-none overflow-y-auto flex flex-col gap-3.5 scrollbar-thin">
              {questHistory.map((log, index) => {
                const isLast = index === questHistory.length - 1;
                let colorClass = 'text-zinc-500';
                let glowClass = '';
                if (log.type === 'light') {
                  colorClass = isLast ? 'text-emerald-400 font-bold' : 'text-emerald-600/80';
                  glowClass = isLast ? 'pixel-glow-emerald' : '';
                } else if (log.type === 'dark') {
                  colorClass = isLast ? 'text-rose-400 font-bold' : 'text-rose-600/80';
                  glowClass = isLast ? 'pixel-glow-rose' : '';
                } else if (isLast) {
                  colorClass = 'text-zinc-200 font-bold';
                }
                return (
                  <div key={index} className={`text-[8px] leading-relaxed font-press border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0 ${colorClass} ${glowClass}`}>
                    &gt; {log.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
