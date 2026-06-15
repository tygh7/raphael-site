import { BoardState, ChessPiece, PieceColor, PieceType, Position } from '../types/game';
import { createChessPiece } from './pokemon';

// Standard chess board setup
export function initializeBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

  const majorRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  // Setup Black
  for (let col = 0; col < 8; col++) {
    board[0][col] = createChessPiece(majorRow[col], 'b', col);
    board[1][col] = createChessPiece('p', 'b', col + 8);
  }

  // Setup White
  for (let col = 0; col < 8; col++) {
    board[6][col] = createChessPiece('p', 'w', col + 8);
    board[7][col] = createChessPiece(majorRow[col], 'w', col);
  }

  return board;
}

// Check if position is inside the board
export function isOnBoard(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Generate valid moves for a piece on the board
export function getValidMoves(board: BoardState, from: Position): Position[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const color = piece.color;
  const oppositeColor = color === 'w' ? 'b' : 'w';

  switch (piece.type) {
    case 'p': {
      const direction = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // 1 square forward
      const oneForward = from.row + direction;
      if (isOnBoard(oneForward, from.col) && !board[oneForward][from.col]) {
        moves.push({ row: oneForward, col: from.col });

        // 2 squares forward from start
        const twoForward = from.row + 2 * direction;
        if (from.row === startRow && isOnBoard(twoForward, from.col) && !board[twoForward][from.col]) {
          moves.push({ row: twoForward, col: from.col });
        }
      }

      // Diagonal captures (meet clashes)
      const diagonalCols = [from.col - 1, from.col + 1];
      for (const col of diagonalCols) {
        if (isOnBoard(oneForward, col)) {
          const target = board[oneForward][col];
          if (target && target.color === oppositeColor) {
            moves.push({ row: oneForward, col });
          }
        }
      }
      break;
    }

    case 'n': {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];

      for (const [rOff, cOff] of knightOffsets) {
        const targetRow = from.row + rOff;
        const targetCol = from.col + cOff;
        if (isOnBoard(targetRow, targetCol)) {
          const target = board[targetRow][targetCol];
          if (!target || target.color === oppositeColor) {
            moves.push({ row: targetRow, col: targetCol });
          }
        }
      }
      break;
    }

    case 'b': {
      const directions = [
        [-1, -1], [-1, 1], [1, -1], [1, 1]
      ];
      addSlidingMoves(board, from, directions, oppositeColor, moves);
      break;
    }

    case 'r': {
      const directions = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];
      addSlidingMoves(board, from, directions, oppositeColor, moves);
      break;
    }

    case 'q': {
      const directions = [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
        [-1, 0], [1, 0], [0, -1], [0, 1]
      ];
      addSlidingMoves(board, from, directions, oppositeColor, moves);
      break;
    }

    case 'k': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];

      for (const [rDir, cDir] of directions) {
        const targetRow = from.row + rDir;
        const targetCol = from.col + cDir;
        if (isOnBoard(targetRow, targetCol)) {
          const target = board[targetRow][targetCol];
          if (!target || target.color === oppositeColor) {
            moves.push({ row: targetRow, col: targetCol });
          }
        }
      }
      break;
    }
  }

  return moves;
}

// Helper for sliding pieces (Rook, Bishop, Queen)
function addSlidingMoves(
  board: BoardState,
  from: Position,
  directions: number[][],
  oppositeColor: PieceColor,
  moves: Position[]
): void {
  for (const [rDir, cDir] of directions) {
    let row = from.row + rDir;
    let col = from.col + cDir;

    while (isOnBoard(row, col)) {
      const target = board[row][col];
      if (!target) {
        moves.push({ row, col });
      } else {
        if (target.color === oppositeColor) {
          moves.push({ row, col });
        }
        break; // Blocked by this piece
      }
      row += rDir;
      col += cDir;
    }
  }
}

// Convert position to Chess coordinate string (e.g. e4)
export function getChessNotation(pos: Position): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  return `${files[pos.col]}${ranks[pos.row]}`;
}
