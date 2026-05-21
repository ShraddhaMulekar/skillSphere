import { UserModel } from "../../models/UserModel.js";
import {
  DisputeModel,
  GigModel,
  PaymentModel,
  ProposalModel,
} from "../../models/MarketplaceModels.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find()
      .select(
        "-password -emailVerificationToken -passwordResetToken -twoFactorSecret",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const clients = await UserModel.countDocuments({ role: "client" });
    const freelancers = await UserModel.countDocuments({ role: "freelancer" });
    const verified = await UserModel.countDocuments({ isVerified: true });
    const suspended = await UserModel.countDocuments({ isSuspended: true });
    const openGigs = await GigModel.countDocuments({ status: "open" });
    const activeProjects = await GigModel.countDocuments({ status: "in-progress" });
    const proposals = await ProposalModel.countDocuments();
    const disputes = await DisputeModel.countDocuments({ status: { $in: ["open", "under-review"] } });
    const revenueAgg = await PaymentModel.aggregate([
      { $match: { status: "released" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        clients,
        freelancers,
        verified,
        suspended,
        openGigs,
        activeProjects,
        proposals,
        disputes,
        platformRevenue: revenueAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { isVerified, isSuspended, verificationBadge } = req.body || {};

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user._id) && isSuspended === true) {
      return res.status(400).json({
        success: false,
        message: "Admins cannot suspend their own account",
      });
    }

    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);
    if (isSuspended !== undefined) user.isSuspended = Boolean(isSuspended);
    if (verificationBadge !== undefined && user.role === "freelancer") {
      user.verificationBadge = Boolean(verificationBadge);
    }

    await user.save({ validateBeforeSave: false });

    const sanitizedUser = await UserModel.findById(user._id).select(
      "-password -emailVerificationToken -passwordResetToken -twoFactorSecret",
    );

    return res.status(200).json({
      success: true,
      message: "User status updated",
      user: sanitizedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};
