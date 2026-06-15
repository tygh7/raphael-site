import React, { useState, useEffect } from 'react';
import { BattleState, AttackMove, ChessPiece, BattlePiece, StatusEffect } from '../types/game';
import { ChessPieceIcon } from './ChessPieceIcon';
import { calculateDamage, getStatsForLevel, PIECE_MOVES, getStageMultiplier } from '../utils/pokemon';
import { getChessNotation } from '../utils/chess';

interface BattleScreenProps {
  attackerPiece: ChessPiece;
  defenderPiece: ChessPiece;
  attackerNotation: string;
  defenderNotation: string;
  onBattleEnd: (winner: 'attacker' | 'defender', updatedAttacker: ChessPiece, updatedDefender: ChessPiece) => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  attackerPiece,
  defenderPiece,
  attackerNotation,
  defenderNotation,
  onBattleEnd
}) => {
  // Initialize combat state pieces
  const createBattlePiece = (piece: ChessPiece): BattlePiece => ({
    piece,
    currentHp: piece.currentHp,
    maxHp: piece.maxHp,
    speed: piece.stats.speed,
    attack: piece.stats.attack,
    defense: piece.stats.defense,
    stages: { attack: 0, defense: 0, speed: 0 },
    status: 'none',
    statusDuration: 0,
    hasFlinched: false,
    isResting: false
  });

  const [attacker, setAttacker] = useState<BattlePiece>(createBattlePiece(attackerPiece));
  const [defender, setDefender] = useState<BattlePiece>(createBattlePiece(defenderPiece));
  const [battleTurn, setBattleTurn] = useState<number>(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState<'intro' | 'player_turn' | 'opponent_thinking' | 'resolution' | 'victory_screen'>('intro');
  const [shakePiece, setShakePiece] = useState<'attacker' | 'defender' | null>(null);
  const [flashPiece, setFlashPiece] = useState<'attacker' | 'defender' | null>(null);
  const [selectedMove, setSelectedMove] = useState<AttackMove | null>(null);

  // Intro Sequence
  useEffect(() => {
    const attackerName = getPieceName(attacker.piece.type);
    const defenderName = getPieceName(defender.piece.type);
    
    setLogs([
      `A wild Clash emerged at ${defenderNotation}!`,
      `Your ${attackerName} (L${attacker.piece.level}) vs Enemy ${defenderName} (L${defender.piece.level})!`,
      `First turn advantage: Your ${attackerName} goes first!`
    ]);

    const timer = setTimeout(() => {
      setPhase('player_turn');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Helper to get piece readable name
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

  // Handle Player Select Move
  const handlePlayerMove = (move: AttackMove) => {
    if (phase !== 'player_turn') return;
    setSelectedMove(move);
    setPhase('resolution');
    executeTurn(move);
  };

  // Opponent AI Choice
  const selectOpponentMove = (opp: BattlePiece, plr: BattlePiece): AttackMove => {
    const moves = opp.piece.moves;
    
    // 1. If HP is very low and has healing, heal
    const hpRatio = opp.currentHp / opp.maxHp;
    const healMove = moves.find(m => m.effectType === 'heal');
    if (hpRatio < 0.35 && healMove && Math.random() < 0.7) {
      return healMove;
    }

    // 2. If it has stat boosts and hasn't boosted yet, boost
    const statMove = moves.find(m => m.effectType === 'stat_up');
    if (statMove && opp.stages.defense === 0 && opp.stages.attack === 0 && Math.random() < 0.4) {
      return statMove;
    }

    // 3. Otherwise, pick the move that deals the most potential damage or random
    const damageMoves = moves.filter(m => m.power > 0);
    if (damageMoves.length > 0) {
      // Find move with best type effectiveness
      let bestMove = damageMoves[0];
      let bestMult = 0;
      damageMoves.forEach(m => {
        const mult = calculateDamage(opp, plr, m).typeEffectiveness;
        if (mult > bestMult) {
          bestMult = mult;
          bestMove = m;
        }
      });

      // 80% choose best move, 20% random
      return Math.random() < 0.8 ? bestMove : damageMoves[Math.floor(Math.random() * damageMoves.length)];
    }

    return moves[Math.floor(Math.random() * moves.length)];
  };

  // Turn Execution Engine
  const executeTurn = async (playerMove: AttackMove) => {
    let currentLogs: string[] = [];
    const addLog = (msg: string) => {
      currentLogs.push(msg);
      setLogs(prev => [...prev, msg]);
    };

    // 1. Opponent selects move
    const opponentMove = selectOpponentMove(defender, attacker);
    
    // Copy combatants
    let activePlayer = { ...attacker };
    let activeEnemy = { ...defender };

    // 2. Turn 1 Rule: Player (Attacker) always goes first
    let playerGoesFirst = true;
    
    if (battleTurn > 1) {
      // Pokémon rules: priority first, then speed
      if (playerMove.priority !== opponentMove.priority) {
        playerGoesFirst = playerMove.priority > opponentMove.priority;
      } else {
        const playerSpeed = activePlayer.speed * (activePlayer.status === 'paralyze' ? 0.5 : 1);
        const enemySpeed = activeEnemy.speed * (activeEnemy.status === 'paralyze' ? 0.5 : 1);
        playerGoesFirst = playerSpeed >= enemySpeed;
      }
    }

    const firstCombatant = playerGoesFirst ? activePlayer : activeEnemy;
    const secondCombatant = playerGoesFirst ? activeEnemy : activePlayer;
    const firstMove = playerGoesFirst ? playerMove : opponentMove;
    const secondMove = playerGoesFirst ? opponentMove : playerMove;
    const firstLabel = playerGoesFirst ? 'Your piece' : 'Enemy piece';
    const secondLabel = playerGoesFirst ? 'Enemy piece' : 'Your piece';

    // Helper function to process a single move
    const processMove = async (
      user: BattlePiece,
      target: BattlePiece,
      move: AttackMove,
      userLabel: string,
      targetLabel: string,
      isUserPlayer: boolean
    ): Promise<{ user: BattlePiece; target: BattlePiece; isFainted: boolean }> => {
      let u = { ...user };
      let t = { ...target };

      if (u.currentHp <= 0) return { user: u, target: t, isFainted: false };

      // Check Resting
      if (u.isResting) {
        addLog(`${userLabel} is resting after Last Bastion...`);
        u.isResting = false;
        return { user: u, target: t, isFainted: false };
      }

      // Check Flinch
      if (u.hasFlinched) {
        addLog(`${userLabel} flinched and could not attack!`);
        u.hasFlinched = false;
        return { user: u, target: t, isFainted: false };
      }

      // Check Confusion Duration
      if (u.status === 'confuse') {
        u.statusDuration -= 1;
        if (u.statusDuration <= 0) {
          u.status = 'none';
          addLog(`${userLabel} snapped out of confusion!`);
        }
      }

      addLog(`${userLabel} used ${move.name}!`);

      // Run damage calculations
      const result = calculateDamage(u, t, move);

      if (result.damage === 0 && result.message) {
        // Missed or status block
        addLog(`${userLabel} ${result.message}`);
        return { user: u, target: t, isFainted: false };
      }

      if (result.damage < 0) {
        // Confusion hit self
        const selfDmg = Math.abs(result.damage);
        u.currentHp = Math.max(0, u.currentHp - selfDmg);
        addLog(`${userLabel} ${result.message} It took ${selfDmg} self-inflicted damage.`);
        
        // Trigger flash / shake
        if (isUserPlayer) {
          setFlashPiece('attacker');
          setShakePiece('attacker');
        } else {
          setFlashPiece('defender');
          setShakePiece('defender');
        }
        await delay(500);
        setFlashPiece(null);
        setShakePiece(null);

        return { user: u, target: t, isFainted: u.currentHp <= 0 };
      }

      // Deal damage to target
      if (move.power > 0) {
        t.currentHp = Math.max(0, t.currentHp - result.damage);
        if (result.message) addLog(result.message);
        addLog(`Dealt ${result.damage} damage to ${targetLabel}.`);

        // Trigger flash / shake on defender
        if (isUserPlayer) {
          setFlashPiece('defender');
          setShakePiece('defender');
        } else {
          setFlashPiece('attacker');
          setShakePiece('attacker');
        }
        await delay(500);
        setFlashPiece(null);
        setShakePiece(null);

        if (t.currentHp <= 0) {
          addLog(`${targetLabel} fainted!`);
          return { user: u, target: t, isFainted: true };
        }
      }

      // Process effects
      if (move.effectType) {
        switch (move.effectType) {
          case 'heal':
            const healAmount = Math.round(u.maxHp * ((move.effectValue ?? 0) / 100));
            u.currentHp = Math.min(u.maxHp, u.currentHp + healAmount);
            addLog(`${userLabel} recovered ${healAmount} HP!`);
            break;
            
          case 'stat_up':
            const stageUp = move.effectValue ?? 1;
            if (move.id === 'iron_shield' || move.id === 'fortify') {
              u.stages.defense = Math.min(6, u.stages.defense + stageUp);
              addLog(`${userLabel}'s Defense rose by ${stageUp} stage(s)!`);
            } else if (move.id === 'agility') {
              u.stages.speed = Math.min(6, u.stages.speed + stageUp);
              addLog(`${userLabel}'s Speed rose by ${stageUp} stage(s)!`);
            } else {
              u.stages.attack = Math.min(6, u.stages.attack + stageUp);
              addLog(`${userLabel}'s Attack rose by ${stageUp} stage(s)!`);
            }
            break;

          case 'stat_down':
            const stageDown = move.effectValue ?? 1;
            t.stages.defense = Math.max(-6, t.stages.defense - stageDown);
            addLog(`${targetLabel}'s Defense fell by ${stageDown} stage(s)!`);
            break;

          case 'status_burn':
            if (t.status === 'none' && Math.random() < 0.3) {
              t.status = 'burn';
              addLog(`${targetLabel} was burned!`);
            }
            break;

          case 'status_paralyze':
            if (t.status === 'none' && Math.random() < (move.effectValue ?? 30) / 100) {
              t.status = 'paralyze';
              addLog(`${targetLabel} was paralyzed! It may not move!`);
            }
            break;

          case 'status_confuse':
            if (t.status === 'none' && Math.random() < 0.5) {
              t.status = 'confuse';
              t.statusDuration = 2 + Math.floor(Math.random() * 3); // 2 to 4 turns
              addLog(`${targetLabel} became confused!`);
            }
            break;

          case 'status_flinch':
            if (Math.random() < (move.effectValue ?? 30) / 100) {
              t.hasFlinched = true;
            }
            break;

          case 'recoil':
            const recoilDmg = Math.round(result.damage * ((move.effectValue ?? 25) / 100));
            if (recoilDmg > 0) {
              u.currentHp = Math.max(0, u.currentHp - recoilDmg);
              addLog(`${userLabel} took ${recoilDmg} recoil damage!`);
              if (u.currentHp <= 0) {
                addLog(`${userLabel} fainted from recoil!`);
                return { user: u, target: t, isFainted: true };
              }
            }
            break;
        }
      }

      // Rest move setup
      if (move.id === 'last_bastion') {
        u.isResting = true;
      }

      await delay(800);
      return { user: u, target: t, isFainted: false };
    };

    // Execute first combatant's move
    let step1 = await processMove(
      firstCombatant,
      secondCombatant,
      firstMove,
      firstLabel,
      secondLabel,
      playerGoesFirst
    );

    // Apply values to local variables
    if (playerGoesFirst) {
      activePlayer = step1.user;
      activeEnemy = step1.target;
    } else {
      activeEnemy = step1.user;
      activePlayer = step1.target;
    }

    setAttacker(activePlayer);
    setDefender(activeEnemy);

    // End battle check
    if (activePlayer.currentHp <= 0 || activeEnemy.currentHp <= 0) {
      handleBattleEnd(activePlayer, activeEnemy);
      return;
    }

    // Execute second combatant's move
    let step2 = await processMove(
      secondCombatant,
      firstCombatant,
      secondMove,
      secondLabel,
      firstLabel,
      !playerGoesFirst
    );

    // Apply values
    if (playerGoesFirst) {
      activeEnemy = step2.user;
      activePlayer = step2.target;
    } else {
      activePlayer = step2.user;
      activeEnemy = step2.target;
    }

    setAttacker(activePlayer);
    setDefender(activeEnemy);

    // End battle check
    if (activePlayer.currentHp <= 0 || activeEnemy.currentHp <= 0) {
      handleBattleEnd(activePlayer, activeEnemy);
      return;
    }

    // 3. End of turn effects (Burn damage)
    if (activePlayer.status === 'burn' && activePlayer.currentHp > 0) {
      const burnDmg = Math.round(activePlayer.maxHp * 0.1); // 10% damage
      activePlayer.currentHp = Math.max(0, activePlayer.currentHp - burnDmg);
      addLog(`Your piece took ${burnDmg} burn damage.`);
      setAttacker({ ...activePlayer });
      setFlashPiece('attacker');
      await delay(500);
      setFlashPiece(null);
    }

    if (activeEnemy.status === 'burn' && activeEnemy.currentHp > 0) {
      const burnDmg = Math.round(activeEnemy.maxHp * 0.1); // 10% damage
      activeEnemy.currentHp = Math.max(0, activeEnemy.currentHp - burnDmg);
      addLog(`Enemy piece took ${burnDmg} burn damage.`);
      setDefender({ ...activeEnemy });
      setFlashPiece('defender');
      await delay(500);
      setFlashPiece(null);
    }

    // End battle check again
    if (activePlayer.currentHp <= 0 || activeEnemy.currentHp <= 0) {
      handleBattleEnd(activePlayer, activeEnemy);
      return;
    }

    // Move to next turn
    setBattleTurn(prev => prev + 1);
    setPhase('player_turn');
  };

  const handleBattleEnd = async (finalPlayer: BattlePiece, finalEnemy: BattlePiece) => {
    await delay(1000);
    setPhase('victory_screen');
  };

  // Resolve victory bonuses (heals & level ups)
  const handleCloseBattle = () => {
    const winnerSide = attacker.currentHp > 0 ? 'attacker' : 'defender';

    // Deep clones to pass back
    let updatedAttacker = { ...attackerPiece };
    let updatedDefender = { ...defenderPiece };

    if (winnerSide === 'attacker') {
      // Attacker (Player) Wins!
      updatedAttacker.currentHp = attacker.currentHp;
      
      // Level up player piece!
      if (updatedAttacker.level < 5) {
        updatedAttacker.level += 1;
        // Compute new stats
        const base = PIECE_MOVES[updatedAttacker.type] ? getStatsForLevel(PIECE_MOVES[updatedAttacker.type][0] ? getStatsForLevel(attackerPiece.stats, 1) : attackerPiece.stats, 1) : attackerPiece.stats;
        // Wait, standard stats calculation
        // Let's use the BASE_STATS mapping
        const typeBaseStats = attackerPiece.type;
        const newStats = getStatsForLevel(attackerPiece.stats, updatedAttacker.level); // Note: we can scale directly
        updatedAttacker.stats = newStats;
        updatedAttacker.maxHp = newStats.hp;
        // Fully heal on level up
        updatedAttacker.currentHp = newStats.hp;
      } else {
        // Level capped: heal +50% of max HP
        const heal = Math.round(updatedAttacker.maxHp * 0.5);
        updatedAttacker.currentHp = Math.min(updatedAttacker.maxHp, updatedAttacker.currentHp + heal);
      }

      // Defender (Enemy) is dead
      updatedDefender.currentHp = 0;
    } else {
      // Defender (Enemy) Wins!
      updatedDefender.currentHp = defender.currentHp;

      // Level up enemy piece!
      if (updatedDefender.level < 5) {
        updatedDefender.level += 1;
        const newStats = getStatsForLevel(defenderPiece.stats, updatedDefender.level);
        updatedDefender.stats = newStats;
        updatedDefender.maxHp = newStats.hp;
        updatedDefender.currentHp = newStats.hp;
      } else {
        const heal = Math.round(updatedDefender.maxHp * 0.5);
        updatedDefender.currentHp = Math.min(updatedDefender.maxHp, updatedDefender.currentHp + heal);
      }

      // Attacker (Player) is dead
      updatedAttacker.currentHp = 0;
    }

    onBattleEnd(winnerSide, updatedAttacker, updatedDefender);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Get status effect CSS label class
  const getStatusBadge = (status: StatusEffect) => {
    switch (status) {
      case 'burn':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-600 text-white animate-pulse">BRN</span>;
      case 'paralyze':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500 text-black animate-pulse">PRZ</span>;
      case 'confuse':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white animate-pulse">CFN</span>;
      default:
        return null;
    }
  };

  // Helper to determine type color theme
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'steel': return 'bg-zinc-600 text-zinc-100';
      case 'fighter': return 'bg-amber-600 text-white';
      case 'psychic': return 'bg-purple-600 text-white';
      case 'fire': return 'bg-rose-600 text-white';
      case 'dark': return 'bg-indigo-950 text-indigo-200 border border-indigo-500/30';
      case 'dragon': return 'bg-teal-600 text-white';
      default: return 'bg-zinc-700 text-zinc-300';
    }
  };

  const playerWins = attacker.currentHp > 0;

  return (
    <div className="w-full max-w-[800px] border border-zinc-800 bg-[#07070a] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans select-none backdrop-blur-xl">
      {/* Title Bar */}
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs font-semibold text-zinc-400">
        <span>BATTLE LOG - TURN {battleTurn}</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-rose-400">CLASH IN PROGRESS</span>
        </div>
      </div>

      {/* Battle Scene Viewport */}
      <div className="flex-1 min-h-[300px] p-6 flex flex-col justify-between bg-gradient-to-b from-zinc-950 via-[#0a0a0f] to-zinc-950 relative">
        {/* Row 1: Opponent Status & Player Piece Graphic */}
        <div className="flex justify-between items-start w-full">
          {/* Opponent Status Card */}
          <div className="w-1/2 max-w-[280px] bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 shadow-lg flex flex-col gap-1 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-rose-400 uppercase tracking-wide">
                ENEMY {getPieceName(defender.piece.type)}
              </span>
              <div className="flex items-center gap-1">
                {getStatusBadge(defender.status)}
                <span className="text-[10px] font-bold text-zinc-500">Lv{defender.piece.level}</span>
              </div>
            </div>
            {/* HP Bar */}
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 shadow-inner mt-1">
              <div
                className={`h-full transition-all duration-500 ${
                  defender.currentHp / defender.maxHp > 0.5
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : defender.currentHp / defender.maxHp > 0.25
                    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                }`}
                style={{ width: `${(defender.currentHp / defender.maxHp) * 100}%` }}
              />
            </div>
            <div className="flex justify-end text-[10px] font-semibold text-zinc-400 font-mono mt-0.5">
              HP: {defender.currentHp} / {defender.maxHp}
            </div>
          </div>

          {/* Enemy Piece Graphic (Top Right) */}
          <div className="flex-1 flex justify-center items-center">
            <div
              className={`w-28 h-28 flex items-center justify-center relative transition-transform duration-300 ${
                shakePiece === 'defender' ? 'animate-bounce' : ''
              } ${flashPiece === 'defender' ? 'opacity-30' : 'opacity-100'}`}
            >
              {/* Backlit glow for the piece */}
              <div className="absolute inset-2 bg-rose-500/10 rounded-full blur-xl animate-pulse" />
              <ChessPieceIcon type={defender.piece.type} color={defender.piece.color} className="w-20 h-20 z-10" />
            </div>
          </div>
        </div>

        {/* Row 2: Player Piece Graphic & Player Status */}
        <div className="flex justify-between items-end w-full mt-6">
          {/* Player Piece Graphic (Bottom Left) */}
          <div className="flex-1 flex justify-center items-center">
            <div
              className={`w-28 h-28 flex items-center justify-center relative transition-transform duration-300 ${
                shakePiece === 'attacker' ? 'animate-bounce' : ''
              } ${flashPiece === 'attacker' ? 'opacity-30' : 'opacity-100'}`}
            >
              <div className="absolute inset-2 bg-sky-500/10 rounded-full blur-xl animate-pulse" />
              <ChessPieceIcon type={attacker.piece.type} color={attacker.piece.color} className="w-20 h-20 z-10" />
            </div>
          </div>

          {/* Player Status Card */}
          <div className="w-1/2 max-w-[280px] bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 shadow-lg flex flex-col gap-1 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-sky-400 uppercase tracking-wide">
                YOUR {getPieceName(attacker.piece.type)}
              </span>
              <div className="flex items-center gap-1">
                {getStatusBadge(attacker.status)}
                <span className="text-[10px] font-bold text-zinc-500">Lv{attacker.piece.level}</span>
              </div>
            </div>
            {/* HP Bar */}
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 shadow-inner mt-1">
              <div
                className={`h-full transition-all duration-500 ${
                  attacker.currentHp / attacker.maxHp > 0.5
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : attacker.currentHp / attacker.maxHp > 0.25
                    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                }`}
                style={{ width: `${(attacker.currentHp / attacker.maxHp) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400 mt-0.5">
              <span className="bg-zinc-800 px-1 py-0.5 rounded text-[8px] uppercase tracking-wide border border-zinc-700">
                Speed: {attacker.speed * getStageMultiplier(attacker.stages.speed)}
              </span>
              <span className="font-mono">HP: {attacker.currentHp} / {attacker.maxHp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Board */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4 md:p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Messages / Log Panel */}
        <div className="md:col-span-3 h-[130px] rounded-xl border border-zinc-800 bg-[#0a0a0d] p-3 overflow-y-auto flex flex-col gap-1 shadow-inner scrollbar-thin scrollbar-thumb-zinc-800">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`text-xs leading-relaxed font-mono ${
                i === logs.length - 1 ? 'text-zinc-100 font-bold' : 'text-zinc-500'
              }`}
            >
              &gt; {log}
            </div>
          ))}
        </div>

        {/* Moves Selection Panel */}
        <div className="md:col-span-2 flex items-center justify-center">
          {phase === 'victory_screen' ? (
            <button
              onClick={handleCloseBattle}
              className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all hover:-translate-y-0.5"
            >
              {playerWins ? 'CLAIM SQUARE & RESOLVE CLASH' : 'RESOLVE CLASH & DEFEAT'}
            </button>
          ) : phase === 'player_turn' ? (
            <div className="grid grid-cols-2 gap-2 w-full">
              {attacker.piece.moves.map((move) => (
                <button
                  key={move.id}
                  onClick={() => handlePlayerMove(move)}
                  disabled={attacker.isResting}
                  className="group relative flex flex-col items-start p-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800/80 transition-all text-left shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="w-full flex justify-between items-center mb-1">
                    <span className="font-bold text-[13px] text-zinc-100 group-hover:text-white leading-tight">
                      {move.name}
                    </span>
                    <span className={`text-[8px] font-bold px-1 rounded-sm uppercase tracking-wider ${getTypeColor(move.type)}`}>
                      {move.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 leading-snug line-clamp-2">
                    {move.description}
                  </span>
                  <div className="w-full flex justify-between items-center text-[9px] text-zinc-500 font-mono mt-1.5 border-t border-zinc-800/80 pt-1">
                    <span>PWR: {move.power > 0 ? move.power : '-'}</span>
                    <span>ACC: {move.accuracy}%</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <span className="w-6 h-6 rounded-full border-2 border-zinc-800 border-t-sky-500 animate-spin" />
              <span className="text-xs font-mono">Processing clash actions...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
