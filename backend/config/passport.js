import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/UserModel.js";
import { PUBLIC_REGISTER_ROLES, ROLES } from "../constants/roles.js";
import crypto from "crypto";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const parseOAuthState = (state) => {
  if (!state) return { role: ROLES.CLIENT };
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const role = PUBLIC_REGISTER_ROLES.includes(parsed.role)
      ? parsed.role
      : ROLES.CLIENT;
    return { role };
  } catch {
    return { role: ROLES.CLIENT };
  }
};

export const configurePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
    return;
  }

  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 5000}/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const { role: requestedRole } = parseOAuthState(req.query.state);
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account has no email"), null);
          }

          let user = await UserModel.findOne({
            $or: [{ googleId: profile.id }, { email }],
          }).select("+password");

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              user.authProvider = "google";
              if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
              }
              user.isVerified = true;
              await user.save();
            }
          } else {
            user = await UserModel.create({
              name: profile.displayName || email.split("@")[0],
              email,
              googleId: profile.id,
              authProvider: "google",
              role: requestedRole,
              isVerified: true,
              avatar: profile.photos?.[0]?.value || "",
              password: crypto.randomBytes(32).toString("hex"),
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );
};

export const googleFailureRedirect = `${clientUrl}/login?error=google_auth_failed`;

export const googleSuccessRedirect = (token) =>
  `${clientUrl}/auth/google/callback?token=${encodeURIComponent(token)}`;
