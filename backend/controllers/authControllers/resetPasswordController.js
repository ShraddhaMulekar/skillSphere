import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.js";
import { hashToken } from "../../utils/tokenUtils.js";
import { sendAuthSuccess } from "../../utils/authResponse.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body || {};

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = hashToken(token);
    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.authProvider = "local";
    await user.save();

    return sendAuthSuccess(res, user, 200, "Password reset successful");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};
