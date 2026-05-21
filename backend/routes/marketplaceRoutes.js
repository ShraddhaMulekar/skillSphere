import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireVerified } from "../middleware/requireVerified.js";
import {
  createGig,
  createProposal,
  createReview,
  getGig,
  getMyAnalytics,
  getRecommendations,
  getTrendingSkills,
  listGigs,
  updateGigProgress,
  updateProposalStatus,
} from "../controllers/marketplaceController.js";
import {
  createDispute,
  createPayment,
  listDisputes,
  listMessages,
  listNotifications,
  listPayments,
  markNotificationRead,
  sendMessage,
  updateDispute,
  updatePaymentStatus,
} from "../controllers/collaborationController.js";

export const marketplaceRoutes = express.Router();

marketplaceRoutes.use(protect);

marketplaceRoutes.get("/gigs", listGigs);
marketplaceRoutes.post("/gigs", requireVerified, createGig);
marketplaceRoutes.get("/gigs/:id", getGig);
marketplaceRoutes.patch("/gigs/:id/progress", requireVerified, updateGigProgress);
marketplaceRoutes.get("/gigs/:gigId/recommendations", requireVerified, getRecommendations);
marketplaceRoutes.post("/gigs/:gigId/proposals", requireVerified, createProposal);

marketplaceRoutes.patch("/proposals/:id", requireVerified, updateProposalStatus);
marketplaceRoutes.post("/reviews", requireVerified, createReview);
marketplaceRoutes.get("/trending-skills", getTrendingSkills);
marketplaceRoutes.get("/analytics/me", getMyAnalytics);

marketplaceRoutes.get("/messages", listMessages);
marketplaceRoutes.post("/messages", requireVerified, sendMessage);
marketplaceRoutes.get("/notifications", listNotifications);
marketplaceRoutes.patch("/notifications/read", markNotificationRead);

marketplaceRoutes.get("/payments", listPayments);
marketplaceRoutes.post("/payments", requireVerified, createPayment);
marketplaceRoutes.patch("/payments/:id", requireVerified, updatePaymentStatus);

marketplaceRoutes.get("/disputes", listDisputes);
marketplaceRoutes.post("/disputes", requireVerified, createDispute);
marketplaceRoutes.patch("/disputes/:id", requireVerified, updateDispute);
