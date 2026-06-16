'use client';

import React, { useState, useEffect } from 'react';
import { Faction } from '../types/space';
import { FactionSelect } from '../components/FactionSelect';
import { SpaceCanvas } from '../components/SpaceCanvas';
import { SpaceRules } from '../components/SpaceRules';
import { Sparkles, Trophy, BookOpen, Compass, RotateCcw, Swords, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SpacePage() {
  const [gameMode, setGameState] = useState<'select' | 'battle'>('select');
  const [faction, setFaction] = useState<Faction | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('Rogue Leader');
  
  // Game stats
  const [highScore, setHighScore] = useState<number>(0);
  const [questHistory, setQuestHistory] = useState<string[]>([
    'Hyperdrive core initialized.',
    'Awaiting fleet coordinates.'
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
  const handleLaunch = (chosenFaction: Faction, shipId: string, name: string) => {
    setFaction(chosenFaction);
    setSelectedShipId(shipId);
    setPlayerName(name);
    setGameState('battle');

    const shipName = shipId.replace('_', ' ').toUpperCase();
    setQuestHistory(prev => [
      ...prev,
      `🚀 Pilot ${name} launched in ${shipName} for the ${chosenFaction === 'light' ? 'Light' : 'Dark'} Side!`
    ]);
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
      setQuestHistory(prev => [...prev, `👑 NEW HIGH SCORE: ${score} points!`]);
    }

    setQuestHistory(prev => [
      ...prev,
      `💥 Starfighter destroyed. Captured ${kills} enemy pilots. Sector score: ${score}`
    ]);
  };

  const handleResetHistory = () => {
    setQuestHistory(['Hyperdrive core initialized.', 'Awaiting fleet coordinates.']);
  };

  return (
    <main className="flex-1 w-full min-h-screen p-4 md:p-8 flex flex-col items-center gap-6 relative overflow-x-hidden select-none">
      {/* Background space elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-indigo-950/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-rose-950/10 blur-[130px] pointer-events-none -z-10" />

      {/* Main Header */}
      <header className="w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-4">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-zinc-200 to-rose-400 font-display uppercase">
              GALAXY DOGFIGHT
            </h1>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
            Star Wars Faction Wars - 2D Retro Space Battles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {showRules ? 'CLOSE MANUAL' : 'VIEW FLIGHT MANUAL'}
          </button>
          
          <button
            onClick={handleResetHistory}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-xs font-semibold text-zinc-300 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            CLEAR LOGS
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
                playerName={playerName}
                onGameOver={handleGameOver}
                onExit={() => setGameState('select')}
              />
            )
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* High Score Panel */}
          <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                RECORD HIGH SCORE
              </span>
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tracking-wider">
                {highScore}
              </span>
              <span className="text-[10px] font-bold text-zinc-500 font-mono">PTS</span>
            </div>
          </div>

          {/* Sector Chronicles Log */}
          <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                SECTOR LOG HISTORY
              </span>
              <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
            </div>
            <div className="h-[260px] border border-zinc-850 bg-[#07070a]/90 p-3 rounded-xl overflow-y-auto flex flex-col gap-2 shadow-inner scrollbar-thin scrollbar-thumb-zinc-800">
              {questHistory.map((log, index) => (
                <div key={index} className="text-xs leading-relaxed font-mono text-zinc-400 border-b border-zinc-900 pb-1.5 last:border-0 last:text-zinc-100 last:font-bold">
                  &gt; {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
