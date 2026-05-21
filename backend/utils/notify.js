import { NotificationModel } from "../models/MarketplaceModels.js";

export const createNotification = async ({ user, title, message, type, link }) => {
  if (!user || !title) return null;
  return NotificationModel.create({ user, title, message, type, link });
};
