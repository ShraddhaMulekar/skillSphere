import { UserModel } from "../../models/UserModel.js";
import bcrypt from "bcrypt";
import { sendAuthSuccess, toPublicUser } from "../../utils/authResponse.js";
import { issue2FATempToken } from "./twoFactorController.js";

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email" });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
        code: "USE_GOOGLE_AUTH",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    if (user.twoFactorEnabled) {
      const tempToken = issue2FATempToken(user);
      return res.status(200).json({
        success: true,
        requires2FA: true,
        tempToken,
        user: toPublicUser(user),
      });
    }

    return sendAuthSuccess(res, user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while logging in",
      error: error.message,
    });
  }
};
