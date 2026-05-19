import passport from "passport";
import { PUBLIC_REGISTER_ROLES, ROLES } from "../../constants/roles.js";
import { generateToken } from "../../utils/generateToken.js";
import {
  googleFailureRedirect,
  googleSuccessRedirect,
} from "../../config/passport.js";

export const googleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured on the server",
    });
  }

  const role = PUBLIC_REGISTER_ROLES.includes(req.query.role)
    ? req.query.role
    : ROLES.CLIENT;
  const state = Buffer.from(JSON.stringify({ role })).toString("base64url");

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,
  })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(googleFailureRedirect);
    }
    const token = generateToken(user._id, user.role);
    return res.redirect(googleSuccessRedirect(token));
  })(req, res, next);
};
