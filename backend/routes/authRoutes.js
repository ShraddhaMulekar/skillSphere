import express from "express";
import { registerController } from "../controllers/authControllers/registerController.js";
import { loginController } from "../controllers/authControllers/loginController.js";
import { verifyEmail } from "../controllers/authControllers/verifyEmail.js";

export const authRoutes = express.Router()

// @route  POST /auth/register
authRoutes.post("/register", registerController)
// @route  POST /auth/login
authRoutes.post("/login", loginController)
// @route  GET /auth/verify-email/:token
authRoutes.get("/verify-email/:token", verifyEmail)