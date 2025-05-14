const Game = require("../models/Game");

// Check if there's a winner based on dynamic board size
const checkWinner = (board, player) => {
  const size = board.length;

  // Check rows
  for (let i = 0; i < size; i++) {
    if (board[i].every(cell => cell === player)) {
      return true;
    }
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    let column = true;
    for (let i = 0; i < size; i++) {
      if (board[i][j] !== player) {
        column = false;
        break;
      }
    }
    if (column) return true;
  }

  // Check main diagonal
  let diagonal1 = true;
  for (let i = 0; i < size; i++) {
    if (board[i][i] !== player) {
      diagonal1 = false;
      break;
    }
  }
  if (diagonal1) return true;

  // Check other diagonal
  let diagonal2 = true;
  for (let i = 0; i < size; i++) {
    if (board[i][size - 1 - i] !== player) {
      diagonal2 = false;
      break;
    }
  }
  if (diagonal2) return true;

  return false;
};

// For 4×4 and 6×6, also check for partial win conditions (e.g., 3 in a row for 4×4)
const checkPartialWinner = (board, player) => {
  const size = board.length;
  if (size <= 3) return false; // Only for 4×4 and 6×6

  const requiredInLine = size === 4 ? 3 : 4; // 3 for 4×4, 4 for 6×6

  // Check rows for partial wins
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - requiredInLine; j++) {
      let count = 0;
      for (let k = 0; k < requiredInLine; k++) {
        if (board[i][j + k] === player) count++;
      }
      if (count === requiredInLine) return true;
    }
  }

  // Check columns for partial wins
  for (let j = 0; j < size; j++) {
    for (let i = 0; i <= size - requiredInLine; i++) {
      let count = 0;
      for (let k = 0; k < requiredInLine; k++) {
        if (board[i + k][j] === player) count++;
      }
      if (count === requiredInLine) return true;
    }
  }

  // Check diagonals for partial wins
  for (let i = 0; i <= size - requiredInLine; i++) {
    for (let j = 0; j <= size - requiredInLine; j++) {
      // Check diagonal from top-left to bottom-right
      let count1 = 0;
      for (let k = 0; k < requiredInLine; k++) {
        if (board[i + k][j + k] === player) count1++;
      }
      if (count1 === requiredInLine) return true;

      // Check diagonal from top-right to bottom-left
      let count2 = 0;
      for (let k = 0; k < requiredInLine; k++) {
        if (board[i + k][j + requiredInLine - 1 - k] === player) count2++;
      }
      if (count2 === requiredInLine) return true;
    }
  }

  return false;
};

// Get all empty positions
const getEmptyPositions = (board) => {
  const size = board.length;
  const emptyPositions = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === " ") {
        emptyPositions.push([i, j]);
      }
    }
  }

  return emptyPositions;
};

// Check if the board is full
const isBoardFull = (board) => {
  return getEmptyPositions(board).length === 0;
};

// Implementation of the minimax algorithm with alpha-beta pruning
// For larger boards, limit the depth to avoid excessive computation
const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity, maxDepth = 5) => {
  const size = board.length;

  // Limit depth for larger boards
  if (size > 3 && depth >= maxDepth) {
    return { score: evaluateBoard(board) * (isMaximizing ? -1 : 1) };
  }

  // Evaluate if there's a terminal state
  if (checkWinner(board, "O")) return { score: 10 - depth };
  if (checkWinner(board, "X")) return { score: depth - 10 };
  if (isBoardFull(board)) return { score: 0 };

  const emptyPositions = getEmptyPositions(board);

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestMove;

    for (const [i, j] of emptyPositions) {
      board[i][j] = "O"; // Computer is O
      const result = minimax(board, depth + 1, false, alpha, beta, maxDepth);
      board[i][j] = " "; // Undo move

      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = [i, j];
      }

      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }

    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove;

    for (const [i, j] of emptyPositions) {
      board[i][j] = "X"; // Player is X
      const result = minimax(board, depth + 1, true, alpha, beta, maxDepth);
      board[i][j] = " "; // Undo move

      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = [i, j];
      }

      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }

    return { score: bestScore, move: bestMove };
  }
};

// Heuristic evaluation for larger boards
const evaluateBoard = (board) => {
  const size = board.length;
  let score = 0;

  // Check rows
  for (let i = 0; i < size; i++) {
    score += evaluateLine(board[i]);
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    const column = [];
    for (let i = 0; i < size; i++) {
      column.push(board[i][j]);
    }
    score += evaluateLine(column);
  }

  // Check main diagonal
  const diagonal1 = [];
  for (let i = 0; i < size; i++) {
    diagonal1.push(board[i][i]);
  }
  score += evaluateLine(diagonal1);

  // Check other diagonal
  const diagonal2 = [];
  for (let i = 0; i < size; i++) {
    diagonal2.push(board[i][size - 1 - i]);
  }
  score += evaluateLine(diagonal2);

  return score;
};

// Evaluate a line (row, column, or diagonal)
const evaluateLine = (line) => {
  const countX = line.filter(cell => cell === "X").length;
  const countO = line.filter(cell => cell === "O").length;
  const empty = line.filter(cell => cell === " ").length;

  // If both X and O are in the line, it's not winnable
  if (countX > 0 && countO > 0) return 0;

  // Score based on how many markers and empty spaces
  if (countO > 0) return countO * countO * (empty > 0 ? 1 : 10);
  if (countX > 0) return -countX * countX * (empty > 0 ? 1 : 10);

  return 0;
};

// Enhanced computer move function with board size consideration
const computerMove = (board, difficulty) => {
  const size = board.length;
  const emptyPositions = getEmptyPositions(board);

  // Easy: Random move
  if (difficulty === "easy") {
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  }
  // Medium: Win if possible, block player from winning, otherwise random
  else if (difficulty === "medium") {
    // Check if computer can win
    for (const [i, j] of emptyPositions) {
      board[i][j] = "O";
      if (checkWinner(board, "O") || checkPartialWinner(board, "O")) {
        board[i][j] = " ";
        return [i, j];
      }
      board[i][j] = " ";
    }

    // Block player from winning
    for (const [i, j] of emptyPositions) {
      board[i][j] = "X";
      if (checkWinner(board, "X") || checkPartialWinner(board, "X")) {
        board[i][j] = " ";
        return [i, j];
      }
      board[i][j] = " ";
    }

    // Prefer center if available
    const center = Math.floor(size / 2);
    if (board[center][center] === " ") {
      return [center, center];
    }

    // Otherwise random move
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  }
  // Hard: Use minimax algorithm to find optimal move (with depth limit for larger boards)
  else if (difficulty === "hard") {
    // For 3×3, use full minimax
    if (size === 3) {
      const result = minimax(board, 0, true);
      return result.move;
    }
    // For 4×4, use minimax with limited depth
    else if (size === 4) {
      const result = minimax(board, 0, true, -Infinity, Infinity, 3);
      return result.move;
    }
    // For 6×6, use a simplified approach
    else {
      // Try to win first
      for (const [i, j] of emptyPositions) {
        board[i][j] = "O";
        if (checkWinner(board, "O") || checkPartialWinner(board, "O")) {
          board[i][j] = " ";
          return [i, j];
        }
        board[i][j] = " ";
      }

      // Block player
      for (const [i, j] of emptyPositions) {
        board[i][j] = "X";
        if (checkWinner(board, "X") || checkPartialWinner(board, "X")) {
          board[i][j] = " ";
          return [i, j];
        }
        board[i][j] = " ";
      }

      // Use a very limited minimax for 6×6
      const result = minimax(board, 0, true, -Infinity, Infinity, 2);
      return result.move;
    }
  }
  // Expert: Unbeatable with strategic first moves
  else if (difficulty === "expert") {
    // For larger boards, we'll need to modify the strategy
    if (size === 3) {
      // First check if we can win
      for (const [i, j] of emptyPositions) {
        board[i][j] = "O";
        if (checkWinner(board, "O")) {
          board[i][j] = " ";
          return [i, j];
        }
        board[i][j] = " ";
      }

      // If it's the first move, take the center or a corner
      const moveCount = size * size - emptyPositions.length;

      if (moveCount === 0) {
        // First move, take center or corner
        return board[1][1] === " " ? [1, 1] : [0, 0];
      }

      if (moveCount === 1) {
        // If player took center, take a corner
        if (board[1][1] === "X") {
          return [0, 0];
        }
        // If player took a corner or edge, take center
        else if (board[1][1] === " ") {
          return [1, 1];
        }
      }

      // Otherwise use minimax for optimal play
      const result = minimax(board, 0, true);
      return result.move;
    } else {
      // For larger boards, use the same strategy as hard but with more depth
      return computerMove(board, "hard");
    }
  }

  // Default to medium if an invalid difficulty is provided
  return computerMove(board, "medium");
};

// Create an empty board of specified size
const createEmptyBoard = (size) => {
  return Array(size).fill().map(() => Array(size).fill(" "));
};

// Implement a new function for "disappearing moves" special effect in hard mode
const disappearMoves = async (game) => {
  // For now, we'll just set it as a tie
  game.winner = "Tie";
  return game;
};

exports.startGame = async (req, res) => {
  const { difficulty, boardSize } = req.body;

  if (!difficulty) {
    return res.status(400).send("Difficulty level is required");
  }

  // Validate difficulty level
  const validDifficulties = ["easy", "medium", "hard", "expert"];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).send("Invalid difficulty level");
  }

  // Validate and set board size (default to 3 if not specified)
  let size = 3;
  if (boardSize) {
    if ([3, 4, 6].includes(parseInt(boardSize))) {
      size = parseInt(boardSize);
    } else {
      return res.status(400).send("Invalid board size. Choose 3, 4, or 6.");
    }
  }

  const game = new Game({
    board: createEmptyBoard(size),
    currentPlayer: "X",
    difficulty,
    boardSize: size,
    moveHistory: [],
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

  const size = game.board.length;

  // Input validation
  if (row < 0 || row >= size || col < 0 || col >= size) {
    return res.status(400).send("Invalid position");
  }

  if (game.winner) {
    return res.status(400).send("Game is already over");
  }

  if (game.board[row][col] !== " ") {
    return res.status(400).send("Position already taken");
  }

  // Player's move
  game.moveHistory.push({ player: game.currentPlayer, row, col });
  game.board[row][col] = game.currentPlayer;

  // Check if player won
  if (checkWinner(game.board, game.currentPlayer) ||
    (size > 3 && checkPartialWinner(game.board, game.currentPlayer))) {
    game.winner = game.currentPlayer;
  }
  // Check for tie
  else if (getEmptyPositions(game.board).length === 0) {
    if (game.difficulty === "hard" || game.difficulty === "expert") {
      await disappearMoves(game);
    } else {
      game.winner = "Tie";
    }
  }
  // Computer's turn
  else {
    game.currentPlayer = "O"; // Switch to computer

    // Make computer's move
    const [i, j] = computerMove(game.board, game.difficulty);
    game.board[i][j] = "O";
    game.moveHistory.push({ player: "O", row: i, col: j });

    // Check if computer won
    if (checkWinner(game.board, "O") ||
      (size > 3 && checkPartialWinner(game.board, "O"))) {
      game.winner = "O";
    }
    // Check for tie
    else if (getEmptyPositions(game.board).length === 0) {
      if (game.difficulty === "hard" || game.difficulty === "expert") {
        await disappearMoves(game);
      } else {
        game.winner = "Tie";
      }
    }
    // Continue game
    else {
      game.currentPlayer = "X"; // Switch back to player
    }
  }

  await game.save();
  res.send(game);
};

// Add a new endpoint to get game stats
exports.getGameStats = async (req, res) => {
  const { gameId } = req.params;

  const game = await Game.findById(gameId);
  if (!game) {
    return res.status(404).send("Game not found");
  }

  // Calculate stats
  const stats = {
    boardSize: game.boardSize || game.board.length,
    totalMoves: game.moveHistory.length,
    playerMoves: game.moveHistory.filter(move => move.player === "X").length,
    computerMoves: game.moveHistory.filter(move => move.player === "O").length,
    winner: game.winner || "In progress",
    difficulty: game.difficulty,
  };

  res.send(stats);
};