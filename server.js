require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const session = require("express-session");

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

// Required for secure cookies on Render (HTTPS)
app.set("trust proxy", 1);

// ======= SESSION MIDDLEWARE (Fixes Google OAuth 500) =======
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,   // Render uses HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// ======= MIDDLEWARE =======
app.use(cors());
app.use(express.json());

// Passport session setup
app.use(passport.initialize());
app.use(passport.session());

// ======= SERVE FRONTEND FILES =======
app.use(express.static(path.join(__dirname)));

// ======= API ROUTES =======
app.use("/api/search", searchRoutes);
app.use("/auths", authRoutes);

// ======= FRONTEND CATCH-ALL =======
app.get(/^\/(?!api|auths).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ======= START SERVER =======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});