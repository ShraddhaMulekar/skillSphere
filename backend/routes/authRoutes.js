import express from "express";
import { registerController } from "../controllers/authControllers/registerController.js";
import { loginController } from "../controllers/authControllers/loginController.js";
import { verifyEmail } from "../controllers/authControllers/verifyEmail.js";
import { getMe } from "../controllers/authControllers/meController.js";
import { forgotPassword } from "../controllers/authControllers/forgotPasswordController.js";
import { resetPassword } from "../controllers/authControllers/resetPasswordController.js";
import {
  googleAuth,
  googleCallback,
} from "../controllers/authControllers/googleAuthController.js";
import { resendVerification } from "../controllers/authControllers/resendVerificationController.js";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FALogin,
} from "../controllers/authControllers/twoFactorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, strictAuthLimiter } from "../middleware/rateLimiter.js";

export const authRoutes = express.Router();

authRoutes.post("/register", authLimiter, registerController);
authRoutes.post("/login", strictAuthLimiter, loginController);
authRoutes.post("/forgot-password", strictAuthLimiter, forgotPassword);
authRoutes.put("/reset-password/:token", strictAuthLimiter, resetPassword);
authRoutes.post("/verify-2fa", strictAuthLimiter, verify2FALogin);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.get("/verify-email/:token", verifyEmail);

authRoutes.get("/google", googleAuth);
authRoutes.get(
  "/google/callback",
  googleCallback,
);

authRoutes.get("/me", protect, getMe);
authRoutes.post("/resend-verification", protect, resendVerification);

authRoutes.post("/2fa/setup", protect, setup2FA);
authRoutes.post("/2fa/enable", protect, enable2FA);
authRoutes.post("/2fa/disable", protect, disable2FA);
