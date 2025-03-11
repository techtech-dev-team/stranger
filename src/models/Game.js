const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  board: { type: [[String]], required: true },
  currentPlayer: { type: String, required: true },
  difficulty: { type: String, required: true },
  winner: { type: String, default: null },
  moveHistory: { // Add moveHistory field
    type: [
      {
        player: { type: String, required: true },
        row: { type: Number, required: true },
        col: { type: Number, required: true },
      },
    ],
    default: [],
  },
});

module.exports = mongoose.model("Game", gameSchema);