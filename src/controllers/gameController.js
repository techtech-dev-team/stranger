const Game = require("../models/Game");

const checkWinner = (board, player) => {
  const winConditions = [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],
    [board[0][0], board[1][1], board[2][2]],
    [board[2][0], board[1][1], board[0][2]],
  ];
  return winConditions.some(condition => condition.every(cell => cell === player));
};

const getEmptyPositions = (board) => {
  const emptyPositions = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === " ") {
        emptyPositions.push([i, j]);
      }
    }
  }
  return emptyPositions;
};

const computerMove = (board, difficulty) => {
  const emptyPositions = getEmptyPositions(board);
  if (difficulty === "easy") {
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  } else if (difficulty === "medium") {
    for (const position of emptyPositions) {
      const [i, j] = position;
      board[i][j] = "O";
      if (checkWinner(board, "O")) {
        board[i][j] = " ";
        return position;
      }
      board[i][j] = " ";
    }
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  } else if (difficulty === "hard") {
    // Implement a more advanced strategy (e.g., minimax algorithm)
    // For simplicity, we'll use the medium strategy for now
    return computerMove(board, "medium");
  }
};

exports.startGame = async (req, res) => {
  const { difficulty } = req.body;
  if (!difficulty) {
    return res.status(400).send("Difficulty level is required");
  }
  const game = new Game({
    board: [[" ", " ", " "], [" ", " ", " "], [" ", " ", " "]],
    currentPlayer: "X",
    difficulty,
    moveHistory: [], // Initialize move history
  });
  await game.save();
  res.send(game);
};

exports.makeMove = async (req, res) => {
  const { gameId, row, col } = req.body;
  const game = await Game.findById(gameId);
  if (!game) {
    return res.status(404).send("Game not found");
  }
  if (game.board[row][col] !== " ") {
    return res.status(400).send("Position already taken");
  }

  // Store the move
  game.moveHistory.push({ player: game.currentPlayer, row, col });
  game.board[row][col] = game.currentPlayer;

  if (checkWinner(game.board, game.currentPlayer)) {
    game.winner = game.currentPlayer;
  } else if (getEmptyPositions(game.board).length === 0) {
    // Check for near-draw situation before declaring a tie
    if (game.difficulty === "hard") {
      await disappearMoves(game);
    } else {
      game.winner = "Tie";
    }
  } else {
    game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    if (game.currentPlayer === "O") {
      const [i, j] = computerMove(game.board, game.difficulty);
      game.board[i][j] = "O";
      game.moveHistory.push({ player: "O", row: i, col: j }); // Store computer move
      if (checkWinner(game.board, "O")) {
        game.winner = "O";
      } else if (getEmptyPositions(game.board).length === 0) {
        if (game.difficulty === "hard") {
          await disappearMoves(game);
        } else {
          game.winner = "Tie";
        }
      } else {
        game.currentPlayer = "X";
      }
    }
  }
  await game.save();
  res.send(game);
};