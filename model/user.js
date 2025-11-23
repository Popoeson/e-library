const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  password: String, // hashed password for email login
  oauthProvider: String, // "google" | "apple" | null
  oauthId: String, // ID from Google or Apple
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);