import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const handleSocialLogin = async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const photo = profile.photos?.[0]?.value;

    // 1. Check if user exists by Social ID
    let user = await User.findOne({
      where: {
        [profile.provider + "Id"]: profile.id, // googleId or githubId
      },
    });

    // 2. If not, check by email (Link accounts)
    if (!user && email) {
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link the social ID to existing account
        user[profile.provider + "Id"] = profile.id;
        await user.save();
      }
    }

    // 3. If still no user, create one
    if (!user) {
      user = await User.create({
        username: profile.displayName || profile.username || "User",
        email: email || `${profile.id}@no-email.com`, // Fallback
        [profile.provider + "Id"]: profile.id,
        avatarUrl: photo,
        password: null, // No password for social users
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
};

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    handleSocialLogin
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
    },
    handleSocialLogin
  )
);

export default passport;
