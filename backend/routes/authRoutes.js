import express from "express";
import { registerController } from "../controllers/authControllers/registerController.js";
import { loginController } from "../controllers/authControllers/loginController.js";
import { verifyEmail } from "../controllers/authControllers/verifyEmail.js";
import { getMe } from "../controllers/authControllers/meController.js";
import { protect } from "../middleware/authMiddleware.js";

export const authRoutes = express.Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);
authRoutes.get("/verify-email/:token", verifyEmail);
authRoutes.get("/me", protect, getMe);