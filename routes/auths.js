const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../model/user");

const FRONTEND_URL = "https://e-library-two-tau.vercel.app"; // Vercel frontend

// -----------------------------
// 1. Demo login (anonymous user)
// -----------------------------
router.post("/demo", async (req, res) => {
  try {
    const demoUser = {
      id: `demo_${Date.now()}`,
      name: "Demo User",
      email: `demo${Date.now()}@example.com`,
      provider: "demo"
    };
    res.json({ status: "success", user: demoUser });
  } catch (err) {
    console.error("Demo login error:", err);
    res.status(500).json({ status: "error", message: "Demo login failed" });
  }
});

// -----------------------------
// 2. Google OAuth
// -----------------------------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/login.html` }),
  (req, res) => {
    // After successful login, redirect to frontend
    res.redirect(FRONTEND_URL);
  }
);

// -----------------------------
// 3. Apple OAuth
// -----------------------------
router.get("/apple", passport.authenticate("apple"));

router.post(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: `${FRONTEND_URL}/login.html` }),
  (req, res) => {
    res.redirect(FRONTEND_URL);
  }
);

module.exports = router;