// Note: The code below has been written to illustrate how code can be
// made well-structured, not to illustrate best practices when it comes 
// to making code efficient. This a toy problem in any case.
// TODO: Run code in profiler and check where it is spending most of its time
import { ListTokenSource } from "antlr4ng";

// A Mark is either "X" or "O"
export type Mark = "X" | "O";

export type MarkOrEmpty = Mark | " ";

function assertIsIntegerGreaterThanK(n: number, k : number): void {
  if (!Number.isInteger(n) || n <= k) {
    throw new Error('Value must be an integer greater than ' + k + '.');
  }
}

function assertIsIntegerBetween(n: number, min : number, max : number): void {
  if (!Number.isInteger(n) || n < min || n >= max) {
    throw new Error('Value must be an integer within the valid range.');
  }
}

export class BoardType {
  constructor(public readonly numRows: number, public readonly numCols: number) {
    assertIsIntegerGreaterThanK(numRows, 0);
    assertIsIntegerGreaterThanK(numCols, 0);
  }

  public equals(other: BoardType): boolean {
    return this.numRows === other.numRows
      && this.numCols === other.numCols;
  }
}

export class Position {
  constructor(public readonly boardType: BoardType, public readonly row: number, public readonly col: number) {
    assertIsIntegerBetween(row, 0, boardType.numRows);
    assertIsIntegerBetween(col, 0, boardType.numCols);
  }

  public equals(other: Position): boolean {
    return this.boardType === other.boardType 
      && this.row === other.row
      && this.col === other.col;
  }

  public key() : PositionKey {
    return `${this.row},${this.col}:${this.boardType.numRows},${this.boardType.numCols}`;
  }
}

export type PositionKey = string;

export class BoardState {
  private readonly squares : Map<PositionKey, Mark>;

  constructor(public readonly boardType: BoardType, _squares : Map<PositionKey, Mark> = new Map<PositionKey, Mark>()) { 
    /*for (const [_pos, value] of _squares) {
      if (!_pos.boardType.equals(boardType)) {
        throw new Error('Mismatch in board types.');
      }
    }*/
    
    this.squares = _squares;
  }

  getSquare(pos: Position): MarkOrEmpty {
    for (const [_pos, value] of this.squares) {
      if (_pos == pos.key()) {
        return value;
      }
    }

    return " ";
  }

  numSquaresTaken() : number {
    return this.squares.size;
  }

  numSquaresLeft() : number {
    return this.boardType.numRows * this.boardType.numCols - this.numSquaresTaken();
  }
}

export class Move {
  constructor(public readonly position: Position, public readonly mark : Mark) { }

  public equals(other: Move): boolean {
    return this.position.equals(other.position)
      && this.mark === other.mark;
  }
}

export class Game {
  constructor(public readonly boardType: BoardType, public readonly numInRowNeeded : number) { 
      assertIsIntegerGreaterThanK(numInRowNeeded, 1);

      this._currentState = new BoardState(boardType);
  }

  private _history : Array<[BoardState, Move]> = [];

  private _playerToMakeNextMove : Mark = "X";

  private _currentState : BoardState;

  currentState() : BoardState {
    return this._currentState;
  }

  history() : Array<[BoardState, Move]> {
    return this._history.slice();
  }

  whoseTurn() : Mark {
    return this._playerToMakeNextMove;
  }

  makeMove(move: Move) : void {
    if (move.mark !== this._playerToMakeNextMove) {
      throw new Error("Attempt to make a move for " + move.mark + " during opponent's turn");
    }

    let oldState = this._currentState;
    let newState = makeMove(oldState, move);

    this._currentState = newState;
    this._history.push([oldState, move]);
    this._playerToMakeNextMove = this._playerToMakeNextMove == "X" ? "O" : "X";
  }
}

// Return a new board state where a move has been made
// The old board state is not modified
export function makeMove(oldState : BoardState, move: Move): BoardState {
  if (oldState.getSquare(move.position) !== " ") {
    throw new Error("Square already taken");
  }

  let squares : Map<PositionKey, Mark> = new Map<PositionKey, Mark>();

  const boardType = oldState.boardType, numRows = boardType.numRows, numCols = boardType.numCols;
  
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const oldValue = oldState.getSquare(new Position(boardType, row, col));

      var oldLength = squares.size;
      if (row == move.position.row && col == move.position.col) {
        squares.set(new Position(boardType, row, col).key(), move.mark);

        if (oldLength == squares.size) {
          throw new Error("Length is still " + squares.size);
        }
      } else if (oldValue != " ") {
        squares.set(new Position(boardType, row, col).key(), oldValue);
      }
    }
  }

  return new BoardState(oldState.boardType, squares);
}

// Check if the board is full
export function isFull(state : BoardState): boolean {
  const boardType = state.boardType, numRows = boardType.numRows, numCols = boardType.numCols;
  
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      if (state.getSquare(new Position(boardType, row, col)) === " ") {
        return false;
      }
    }
  }

  return true;
}

// Find all the 'lines' on the board
// Lines can be horizonal, vertical, or diagonal
// Each line is constrained by the board size but 
// extends as far as possible in each direction
export function linesOnBoard(numRows : number, numCols : number) : Array<Array<[number, number]>>
{
  let lines : Array<Array<[number, number]>> = [];

  // Collect rows
  for (let row = 0; row < numRows; row++)
  {
    let line : Array<[number, number]> = [];

    for (let col = 0; col < numCols; col++)
    {
      line.push([row, col]);    
    }

    lines.push(line);
  }

  // Collect columns
  for (let col = 0; col < numCols; col++)
  {
    let line : Array<[number, number]> = [];

    for (let row = 0; row < numRows; row++)
    {
      line.push([row, col]);  
    }

    lines.push(line);
  }

  // For purposes of checking diagonals, we will think of a non-square
  // board as being extended into a square board
  let maxLimit = Math.max(numRows, numCols);

  // Collect forward diagonals
  for (let colStart = -maxLimit; colStart < maxLimit; colStart++)
  {
    // Note: The code will loop through squares that are off the board 
    // but only include those that are within the board
    // Starting at -maxLimit is not a mistake

    let line : Array<[number, number]> = []; // The squares in the diagonal

    // Start at the top. Both the row and the column /increase/ as we loop 
    // through a forward diagonal
    for (let row = 0; row < maxLimit; row++)
    {
      let col = colStart + row;

      // Skip squares that are off the board
      if (row < 0 || row >= numRows) {
        continue;
      }

      if (col < 0 || col >= numCols) {
        continue;
      }

      line.push([row, col]); // Add square to diagonal
    }

    if (line.length > 0) {
      lines.push(line); // Add non-empty diagonal
    }
  }

  // Collect backward diagonals
  for (let colStart = 0; colStart < 2 * maxLimit; colStart++)
  {
    // Note: The code will loop through squares that are off the board 
    // but only include those that are within the board
    // Ending at 2 * maxLimit is not a mistake

    let line : Array<[number, number]> = []; // The squares in the diagonal

    // Start at the top. Both the row and the column /decrease/ as we loop 
    // through a forward diagonal
    for (let row = 0; row < maxLimit; row++)
    {
      let col = colStart - row;

      // Skip squares that are off the board
      if (row < 0 || row >= numRows) {
        continue;
      }
      
      if (col < 0 || col >= numCols) {
        continue;
      }

      line.push([row, col]); // Add square to diagonal
    }
    
    if (line.length > 0) {
      lines.push(line); // Add non-empty diagonal
    }
  }

  return lines;
}

export function checkForNInRow(state : BoardState, numInRowNeeded : number) : Array<Array<[number, number]>> {
  if (!Number.isInteger(numInRowNeeded) || numInRowNeeded <= 1) {
    throw new Error('numInRowNeeded must be an integer greater than 1.');
  }

  const boardType = state.boardType, numRows = boardType.numRows, numCols = boardType.numCols;

  let lines : Array<Array<[number, number]>> = linesOnBoard(numRows, numCols);

  let matches : Array<Array<[number, number]>> = [];

  for (let line of lines) {
    let numOfSameKindFound = 0;
    let markOrEmpty : MarkOrEmpty = " ";
    let _squares : Array<[number, number]> = [];

    for (let square of line) {
      let _markOrEmpty = state.getSquare(new Position(state.boardType, square[0], square[1]));

      if (_markOrEmpty == markOrEmpty) {
        // Found same mark as last time, so increase counter
        numOfSameKindFound++;
        _squares.push(square);

        if (markOrEmpty != null && markOrEmpty != " " && numOfSameKindFound >= numInRowNeeded) {

          if (numOfSameKindFound > numInRowNeeded) {
            matches.pop(); // Forget the last match; it turns out there is an even longer match that we should use instead
          }
          
          matches.push(_squares);
        }
      } else {
        // Start counting 
        numOfSameKindFound = 1;
        markOrEmpty = _markOrEmpty;
        _squares = [];
        _squares.push(square);
      }
    }
  }

  return matches;
}

// Return "X" if X won, "O" if O won, "draw" if board is full, or null if game not over
//
// Note: The function will arbitrarily select one of the two players as the winner 
//       in cases where 'both players have won.' For example, either player could be selected here:
//         O|O|O
//         -----
//         X|X|X
//         -----
//         .|.|.
//       Game states such as this one will of course never arise during ordinary game play.
export function evaluateWinner(state: BoardState, numInRowNeeded: number): Mark | "draw" | null {
  const matches = checkForNInRow(state, numInRowNeeded);
  
  if (matches.length > 0) {
    const firstMatch = matches[0];
    const firstMark = state.getSquare(new Position(state.boardType, firstMatch[0][0], firstMatch[0][1]));
    
    return firstMark as Mark;
  }

  if (isFull(state)) return "draw";

  return null;
}