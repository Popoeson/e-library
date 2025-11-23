require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");

// Load OAuth strategies
require("./config/passport");

// Routes
const searchRoutes = require("./controllers/searchController");
const authRoutes = require("./routes/auths");

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 5000;

// ======= MIDDLEWARE =======
app.use(cors());
app.use(express.json());

// Initialize passport (OAuth only — NO SESSIONS)
app.use(passport.initialize());

// ======= SERVE FRONTEND FILES =======
app.use(express.static(path.join(__dirname)));

// ======= API ROUTES =======
app.use("/api/search", searchRoutes);
app.use("/auths", authRoutes);

// ======= FRONTEND CATCH-ALL =======
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ======= START SERVER =======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});