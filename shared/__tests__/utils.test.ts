import { BoardType, Position, BoardState, Game, Move, checkForNInRow, linesOnBoard, evaluateWinner } from "../src/gameLogic";
import { findBestMove } from "../src/ai";

describe("BoardType class", () => {
  it("should not allow 0x0 boards", () => {
    expect(() => new BoardType(0, 0)).toThrow();
  });
  
  it("should allow 1x1 boards", () => {
    expect(() => new BoardType(1, 1)).not.toThrow();
  });
});

describe("Position class", () => {
  it("must not be outside board", () => {
    expect(() => new Position(new BoardType(3, 3), -1, 0)).toThrow();
    expect(() => new Position(new BoardType(3, 3), 5, 0)).toThrow();
  });
});

describe("BoardState class", () => {
  it("defaults to empty squares", () => {
    const boardState = new BoardState(new BoardType(3, 3));

    expect(boardState.getSquare(new Position(boardState.boardType, 0, 0))).toBe(" ");
    expect(boardState.getSquare(new Position(boardState.boardType, 2, 0))).toBe(" ");
  });
});

describe("Game class", () => {
  it("can make move", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 1, 2), "X"));

    expect(game.currentState().getSquare(new Position(game.boardType, 1, 2))).toBe("X");
  });
  
  it("cannot make same move twice", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 1, 2), "X"));
    expect(() => game.makeMove(new Move(new Position(game.boardType, 1, 2), "X"))).toThrow();
  });
  
  it("X starts", () => {
    const game = new Game(new BoardType(3, 3), 3);

    expect(game.whoseTurn()).toBe("X");
  });
  
  it("O makes move #2", () => {
    const game = new Game(new BoardType(3, 3), 3);
    
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));

    expect(game.whoseTurn()).toBe("O");
  });
  
  it("Cannot make move during opponent's turn", () => {
    const game = new Game(new BoardType(3, 3), 3);
    
    expect(() => game.makeMove(new Move(new Position(game.boardType, 2, 0), "O"))).toThrow();
  });
  
  it("History increases for each move", () => {
    const game = new Game(new BoardType(3, 3), 3);

    expect(game.history().length).toBe(0);
  
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));
  
    expect(game.history().length).toBe(1);

    game.makeMove(new Move(new Position(game.boardType, 2, 2), "O"));
    
    expect(game.history().length).toBe(2);
  });
  
  it("History should record each move", () => {
    const game = new Game(new BoardType(3, 3), 3);
    
    const firstMove = new Move(new Position(game.boardType, 2, 0), "X");
    const secondMove = new Move(new Position(game.boardType, 2, 2), "O");
  
    game.makeMove(firstMove);
  
    let history = game.history();

    expect(history[history.length - 1][1]).toEqual(firstMove);
    
    game.makeMove(secondMove);
    
    history = game.history();

    expect(history[history.length - 1][1]).toEqual(secondMove);
  });
  
  it("History should record each game state", () => {
    const game = new Game(new BoardType(3, 3), 3);
    
    const initialState = game.currentState();
  
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));
  
    const stateAfterFirstMove = game.currentState();
    
    game.makeMove(new Move(new Position(game.boardType, 2, 2), "O"));
    
    const history = game.history();

    expect(history.length).toBe(2);
    expect(history[0][0]).toEqual(initialState);
    expect(history[1][0]).toEqual(stateAfterFirstMove);
  });
  
  it("Available squares should decrease", () => {
    const game = new Game(new BoardType(3, 3), 3);
    
    expect(game.currentState().numSquaresTaken()).toBe(0);
    expect(game.currentState().numSquaresLeft()).toBe(9);

    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));

    expect(game.currentState().numSquaresTaken()).toBe(1);
    expect(game.currentState().numSquaresLeft()).toBe(8);

    game.makeMove(new Move(new Position(game.boardType, 2, 2), "O"));
    
    expect(game.currentState().numSquaresTaken()).toBe(2);
    expect(game.currentState().numSquaresLeft()).toBe(7);    
  });
});

describe("linesOnBoard function", () => {
  it("Correct number of lines for 3x3 board", () => {
    const lines = linesOnBoard(3, 3);

    expect(lines).toHaveLength(3 + 3 + 2 + 2 * 2 + 2 * 2);

    // console.log(lines);
  });
  
  it("Correct number of lines for 4x4 board", () => {
    const lines = linesOnBoard(4, 4);

    expect(lines).toHaveLength(4 + 4 + 2 + 2 * 3 + 2 * 3);
  });
});

describe("checkForNInRow function", () => {
  it("Find nothing at start of game", () => {
    const game = new Game(new BoardType(3, 3), 3);

    expect(checkForNInRow(game.currentState(), game.numInRowNeeded)).toHaveLength(0);
  });

  it("Find 3-in-a-row", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 2, 2), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));

    expect(checkForNInRow(game.currentState(), game.numInRowNeeded)).toHaveLength(1);
  });
  
  it("Find diagonal 3-in-a-row", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 2), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 2), "X"));

    expect(checkForNInRow(game.currentState(), game.numInRowNeeded)).toHaveLength(1);
  });
  
  it("Find diagonal 3-in-a-row, backward diagonal", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 2), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 2), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));

    expect(checkForNInRow(game.currentState(), game.numInRowNeeded)).toHaveLength(1);
  });
});

describe("evaluateWinner function", () => {
  it("Returns 'X' if 'X' has won", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 2), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 2), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));

    expect(evaluateWinner(game.currentState(), game.numInRowNeeded)).toBe('X');
  });
  
  it("Returns 'O' if 'O' has won", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 2), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 2), "X"));
    game.makeMove(new Move(new Position(game.boardType, 2, 1), "O"));

    expect(evaluateWinner(game.currentState(), game.numInRowNeeded)).toBe('O');
  });
  
  it("Returns 'draw' if draw", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 1), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 0), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 2), "O"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 2), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 2, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 2, 2), "X"));

    expect(evaluateWinner(game.currentState(), game.numInRowNeeded)).toBe('draw');
  });
});

describe("evaluateWinner function", () => {
  it("Returns null if no player has won", () => {
    const game = new Game(new BoardType(3, 3), 3);

    game.makeMove(new Move(new Position(game.boardType, 0, 2), "X"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "O"));
    
    expect(evaluateWinner(game.currentState(), game.numInRowNeeded)).toBeNull();
  });
});

describe("findBestMove function", () => {
  it("AI should win if it has a winning move", () => {
    const game = new Game(new BoardType(3, 3), 3);

    // X is AI
    game.makeMove(new Move(new Position(game.boardType, 0, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 0), "O"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "O"));

    const bestPos = findBestMove(game.currentState(), game.numInRowNeeded, "X");
    expect(bestPos).toEqual(new Position(game.boardType, 0, 2)); // Winning move
  });

  it("AI should block opponent from winning", () => {
    const game = new Game(new BoardType(3, 3), 3);

    // O is AI
    game.makeMove(new Move(new Position(game.boardType, 0, 0), "X"));
    game.makeMove(new Move(new Position(game.boardType, 1, 1), "O"));
    game.makeMove(new Move(new Position(game.boardType, 0, 1), "X"));

    const bestPos = findBestMove(game.currentState(), game.numInRowNeeded, "O");
    expect(bestPos).toEqual(new Position(game.boardType, 0, 2)); // Must block X
  });
});