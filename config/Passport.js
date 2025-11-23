const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const AppleStrategy = require("passport-apple").Strategy;
const User = require("../models/User");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ oauthProvider: "google", oauthId: profile.id });
      if(!user){
        user = await User.create({ 
          name: profile.displayName, 
          email: profile.emails[0].value, 
          oauthProvider: "google",
          oauthId: profile.id 
        });
      }
      done(null, user);
    } catch(err) { done(err); }
  }
));

// Apple
passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
    callbackURL: "/auth/apple/callback",
  },
  async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      let user = await User.findOne({ oauthProvider: "apple", oauthId: profile.id });
      if(!user){
        user = await User.create({ 
          name: profile.name?.firstName || "Apple User", 
          email: profile.email, 
          oauthProvider: "apple",
          oauthId: profile.id 
        });
      }
      done(null, user);
    } catch(err) { done(err); }
  }
));