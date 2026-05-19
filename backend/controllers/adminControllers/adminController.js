import { UserModel } from "../../models/UserModel.js";

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

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        clients,
        freelancers,
        verified,
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
