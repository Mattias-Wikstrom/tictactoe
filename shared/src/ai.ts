import { BoardState, Mark, Move, Position, makeMove, evaluateWinner } from "./gameLogic";

export function minimax(
  state: BoardState,
  numInRowNeeded: number,
  depth: number,
  isMaximizing: boolean,
  aiMark: Mark
): number {
  const winner = evaluateWinner(state, numInRowNeeded);

  if (winner !== null) {
    if (winner === aiMark) { 
      return 1;
    } else if (winner === "draw") {
      return 0;
    } else {
      return -1; // opponent won
    }
  }

  const boardType = state.boardType;
  const currentMark: Mark = isMaximizing ? aiMark : (aiMark === "X" ? "O" : "X");

  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (let row = 0; row < boardType.numRows; row++) {
    for (let col = 0; col < boardType.numCols; col++) {
      const pos = new Position(boardType, row, col);
      if (state.getSquare(pos) === " ") {
        const newState = makeMove(state, new Move(pos, currentMark));
        const result = minimax(newState, numInRowNeeded, depth + 1, !isMaximizing, aiMark);

        if (isMaximizing) {
          bestScore = Math.max(bestScore, result);
        } else {
          bestScore = Math.min(bestScore, result);
        }
      }
    }
  }

  return bestScore;
}

export function findBestMove(
  state: BoardState,
  numInRowNeeded: number,
  aiMark: Mark
): Position | null {
  const boardType = state.boardType;
  let bestScore = -Infinity;
  let bestPos: Position | null = null;

  for (let row = 0; row < boardType.numRows; row++) {
    for (let col = 0; col < boardType.numCols; col++) {
      const pos = new Position(boardType, row, col);
      if (state.getSquare(pos) === " ") {
        const newState = makeMove(state, new Move(pos, aiMark));

        // After AI’s move, it’s opponent’s turn → minimizing
        const score = minimax(newState, numInRowNeeded, 0, false, aiMark);

        if (score > bestScore) {
          bestScore = score;
          bestPos = pos;
        }
      }
    }
  }

  return bestPos;
}
