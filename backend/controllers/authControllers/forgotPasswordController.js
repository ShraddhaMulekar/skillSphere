import { UserModel } from "../../models/UserModel.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { generateSecureToken, hashToken } from "../../utils/tokenUtils.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const RESET_EXPIRE_MS = 10 * 60 * 1000;

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    if (user.authProvider === "google" && !user.password) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    const resetToken = generateSecureToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpire = new Date(Date.now() + RESET_EXPIRE_MS);
    await user.save({ validateBeforeSave: false });

    const encodedToken = encodeURIComponent(resetToken);
  const resetURL = `${clientUrl}/reset-password/${encodedToken}`;

    let emailSent = true;
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your SkillSphere password",
        html: `<h2>Password reset</h2>
               <p>Hi ${user.name},</p>
               <p>Click the link below to reset your password (expires in 10 minutes):</p>
               <a href="${resetURL}">${resetURL}</a>`,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Password reset email failed:", emailError.message);
    }

    return res.json({
      success: true,
      message: emailSent
        ? "If that email exists, a reset link has been sent"
        : "Reset email could not be sent. Use the reset link returned by the API.",
      emailSent,
      resetUrl: emailSent ? undefined : resetURL,
      resetToken: emailSent ? resetToken : resetToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error processing password reset request",
      error: error.message,
    });
  }
};
