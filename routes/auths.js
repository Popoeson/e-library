const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

// -----------------------------
// 1. Demo login (anonymous user)
// -----------------------------
router.post("/demo", async (req, res) => {
  try {
    // Just generate a temporary user object; not saved in DB
    const demoUser = {
      id: `demo_${Date.now()}`,
      name: "Demo User",
      email: `demo${Date.now()}@example.com`,
      provider: "demo"
    };
    // Send back to frontend
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
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  (req, res) => {
    // After successful login, redirect to index.html
    res.redirect("/index.html");
  }
);

// -----------------------------
// 3. Apple OAuth
// -----------------------------
router.get("/apple", passport.authenticate("apple"));

router.post(
  "/apple/callback",
  passport.authenticate("apple", { failureRedirect: "/login.html" }),
  (req, res) => {
    res.redirect("/index.html");
  }
);

module.exports = router;