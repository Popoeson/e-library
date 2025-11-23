const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

// 1. Demo login
router.post("/demo", async (req,res)=>{
  const demoEmail = `demo${Date.now()}@example.com`;
  const demoUser = await User.create({ name: "Demo User", email: demoEmail });
  res.json({ status: "success", user: { id: demoUser._id, name: demoUser.name, email: demoUser.email } });
});

// 2. Email login/signup
router.post("/signup", async (req,res)=>{
  const { name,email,password } = req.body;
  if(!name || !email || !password) return res.json({ status:"error", message:"All fields required" });

  const existing = await User.findOne({ email });
  if(existing) return res.json({ status:"error", message:"Email already registered" });

  const hashed = await bcrypt.hash(password,10);
  const user = await User.create({ name,email,password:hashed });
  res.json({ status:"success", user:{ id:user._id, name:user.name, email:user.email } });
});

router.post("/login", async (req,res)=>{
  const { email,password } = req.body;
  if(!email || !password) return res.json({ status:"error", message:"All fields required" });

  const user = await User.findOne({ email });
  if(!user) return res.json({ status:"error", message:"User not found" });

  const match = await bcrypt.compare(password, user.password);
  if(!match) return res.json({ status:"error", message:"Incorrect password" });

  res.json({ status:"success", user:{ id:user._id, name:user.name, email:user.email } });
});

// 3. Google OAuth
router.get("/google", passport.authenticate("google",{ scope:["profile","email"] }));
router.get("/google/callback", passport.authenticate("google",{ failureRedirect:"/login.html" }),
  (req,res)=>{ res.redirect("/index.html"); }
);

// 4. Apple OAuth
router.get("/apple", passport.authenticate("apple"));
router.post("/apple/callback", passport.authenticate("apple",{ failureRedirect:"/login.html" }),
  (req,res)=>{ res.redirect("/index.html"); }
);

module.exports = router;