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
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifyURL = `${clientUrl}/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your SkillSphere account",
        html: `<h2>Hi ${user.name}!</h2>
               <p>Click below to verify your email:</p>
               <a href="${verifyURL}">Verify Email</a>`,
      });
    } catch (emailError) {
      console.warn("Verification email failed:", emailError.message);
    }

    return res.json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification",
      error: error.message,
    });
  }
};
