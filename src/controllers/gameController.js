const Game = require("../models/Game");

// Check if there's a winner
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

// Get all empty positions
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

// Check if the board is full
const isBoardFull = (board) => {
  return getEmptyPositions(board).length === 0;
};

// Implementation of the minimax algorithm with alpha-beta pruning
const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
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
      const result = minimax(board, depth + 1, false, alpha, beta);
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
      const result = minimax(board, depth + 1, true, alpha, beta);
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

// Enhanced computer move function with new difficulty levels
const computerMove = (board, difficulty) => {
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
      if (checkWinner(board, "O")) {
        board[i][j] = " ";
        return [i, j];
      }
      board[i][j] = " ";
    }
    
    // Block player from winning
    for (const [i, j] of emptyPositions) {
      board[i][j] = "X";
      if (checkWinner(board, "X")) {
        board[i][j] = " ";
        return [i, j];
      }
      board[i][j] = " ";
    }
    
    // Prefer center if available
    if (board[1][1] === " ") {
      return [1, 1];
    }
    
    // Otherwise random move
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  } 
  // Hard: Use minimax algorithm to find optimal move
  else if (difficulty === "hard") {
    // Apply minimax algorithm
    const result = minimax(board, 0, true);
    return result.move;
  }
  // Expert: Unbeatable with strategic first moves
  else if (difficulty === "expert") {
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
    const moveCount = 9 - emptyPositions.length;
    
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
  }
  
  // Default to medium if an invalid difficulty is provided
  return computerMove(board, "medium");
};

// Implement a new function for "disappearing moves" special effect in hard mode
const disappearMoves = async (game) => {
  // For now we'll just set it as a tie
  // In a real implementation, this could manipulate the game board
  // or add special effects
  game.winner = "Tie";
  return game;
};

exports.startGame = async (req, res) => {
  const { difficulty } = req.body;
  if (!difficulty) {
    return res.status(400).send("Difficulty level is required");
  }
  
  // Validate difficulty level
  const validDifficulties = ["easy", "medium", "hard", "expert"];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).send("Invalid difficulty level");
  }
  
  const game = new Game({
    board: [[" ", " ", " "], [" ", " ", " "], [" ", " ", " "]],
    currentPlayer: "X",
    difficulty,
    moveHistory: [],
  });
  
  await game.save();
  res.send(game);
};

exports.makeMove = async (req, res) => {
  const { gameId, row, col } = req.body;
  
  // Input validation
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return res.status(400).send("Invalid position");
  }
  
  const game = await Game.findById(gameId);
  if (!game) {
    return res.status(404).send("Game not found");
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
  if (checkWinner(game.board, game.currentPlayer)) {
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
    if (checkWinner(game.board, "O")) {
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
    totalMoves: game.moveHistory.length,
    playerMoves: game.moveHistory.filter(move => move.player === "X").length,
    computerMoves: game.moveHistory.filter(move => move.player === "O").length,
    winner: game.winner || "In progress",
    difficulty: game.difficulty,
  };
  
  res.send(stats);
};