import React from 'react';
import { BoardState, Position, PieceColor } from '../types/game';
import { ChessPieceIcon } from './ChessPieceIcon';
import { getChessNotation } from '../utils/chess';

interface ChessBoardProps {
  board: BoardState;
  turn: PieceColor;
  selectedPosition: Position | null;
  validMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
  playerColor: PieceColor;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  turn,
  selectedPosition,
  validMoves,
  onSquareClick,
  playerColor
}) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Helper to determine if a position is in validMoves
  const isValidMove = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  // Helper to determine if a position is selected
  const isSelected = (row: number, col: number) => {
    return selectedPosition !== null && selectedPosition.row === row && selectedPosition.col === col;
  };

  // We should respect the player's perspective (flip board if player is Black)
  const rows = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div className="relative w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-[#0d0d12] shadow-2xl p-4 md:p-6 backdrop-blur-xl">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full gap-1 rounded-lg overflow-hidden bg-zinc-950">
        {rows.map((row) =>
          cols.map((col) => {
            const piece = board[row][col];
            const isDark = (row + col) % 2 === 1;
            const selected = isSelected(row, col);
            const valid = isValidMove(row, col);
            const opponentPiece = piece && piece.color !== turn;
            const isClashTarget = valid && opponentPiece;
            
            // Square status styling
            let squareBg = isDark ? 'bg-zinc-900' : 'bg-zinc-800/60';
            let overlayClass = '';
            
            if (selected) {
              overlayClass = 'ring-2 ring-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.4)] z-10 bg-cyan-950/20';
            } else if (isClashTarget) {
              overlayClass = 'ring-2 ring-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.4)] z-10 animate-pulse bg-rose-950/30 cursor-pointer';
            } else if (valid) {
              overlayClass = 'hover:bg-emerald-950/20 cursor-pointer';
            }

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onSquareClick(row, col)}
                className={`relative flex items-center justify-center transition-all duration-200 select-none group ${squareBg} ${overlayClass}`}
              >
                {/* Render coordinate letters for edges (bottom row and left column) */}
                {((playerColor === 'w' && row === 7) || (playerColor === 'b' && row === 0)) && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-semibold text-zinc-500 uppercase">
                    {files[col]}
                  </span>
                )}
                {((playerColor === 'w' && col === 0) || (playerColor === 'b' && col === 7)) && (
                  <span className="absolute top-1 left-1 text-[9px] font-semibold text-zinc-500">
                    {ranks[row]}
                  </span>
                )}

                {/* Render standard green indicator for valid moves (if empty square) */}
                {valid && !piece && (
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
                )}

                {/* Render piece */}
                {piece && (
                  <div className="relative w-4/5 h-4/5 flex flex-col items-center justify-center z-10">
                    <ChessPieceIcon
                      type={piece.type}
                      color={piece.color}
                      className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                      glow={piece.color === turn}
                    />

                    {/* Level badge */}
                    {piece.level > 1 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center px-1 py-0.5 rounded text-[8px] font-bold leading-none bg-zinc-950 border border-amber-500/50 text-amber-400 shadow-md">
                        L{piece.level}
                      </span>
                    )}

                    {/* Mini Health Bar (only if damaged to reduce clutter) */}
                    {piece.currentHp < piece.maxHp && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-11/12 h-1.5 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-300 ${
                            piece.currentHp / piece.maxHp > 0.5
                              ? 'bg-emerald-500'
                              : piece.currentHp / piece.maxHp > 0.2
                              ? 'bg-amber-500'
                              : 'bg-rose-600'
                          }`}
                          style={{ width: `${(piece.currentHp / piece.maxHp) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
