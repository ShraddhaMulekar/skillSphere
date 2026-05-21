import crypto from "crypto";
import { UserModel } from "../../models/UserModel.js";
import { sendEmail } from "../../utils/sendEmail.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

export const resendVerification = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (user.isVerified) {
      return res.json({ success: true, message: "Email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.verificationCode = verificationCode;
    user.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifyURL = `${clientUrl}/verify-email/${verificationToken}`;

    let emailSent = true;
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your SkillSphere account",
        html: `<h2>Hi ${user.name}!</h2>
               <p>Your 6-digit verification code is: <strong style="font-size: 1.25rem; letter-spacing: 2px; color: #6366f1;">${verificationCode}</strong></p>
               <p>Click below to verify your email automatically:</p>
               <a href="${verifyURL}">Verify Email</a>`,
      });
    } catch (emailError) {
      emailSent = false;
      console.warn("Verification email failed:", emailError.message);
    }

    return res.json({
      success: true,
      message: emailSent
        ? "Verification email sent"
        : "Email could not be sent. Use the verification link returned by the API.",
      emailSent,
      verificationUrl: verifyURL,
      verificationCode: user.verificationCode,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification",
      error: error.message,
    });
  }
};
