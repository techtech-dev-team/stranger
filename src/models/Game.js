const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  board: {
    type: [[String]],
    required: true
  },
  currentPlayer: {
    type: String,
    required: true,
    enum: ['X', 'O']
  },
  winner: {
    type: String,
    enum: ['X', 'O', 'Tie', null],
    default: null
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard', 'expert']
  },
  boardSize: {
    type: Number,
    required: true,
    enum: [3, 4, 6],
    default: 3
  },
  moveHistory: [{
    player: String,
    row: Number,
    col: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Game', GameSchema);