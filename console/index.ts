import readline from "readline";
import { BoardType, Game, Mark, Move, Position, evaluateWinner } from "../shared/src/gameLogic";
import { findBestMove } from "../shared/src/ai";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function printBoard(game: Game) {
  const { numRows, numCols } = game.boardType;

  for (let row = 0; row < numRows; row++) {
    let line = "";

    for (let col = 0; col < numCols; col++) {
      const mark = game.currentState().getSquare(new Position(game.boardType, row, col));
      
      line += mark === " " ? "." : mark;
      
      if (col < numCols - 1) line += "|";
    }

    console.log(line);

    if (row < numRows - 1) console.log("-".repeat(line.length));
  }

  console.log();
}

async function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function play() {
  const game = new Game(new BoardType(3, 3), 3);
  console.log("Welcome to Tic-Tac-Toe!");

  let humanMarks : Mark = "X";
  let aiMarks : Mark = "O";

  while (true) {
    let answer = await ask("\nWould you like to be 'X' or 'O': ");

    answer = answer.trim();

    if (answer == "X" || answer == "x") {
      humanMarks = "X";
      aiMarks = "O";
      break;
    }

    if (answer == "O" || answer == "o") {
      humanMarks = "O";
      aiMarks = "X";
      break;
    }
  }
  
  if (humanMarks == "X") {
    console.log();
    printBoard(game);
  }

  while (true) {
    if (game.whoseTurn() == humanMarks) {  
      // Human move
      const answer = await ask("Enter your move as row,col (e.g. 0,2): ");
      const [row, col] = answer.split(",").map((n) => parseInt(n.trim()));
      
      try {
        game.makeMove(new Move(new Position(game.boardType, row, col), humanMarks));
      } catch (e) {
        console.log("Invalid move:", (e as any).message);
        continue;
      }

      printBoard(game);
    } else {
      // AI move
      const bestPos = findBestMove(game.currentState(), game.numInRowNeeded, aiMarks);
      if (bestPos) {
        game.makeMove(new Move(bestPos, aiMarks));
        
        console.log("AI plays:");
        printBoard(game);
      }
    }

    const winner = evaluateWinner(game.currentState(), game.numInRowNeeded);
    if (winner !== null) {
      if (winner === humanMarks) {
        console.log("You win!");
      } else if (winner === aiMarks) {
        console.log("AI wins!");
      } else {
        console.log("Draw!");
      }
      break;
    }
  }
}

play();
