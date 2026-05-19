import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  getDashboardStats,
} from "../controllers/adminControllers/adminController.js";

export const adminRoutes = express.Router();

adminRoutes.use(protect, authorize("admin"));

adminRoutes.get("/users", getAllUsers);
adminRoutes.get("/stats", getDashboardStats);
