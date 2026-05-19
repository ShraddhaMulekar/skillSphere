import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMe } from "../controllers/authControllers/meController.js";
import {
  updateProfile,
  getUserById,
} from "../controllers/userControllers/profileController.js";

export const userRoutes = express.Router();

userRoutes.get("/me", protect, getMe);
userRoutes.put("/profile", protect, updateProfile);
userRoutes.get("/:id", protect, getUserById);
