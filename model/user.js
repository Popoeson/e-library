const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema({
  query: String,
  results: Array,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  provider: { type: String, enum: ["google", "apple"], required: true },
  searchHistory: [searchHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);