'use client';

import React, { useState, useEffect } from 'react';
import { Player, NPC, Chest, WorldMapState } from '../types/rpg';
import { ChessPiece } from '../types/game';
import { generateWorldMap } from '../utils/rpgMap';
import { createChessPiece, getStatsForLevel } from '../utils/pokemon';
import { RpgCanvas } from '../components/RpgCanvas';
import { WorldMap } from '../components/WorldMap';
import { RpgRules } from '../components/RpgRules';
import { BattleScreen } from '../components/BattleScreen';
import { ChessPieceIcon } from '../components/ChessPieceIcon';
import { Sparkles, Trophy, ShieldAlert, BookOpen, Compass, RefreshCw, Star, Heart, Activity, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RpgPage() {
  // 1. Initialize Map State
  const [mapState, setMapState] = useState<WorldMapState | null>(null);

  // 2. Initialize Player State with starter Knight
  const [player, setPlayer] = useState<Player>({
    x: 32,
    y: 36, // Pallet Town center
    dir: 'down',
    isMoving: false,
    moveProgress: 0,
    isJumping: false,
    jumpProgress: 0,
    level: 1,
    monsters: []
  });

  // Game UI States
  const [showMap, setShowMap] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState<'explore' | 'battle' | 'game_over'>('explore');
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null);
  const [history, setHistory] = useState<string[]>(['Woke up in Pallet Town.', 'Received starter Knight (L1)!']);
  
  // Battle state
  const [activeBattle, setActiveBattle] = useState<{
    opponent: ChessPiece;
    isTrainer: boolean;
    name: string;
    npcId?: string;
  } | null>(null);

  // Toast notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Lazy-load map on mount to prevent SSR hydration mismatches
  useEffect(() => {
    const worldMap = generateWorldMap();
    setMapState(worldMap);
    
    // Create starter Knight
    const starterKnight = createChessPiece('n', 'w', 1);
    setPlayer(prev => ({
      ...prev,
      monsters: [starterKnight]
    }));
  }, []);

  // Display notification trigger
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Trigger win confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#0ea5e9', '#ffffff']
    });
  };

  // Keyboard map shortcut helper (listens globally as fallback)
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyC' && gameState === 'explore') {
        setShowMap(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  // Handle Player trigger battle (Wild or Trainer)
  const handleTriggerBattle = (
    enemyType: string,
    level: number,
    name: string,
    isTrainer: boolean,
    npcId?: string
  ) => {
    // Generate opponent ChessPiece
    const opponent = createChessPiece(enemyType as any, 'b', Date.now());
    
    // Scale opponent's stats based on level
    opponent.level = level;
    const scaledStats = getStatsForLevel(opponent.stats, level);
    opponent.stats = scaledStats;
    opponent.maxHp = scaledStats.hp;
    opponent.currentHp = scaledStats.hp;

    setActiveBattle({
      opponent,
      isTrainer,
      name,
      npcId
    });
    
    setGameState('battle');
    setHistory(prev => [
      ...prev,
      isTrainer 
        ? `⚔️ Challenged Trainer ${name} to a duel!` 
        : `⚔️ Encountered a wild ${getPieceName(enemyType)}!`
    ]);
  };

  // Handle Battle Resolution
  const handleBattleEnd = (
    winnerSide: 'attacker' | 'defender',
    updatedPlayerMon: ChessPiece,
    updatedEnemyMon: ChessPiece
  ) => {
    if (!activeBattle) return;

    if (winnerSide === 'attacker') {
      // Attacker (Player) Wins!
      triggerNotification('Victory! Your piece level increased!');
      triggerConfetti();
      
      // Update player party
      setPlayer(prev => ({
        ...prev,
        level: Math.max(prev.level, updatedPlayerMon.level),
        monsters: [updatedPlayerMon]
      }));

      // If Trainer, mark defeated on map
      if (activeBattle.isTrainer && activeBattle.npcId && mapState) {
        const updatedNpcs = mapState.npcs.map(n => 
          n.id === activeBattle.npcId ? { ...n, defeated: true } : n
        );
        setMapState({
          ...mapState,
          npcs: updatedNpcs
        });

        // Check if all trainers are defeated to win the game!
        const undefeatedTrainers = updatedNpcs.filter(n => n.isTrainer && !n.defeated);
        if (undefeatedTrainers.length === 0) {
          setWinner('player');
          setGameState('game_over');
        }
      }

      setHistory(prev => [...prev, `🏆 Defeated ${activeBattle.name}!`]);
    } else {
      // Defender (CPU) Wins! Player fainted
      triggerNotification('Fainted! Whipping back to Pallet Town...');
      
      // Fully restore active monster HP
      const revivedMon = { ...player.monsters[0] };
      revivedMon.currentHp = revivedMon.maxHp;

      // Teleport player back to start
      setPlayer(prev => ({
        ...prev,
        x: 32,
        y: 36,
        dir: 'down',
        monsters: [revivedMon]
      }));

      setHistory(prev => [...prev, '💀 Blacked out and respawned in Pallet Town.']);
    }

    // Reset combat screen
    setActiveBattle(null);
    setGameState('explore');
  };

  // Handle Chest Open
  const handleOpenChest = (chestId: string, rewardMsg: string, rewardType: string) => {
    if (!mapState) return;

    // Mark chest as opened
    const updatedChests = mapState.chests.map(c => 
      c.id === chestId ? { ...c, opened: true } : c
    );
    setMapState({
      ...mapState,
      chests: updatedChests
    });

    // Process Reward
    let activeMon = { ...player.monsters[0] };
    if (rewardType === 'level_up' || rewardType === 'rare_candy') {
      // Level Up Mon
      const levelBoost = rewardType === 'rare_candy' ? 2 : 1;
      activeMon.level = Math.min(5, activeMon.level + levelBoost);
      
      const newStats = getStatsForLevel(activeMon.stats, activeMon.level);
      activeMon.stats = newStats;
      activeMon.maxHp = newStats.hp;
      activeMon.currentHp = newStats.hp; // fully heals
    } else if (rewardType === 'heal_all') {
      // Heal Mon
      activeMon.currentHp = activeMon.maxHp;
    }

    setPlayer(prev => ({
      ...prev,
      monsters: [activeMon]
    }));

    triggerNotification(rewardMsg);
    setHistory(prev => [...prev, `🎁 Opened Chest: ${rewardMsg}`]);
  };

  // Reset/Restart match
  const handleResetGame = () => {
    const worldMap = generateWorldMap();
    setMapState(worldMap);
    
    const starterKnight = createChessPiece('n', 'w', 1);
    setPlayer({
      x: 32,
      y: 36,
      dir: 'down',
      isMoving: false,
      moveProgress: 0,
      isJumping: false,
      jumpProgress: 0,
      level: 1,
      monsters: [starterKnight]
    });

    setGameState('explore');
    setShowMap(false);
    setWinner(null);
    setActiveBattle(null);
    setHistory(['Woke up in Pallet Town.', 'Received starter Knight (L1)!']);
  };

  // Helper to translate piece code to string
  function getPieceName(type: string): string {
    switch (type) {
      case 'p': return 'Pawn';
      case 'n': return 'Knight';
      case 'b': return 'Bishop';
      case 'r': return 'Rook';
      case 'q': return 'Queen';
      case 'k': return 'King';
      default: return 'Piece';
    }
  }

  // Helper type color
  const getMoveTypeColor = (type: string) => {
    switch (type) {
      case 'steel': return 'bg-zinc-700 text-zinc-100';
      case 'fighter': return 'bg-amber-600 text-white';
      case 'psychic': return 'bg-purple-600 text-white';
      case 'fire': return 'bg-rose-600 text-white';
      case 'dark': return 'bg-indigo-950 text-indigo-200 border border-indigo-500/20';
      case 'dragon': return 'bg-teal-600 text-white';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  // Map updates checking
  const activeMon = player.monsters[0];

  return (
    <main className="flex-1 w-full min-h-screen p-4 md:p-8 flex flex-col items-center gap-6 relative overflow-x-hidden select-none">
      {/* Background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-emerald-950/15 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-sky-950/15 blur-[120px] pointer-events-none -z-10" />

      {/* Floating Notifications */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full border border-sky-500/30 bg-zinc-950/90 text-xs font-bold font-mono tracking-wide text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)] animate-in fade-in slide-in-from-top-4 duration-300">
          ✨ {notification}
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-4">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-sky-200 to-indigo-400 font-display uppercase">
              CHESS MONS: EXPLORER
            </h1>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
            Retro 2D Pixel Open-World RPG & Turn-Based Battles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {showRules ? 'CLOSE GUIDE' : 'VIEW EXPLORER GUIDE'}
          </button>
          
          <button
            onClick={handleResetGame}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-xs font-semibold text-zinc-300 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            RESTART RPG
          </button>
        </div>
      </header>

      {/* Main Grid content */}
      <div className="w-full max-w-[1200px] flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Rules overlay */}
        {showRules && (
          <div className="lg:col-span-12 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
            <RpgRules />
          </div>
        )}

        {/* Viewport exploring / battles */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center w-full">
          {gameState === 'explore' && mapState && (
            <RpgCanvas
              mapState={mapState}
              playerState={player}
              onUpdatePlayer={setPlayer}
              onTriggerBattle={handleTriggerBattle}
              onOpenChest={handleOpenChest}
              onToggleMap={() => setShowMap(true)}
              onShowNotification={triggerNotification}
            />
          )}

          {gameState === 'battle' && activeBattle && activeMon && (
            <div className="w-full flex justify-center animate-in fade-in duration-300">
              <BattleScreen
                attackerPiece={activeMon}
                defenderPiece={activeBattle.opponent}
                attackerNotation={`${player.x},${player.y}`}
                defenderNotation={activeBattle.isTrainer ? 'Trainer' : 'Grass'}
                onBattleEnd={handleBattleEnd}
              />
            </div>
          )}

          {gameState === 'game_over' && (
            <div className="w-full max-w-[500px] border border-zinc-800 bg-zinc-950 p-8 rounded-3xl flex flex-col gap-6 shadow-2xl items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-extrabold uppercase tracking-widest text-white font-display">
                  CHAMPION SECURED!
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Incredible exploration! You have challenged and defeated all trainer guards on the island, securing your place as the Ultimate Chess Mon Champion!
                </p>
              </div>

              <button
                onClick={handleResetGame}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-sm font-bold text-white rounded-xl shadow-lg transition-all"
              >
                START A NEW JOURNEY
              </button>
            </div>
          )}
        </div>

        {/* Sidebar logs / party stats */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Active Party Mon Stat Card */}
          {activeMon && (
            <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-5 flex flex-col gap-4 backdrop-blur-md shadow-lg">
              <div className="flex justify-between items-start border-b border-zinc-850 pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-sky-400 font-mono uppercase tracking-wider">Active Companion</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{getPieceName(activeMon.type)}</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-950/20 text-amber-400 text-[10px] font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  LEVEL {activeMon.level}
                </div>
              </div>

              {/* Graphic illustration */}
              <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center relative">
                  <div className="absolute inset-1.5 bg-sky-500/5 rounded-full blur-md animate-pulse" />
                  <ChessPieceIcon type={activeMon.type} color={activeMon.color} className="w-10 h-10 z-10" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> HP</span>
                    <span>{activeMon.currentHp} / {activeMon.maxHp}</span>
                  </div>
                  {/* HP bar */}
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className={`h-full transition-all duration-300 ${
                        activeMon.currentHp / activeMon.maxHp > 0.5
                          ? 'bg-emerald-500'
                          : activeMon.currentHp / activeMon.maxHp > 0.25
                          ? 'bg-amber-500'
                          : 'bg-rose-600'
                      }`}
                      style={{ width: `${(activeMon.currentHp / activeMon.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats values */}
              <div className="grid grid-cols-3 gap-2 border-t border-zinc-850 pt-3 text-[10px] font-semibold font-mono text-zinc-400 text-center">
                <div className="flex flex-col gap-0.5 bg-zinc-900/60 py-1.5 rounded-lg border border-zinc-850">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Speed</span>
                  <span className="text-zinc-100 font-bold">{activeMon.stats.speed}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-zinc-900/60 py-1.5 rounded-lg border border-zinc-850">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Attack</span>
                  <span className="text-zinc-100 font-bold">{activeMon.stats.attack}</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-zinc-900/60 py-1.5 rounded-lg border border-zinc-850">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Defense</span>
                  <span className="text-zinc-100 font-bold">{activeMon.stats.defense}</span>
                </div>
              </div>

              {/* Mon Abilities grid */}
              <div className="flex flex-col gap-2 border-t border-zinc-850 pt-3">
                <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Capabilities</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeMon.moves.map(move => (
                    <div
                      key={move.id}
                      className="p-2 border border-zinc-850/80 bg-zinc-950/80 rounded-lg flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-bold text-zinc-200 leading-tight">{move.name}</span>
                      <span className={`text-[8px] font-bold px-1 rounded-sm uppercase tracking-wider w-fit mt-1.5 ${getMoveTypeColor(move.type)}`}>
                        {move.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History logs */}
          <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md shadow-lg">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              JOURNEY CHRONICLES
            </span>
            <div className="h-[180px] border border-zinc-850 bg-[#07070a]/90 p-3 rounded-xl overflow-y-auto flex flex-col gap-2 shadow-inner scrollbar-thin scrollbar-thumb-zinc-800">
              {history.map((log, index) => (
                <div key={index} className="text-xs leading-normal font-mono text-zinc-400 border-b border-zinc-900 pb-1 last:border-0 last:text-zinc-100 last:font-bold">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* World Map Overlay Modal */}
      {showMap && mapState && (
        <WorldMap
          mapState={mapState}
          playerState={player}
          onClose={() => setShowMap(false)}
        />
      )}
    </main>
  );
}
