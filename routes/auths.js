const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../model/user");

const FRONTEND_URL = "https://e-library-two-tau.vercel.app"; 

// -----------------------------
// 1. Demo login (anonymous user)
// -----------------------------
router.post("/demo", async (req, res) => {
  try {
    const demoUser = {
      id: `demo_${Date.now()}`,
      name: "Demo User",
      email: null,
      provider: "demo",
      photo: ""
    };

    res.json({ status: "success", user: demoUser });
  } catch (err) {
    console.error("Demo login error:", err);
    res.status(500).json({ status: "error", message: "Demo login failed" });
  }
});

// -----------------------------
// 2. Google OAuth (FULL FIX)
// -----------------------------
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login.html`
  }),
  async (req, res) => {
    // Send the user to callback.html with user info encoded
    const user = req.user;

    const url = `${FRONTEND_URL}/callback.html?name=${encodeURIComponent(
      user.name
    )}&email=${encodeURIComponent(user.email)}&provider=google&oauthId=${
      user.oauthId
    }&photo=${encodeURIComponent(user.photo || "")}`;

    res.redirect(url);
  }
);

// -----------------------------
// 3. Apple OAuth (FULL FIX)
// -----------------------------
router.get("/apple", passport.authenticate("apple"));

router.post(
  "/apple/callback",
  passport.authenticate("apple", {
    failureRedirect: `${FRONTEND_URL}/login.html`
  }),
  async (req, res) => {
    const user = req.user;

    const url = `${FRONTEND_URL}/callback.html?name=${encodeURIComponent(
      user.name
    )}&email=${encodeURIComponent(user.email)}&provider=apple&oauthId=${
      user.oauthId
    }&photo=${encodeURIComponent(user.photo || "")}`;

    res.redirect(url);
  }
);

module.exports = router;