import { UserModel } from "../../models/UserModel.js";
import bcrypt from "bcryptjs";
import { sendAuthSuccess, toPublicUser } from "../../utils/authResponse.js";
import { issue2FATempToken } from "./twoFactorController.js";
import { sendEmail } from "../../utils/sendEmail.js";

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended. Contact support.",
      });
    }

    if (user.authProvider === "local" && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
        code: "USE_GOOGLE_AUTH",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password!" });
    }

    if (user.twoFactorEnabled) {
      const otp = generateOtp();
      user.twoFactorOtpCode = otp;
      user.twoFactorOtpExpire = new Date(Date.now() + 10 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      await sendEmail({
        to: user.email,
        subject: "Your SkillSphere sign-in code",
        html: `<h2>Hi ${user.name}!</h2><p>Your 6-digit sign-in code is:</p><p style="font-size:24px;letter-spacing:4px;font-weight:700;">${otp}</p><p>This code expires in 10 minutes.</p>`,
        verificationCode: otp,
      });

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
