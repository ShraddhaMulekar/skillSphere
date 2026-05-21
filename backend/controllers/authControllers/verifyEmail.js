import { UserModel } from "../../models/UserModel.js";

export const verifyEmail = async (req, res) => {
  try {
    // 1. Handle Code-Based Verification (POST)
    if (req.method === "POST") {
      const { email, code } = req.body || {};
      if (!email || !code) {
        return res
          .status(400)
          .json({ success: false, message: "Email and verification code are required" });
      }

      const user = await UserModel.findOne({
        email: email.toLowerCase(),
        verificationCode: code,
        verificationCodeExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired verification code" });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpire = undefined;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save();

      return res
        .status(200)
        .json({ success: true, message: "Email verified successfully" });
    }

    // 2. Handle Link-Based Verification (GET)
    const { token } = req.params;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token parameter is required" });
    }

    const user = await UserModel.findOne({
      emailVerificationToken: token,
      $or: [
        { emailVerificationExpire: { $gt: Date.now() } },
        { emailVerificationExpire: { $exists: false } },
      ],
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
