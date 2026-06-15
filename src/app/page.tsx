'use client';

import React, { useState, useEffect } from 'react';
import { GameState, Position, ChessPiece, PieceColor, Move } from '../types/game';
import { initializeBoard, getValidMoves, getChessNotation } from '../utils/chess';
import { ChessBoard } from '../components/ChessBoard';
import { BattleScreen } from '../components/BattleScreen';
import { RulesPanel } from '../components/RulesPanel';
import { Swords, RefreshCw, Trophy, Skull, Play, Volume2, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChessPieceIcon } from '../components/ChessPieceIcon';

export default function GamePage() {
  const [board, setBoard] = useState(initializeBoard());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [gameMode, setGameMode] = useState<'chess' | 'clash_prompt' | 'battle' | 'game_over'>('chess');
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [history, setHistory] = useState<string[]>(['Game started. White\'s turn.']);
  const [showRules, setShowRules] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);
  
  // Clash info
  const [clash, setClash] = useState<{
    attacker: ChessPiece;
    defender: ChessPiece;
    attackerPos: Position;
    defenderPos: Position;
  } | undefined>(undefined);

  // Trigger confetti on player victory
  useEffect(() => {
    if (gameMode === 'game_over' && winner === 'w') {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#38bdf8', '#0ea5e9', '#ffffff']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#38bdf8', '#0ea5e9', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [gameMode, winner]);

  // CPU turn trigger
  useEffect(() => {
    if (turn === 'b' && gameMode === 'chess' && !winner) {
      setCpuThinking(true);
      const timer = setTimeout(() => {
        executeCpuMove();
      }, 1500); // 1.5s thinking delay for realism
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, winner]);

  // Simple Chess CPU AI
  const executeCpuMove = () => {
    const allMoves: Move[] = [];
    const captureMoves: Move[] = [];
    const kingCaptureMoves: Move[] = [];

    // Gather all valid CPU moves
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === 'b') {
          const from = { row: r, col: c };
          const targets = getValidMoves(board, from);
          
          targets.forEach(to => {
            const move = { from, to };
            const targetPiece = board[to.row][to.col];
            if (targetPiece) {
              if (targetPiece.type === 'k') {
                kingCaptureMoves.push(move);
              } else {
                captureMoves.push(move);
              }
            } else {
              allMoves.push(move);
            }
          });
        }
      }
    }

    // If no moves, CPU has lost
    if (allMoves.length === 0 && captureMoves.length === 0 && kingCaptureMoves.length === 0) {
      setWinner('w');
      setGameMode('game_over');
      setHistory(prev => [...prev, 'Checkmate! White wins!']);
      setCpuThinking(false);
      return;
    }

    // Select move prioritizing King capture, then other captures, then random
    let selectedMove: Move;
    if (kingCaptureMoves.length > 0) {
      selectedMove = kingCaptureMoves[Math.floor(Math.random() * kingCaptureMoves.length)];
    } else if (captureMoves.length > 0 && Math.random() < 0.6) {
      // Prioritize higher value targets
      const val = (t: string) => (t === 'q' ? 4 : t === 'r' ? 3 : t === 'b' || t === 'n' ? 2 : 1);
      captureMoves.sort((a, b) => {
        const pA = board[a.to.row][a.to.col];
        const pB = board[b.to.row][b.to.col];
        return val(pB?.type ?? '') - val(pA?.type ?? '');
      });
      selectedMove = captureMoves[0];
    } else {
      const combined = [...captureMoves, ...allMoves];
      selectedMove = combined[Math.floor(Math.random() * combined.length)];
    }

    const { from, to } = selectedMove;
    const cpuPiece = board[from.row][from.col]!;
    const playerPiece = board[to.row][to.col];

    if (playerPiece) {
      // Trigger Clash!
      setClash({
        attacker: cpuPiece,
        defender: playerPiece,
        attackerPos: from,
        defenderPos: to
      });
      setGameMode('clash_prompt');
    } else {
      // Standard move
      const newBoard = [...board.map(r => [...r])];
      newBoard[to.row][to.col] = cpuPiece;
      newBoard[from.row][from.col] = null;
      
      setBoard(newBoard);
      const notation = getChessNotation(to);
      setHistory(prev => [...prev, `Black: ${getPieceName(cpuPiece.type)} to ${notation}`]);
      setTurn('w');
    }
    setCpuThinking(false);
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

  // Handle Board Square Clicks
  const handleSquareClick = (row: number, col: number) => {
    if (gameMode !== 'chess' || turn !== 'w' || cpuThinking) return;

    const clickedPiece = board[row][col];

    // If a piece is already selected
    if (selectedPos) {
      const isValid = validMoves.some(m => m.row === row && m.col === col);
      
      if (isValid) {
        const selectedPiece = board[selectedPos.row][selectedPos.col]!;
        
        if (clickedPiece) {
          // Clash!
          setClash({
            attacker: selectedPiece,
            defender: clickedPiece,
            attackerPos: selectedPos,
            defenderPos: { row, col }
          });
          setGameMode('clash_prompt');
        } else {
          // Normal Move
          const newBoard = [...board.map(r => [...r])];
          newBoard[row][col] = selectedPiece;
          newBoard[selectedPos.row][selectedPos.col] = null;
          
          setBoard(newBoard);
          const notation = getChessNotation({ row, col });
          setHistory(prev => [...prev, `White: ${getPieceName(selectedPiece.type)} to ${notation}`]);
          setSelectedPos(null);
          setValidMoves([]);
          setTurn('b');
        }
        return;
      }
    }

    // Select Player's piece
    if (clickedPiece && clickedPiece.color === 'w') {
      setSelectedPos({ row, col });
      setValidMoves(getValidMoves(board, { row, col }));
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  // Clash choice resolution
  const handleClashResponse = (action: 'attack' | 'retreat') => {
    if (action === 'retreat') {
      // Revert selection and cancel board changes
      setClash(undefined);
      setSelectedPos(null);
      setValidMoves([]);
      setGameMode('chess');
    } else {
      // Transition to Battle Arena
      setGameMode('battle');
    }
  };

  // Battle Resolution callback
  const handleBattleEnd = (
    winnerSide: 'attacker' | 'defender',
    updatedAttacker: ChessPiece,
    updatedDefender: ChessPiece
  ) => {
    if (!clash) return;

    const { attackerPos, defenderPos } = clash;
    const newBoard = [...board.map(r => [...r])];
    
    const attackName = `${updatedAttacker.color === 'w' ? 'White' : 'Black'} ${getPieceName(updatedAttacker.type)}`;
    const defendName = `${updatedDefender.color === 'w' ? 'White' : 'Black'} ${getPieceName(updatedDefender.type)}`;
    const posNotation = getChessNotation(defenderPos);

    if (winnerSide === 'attacker') {
      // Attacker wins. Occupy square. Defender faints.
      newBoard[defenderPos.row][defenderPos.col] = updatedAttacker;
      newBoard[attackerPos.row][attackerPos.col] = null;
      setHistory(prev => [...prev, `⚔️ ${attackName} defeated ${defendName} at ${posNotation}!`]);

      // Check if King was captured
      if (updatedDefender.type === 'k') {
        setWinner(updatedAttacker.color);
        setGameMode('game_over');
        setClash(undefined);
        return;
      }
    } else {
      // Defender wins. Defender holds square. Attacker faints.
      newBoard[defenderPos.row][defenderPos.col] = updatedDefender;
      newBoard[attackerPos.row][attackerPos.col] = null;
      setHistory(prev => [...prev, `🛡️ ${defendName} successfully defended square ${posNotation} against ${attackName}!`]);

      // Check if King was captured
      if (updatedAttacker.type === 'k') {
        setWinner(updatedDefender.color);
        setGameMode('game_over');
        setClash(undefined);
        return;
      }
    }

    setBoard(newBoard);
    setSelectedPos(null);
    setValidMoves([]);
    setClash(undefined);
    setGameMode('chess');
    
    // Switch turn
    setTurn(turn === 'w' ? 'b' : 'w');
  };

  // Start a new game
  const resetGame = () => {
    setBoard(initializeBoard());
    setTurn('w');
    setSelectedPos(null);
    setValidMoves([]);
    setGameMode('chess');
    setWinner(null);
    setClash(undefined);
    setHistory(['Game restarted. White\'s turn.']);
  };

  return (
    <main className="flex-1 w-full min-h-screen p-4 md:p-8 flex flex-col items-center gap-6 relative overflow-x-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] aspect-square rounded-full bg-sky-950/15 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] aspect-square rounded-full bg-rose-950/15 blur-[120px] pointer-events-none -z-10" />

      {/* Header section */}
      <header className="w-full max-w-[1200px] flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-4">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-200 to-rose-400 font-display uppercase">
              CHESS MONS
            </h1>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
            Chess Strategy meets RPG Turn-Based Battle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {showRules ? 'CLOSE RULES' : 'VIEW RULE BOOK'}
          </button>
          
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-xs font-semibold text-zinc-300 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            RESET MATCH
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Rules Panel Overlay/Bottom */}
        {showRules && (
          <div className="lg:col-span-12 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
            <RulesPanel />
          </div>
        )}

        {/* Game Area */}
        <div className="lg:col-span-8 flex flex-col items-center gap-6 justify-center w-full">
          {gameMode === 'chess' && (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Turn Banner */}
              <div className="w-full max-w-[560px] flex items-center justify-between px-4 py-2 border border-zinc-800/50 bg-zinc-950/60 rounded-xl text-xs font-semibold tracking-wide">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${turn === 'w' ? 'bg-sky-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
                  <span className="text-zinc-400">TURN:</span>
                  <span className={turn === 'w' ? 'text-sky-400' : 'text-rose-400'}>
                    {turn === 'w' ? 'YOURS (WHITE)' : 'CPU THINKING...'}
                  </span>
                </div>
                {cpuThinking && (
                  <span className="text-[10px] text-zinc-500 font-mono italic animate-pulse">Calculating strategy...</span>
                )}
              </div>

              {/* Chess Board */}
              <ChessBoard
                board={board}
                turn={turn}
                selectedPosition={selectedPos}
                validMoves={validMoves}
                onSquareClick={handleSquareClick}
                playerColor="w"
              />
            </div>
          )}

          {gameMode === 'clash_prompt' && clash && (
            <div className="w-full max-w-[560px] border border-zinc-800 bg-zinc-950 p-6 rounded-2xl flex flex-col gap-6 shadow-2xl items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">A Clash has Erupt!</h2>
                <p className="text-xs text-zinc-400 max-w-sm">
                  {clash.attacker.color === 'w' ? 'Your' : 'Enemy'}{' '}
                  <span className="text-white font-bold">{getPieceName(clash.attacker.type)}</span> at{' '}
                  <span className="font-mono text-zinc-300">{getChessNotation(clash.attackerPos)}</span> has met{' '}
                  {clash.defender.color === 'w' ? 'your' : 'enemy'}{' '}
                  <span className="text-white font-bold">{getPieceName(clash.defender.type)}</span> at{' '}
                  <span className="font-mono text-zinc-300">{getChessNotation(clash.defenderPos)}</span>.
                </p>
              </div>

              {/* Visual matchup graphics */}
              <div className="w-full flex items-center justify-center gap-4 border border-zinc-800 bg-zinc-900/30 py-4 px-6 rounded-xl">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
                    <ChessPieceIcon type={clash.attacker.type} color={clash.attacker.color} className="w-10 h-10" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">Attacker (Lv{clash.attacker.level})</span>
                </div>
                
                <span className="text-xs font-mono font-bold text-zinc-600">VS</span>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
                    <ChessPieceIcon type={clash.defender.type} color={clash.defender.color} className="w-10 h-10" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">Defender (Lv{clash.defender.level})</span>
                </div>
              </div>

              {/* Action buttons */}
              {clash.attacker.color === 'w' ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => handleClashResponse('retreat')}
                    className="py-3 px-4 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 rounded-xl transition-all"
                  >
                    RETREAT PIECE
                  </button>
                  <button
                    onClick={() => handleClashResponse('attack')}
                    className="py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-xs font-bold text-white rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all"
                  >
                    INITIATE BATTLE
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-[11px] text-rose-400 animate-pulse font-semibold mb-2">
                    The CPU is attacking your piece! You must defend!
                  </p>
                  <button
                    onClick={() => handleClashResponse('attack')}
                    className="w-full py-3 px-6 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all"
                  >
                    ENTER BATTLE ARENA
                  </button>
                </div>
              )}
            </div>
          )}

          {gameMode === 'battle' && clash && (
            <div className="w-full flex justify-center animate-in fade-in duration-300">
              <BattleScreen
                attackerPiece={clash.attacker}
                defenderPiece={clash.defender}
                attackerNotation={getChessNotation(clash.attackerPos)}
                defenderNotation={getChessNotation(clash.defenderPos)}
                onBattleEnd={handleBattleEnd}
              />
            </div>
          )}

          {gameMode === 'game_over' && (
            <div className="w-full max-w-[560px] border border-zinc-800 bg-zinc-950 p-8 rounded-3xl flex flex-col gap-6 shadow-2xl items-center text-center animate-in zoom-in-95 duration-200">
              {winner === 'w' ? (
                <div className="w-20 h-20 rounded-full bg-sky-950/40 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_25px_rgba(14,165,233,0.3)]">
                  <Trophy className="w-10 h-10 animate-bounce" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]">
                  <Skull className="w-10 h-10 animate-pulse" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-extrabold uppercase tracking-widest text-white font-display">
                  {winner === 'w' ? 'VICTORY SECURED!' : 'DEFEATED!'}
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm">
                  {winner === 'w'
                    ? 'Outstanding strategy! You fainted the enemy King and emerged victorious!'
                    : 'The enemy captured your King. Revamp your strategy and try again!'}
                </p>
              </div>

              <button
                onClick={resetGame}
                className="w-full py-4 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-bold text-white rounded-xl shadow-lg transition-all"
              >
                PLAY NEW MATCH
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Info Section */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Match Log and History */}
          <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md shadow-lg">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              MOVE LOG HISTORY
            </span>
            <div className="h-[250px] border border-zinc-850 bg-[#07070a]/90 p-3 rounded-xl overflow-y-auto flex flex-col gap-2 shadow-inner scrollbar-thin scrollbar-thumb-zinc-800">
              {history.map((log, index) => (
                <div key={index} className="text-xs leading-normal font-mono text-zinc-400 border-b border-zinc-900 pb-1 last:border-0 last:text-zinc-100 last:font-bold">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Type Helper / Quick Stats */}
          <div className="border border-zinc-800 bg-zinc-950/60 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md shadow-lg">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              QUICK PIECE GLANCE
            </span>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Pawn (Steel)</span>
                <span className="text-emerald-400">Beats Dark (Queen)</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Knight (Fighter)</span>
                <span className="text-emerald-400">Beats Steel & Fire</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Bishop (Psychic)</span>
                <span className="text-emerald-400">Beats Fighter (Knight)</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Rook (Fire)</span>
                <span className="text-emerald-400">Beats Steel (Pawn)</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-2">
                <span className="text-zinc-500">Queen (Dark)</span>
                <span className="text-emerald-400">Beats Psychic (Bishop)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-amber-400 pt-1">
                <span>* Winning triggers stats boost +10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
