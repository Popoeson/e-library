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

// ---------------------- MIDDLEWARE ----------------------

// Trust proxy (needed for Render HTTPS cookies)
app.set("trust proxy", 1);

// CORS setup to allow frontend requests
app.use(cors({
  origin: "https://e-library-two-tau.vercel.app", // frontend URL
  credentials: true
}));

// JSON parser
app.use(express.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,   // must be true for HTTPS
      httpOnly: true,
      sameSite: "none", // allows cross-site cookies for OAuth
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// Passport init + session
app.use(passport.initialize());
app.use(passport.session());

// ---------------------- STATIC FILES ----------------------
app.use(express.static(path.join(__dirname)));

// ---------------------- API ROUTES ----------------------
app.use("/api/search", searchRoutes);
app.use("/auths", authRoutes);

// ---------------------- FRONTEND CATCH-ALL ----------------------
app.get(/^\/(?!api|auths).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------------- START SERVER ----------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});