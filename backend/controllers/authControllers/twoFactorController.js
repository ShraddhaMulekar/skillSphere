import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.js";
import {
  generateTemp2FAToken,
  verifyTemp2FAToken,
} from "../../utils/generateToken.js";
import { sendAuthSuccess } from "../../utils/authResponse.js";
import { sendEmail } from "../../utils/sendEmail.js";

const OTP_EXPIRE_MS = 10 * 60 * 1000;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendTwoFactorEmail = async ({ email, name, code, action = "verify" }) => {
  const subject =
    action === "disable"
      ? "Your SkillSphere 2FA disable code"
      : action === "login"
        ? "Your SkillSphere sign-in code"
        : "Your SkillSphere 2FA setup code";

  const html = `
    <h2>Hi ${name || "there"}!</h2>
    <p>Your 6-digit SkillSphere code is:</p>
    <p style="font-size: 24px; letter-spacing: 4px; font-weight: 700;">${code}</p>
    <p>This code expires in 10 minutes.</p>
  `;

  await sendEmail({ to: email, subject, html, verificationCode: code });
};

export const setup2FA = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    const code = generateOtp();
    user.twoFactorOtpCode = code;
    user.twoFactorOtpExpire = new Date(Date.now() + OTP_EXPIRE_MS);
    await user.save({ validateBeforeSave: false });

    await sendTwoFactorEmail({
      email: user.email,
      name: user.name,
      code,
      action: "verify",
    });

    return res.json({
      success: true,
      message: "A 6-digit 2FA code has been sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to setup 2FA",
      error: error.message,
    });
  }
};

export const enable2FA = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code is required" });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user.twoFactorOtpCode || !user.twoFactorOtpExpire) {
      return res.status(400).json({
        success: false,
        message: "Run 2FA setup first",
      });
    }

    if (user.twoFactorOtpExpire.getTime() < Date.now() || user.twoFactorOtpCode !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.twoFactorEnabled = true;
    user.twoFactorOtpCode = undefined;
    user.twoFactorOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: "Two-factor authentication enabled",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to enable 2FA",
      error: error.message,
    });
  }
};

export const disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body || {};
    const user = await UserModel.findById(req.user._id)
      .select("+password");

    if (user.authProvider === "local" || user.password) {
      if (!password) {
        return res
          .status(400)
          .json({ success: false, message: "Password is required" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });
      }
    }

    if (user.twoFactorEnabled) {
      if (!token) {
        const otpCode = generateOtp();
        user.twoFactorOtpCode = otpCode;
        user.twoFactorOtpExpire = new Date(Date.now() + OTP_EXPIRE_MS);
        await user.save({ validateBeforeSave: false });

        await sendTwoFactorEmail({
          email: user.email,
          name: user.name,
          code: otpCode,
          action: "disable",
        });

        return res.json({
          success: true,
          message: "A 6-digit code has been sent to your email. Enter it to disable 2FA.",
          otpSent: true,
        });
      }
      if (!user.twoFactorOtpCode || !user.twoFactorOtpExpire || user.twoFactorOtpExpire.getTime() < Date.now() || user.twoFactorOtpCode !== token) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorOtpCode = undefined;
    user.twoFactorOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: "Two-factor authentication disabled",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to disable 2FA",
      error: error.message,
    });
  }
};

export const verify2FALogin = async (req, res) => {
  try {
    const { tempToken, token } = req.body || {};
    if (!tempToken || !token) {
      return res.status(400).json({
        success: false,
        message: "Session token and verification code are required",
      });
    }

    let decoded;
    try {
      decoded = verifyTemp2FAToken(tempToken);
    } catch {
      return res.status(401).json({
        success: false,
        message: "2FA session expired. Please sign in again.",
      });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({
        success: false,
        message: "Invalid 2FA session",
      });
    }

    if (!user.twoFactorOtpCode || !user.twoFactorOtpExpire || user.twoFactorOtpExpire.getTime() < Date.now() || user.twoFactorOtpCode !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.twoFactorOtpCode = undefined;
    user.twoFactorOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return sendAuthSuccess(res, user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "2FA verification failed",
      error: error.message,
    });
  }
};

export const issue2FATempToken = (user) => generateTemp2FAToken(user._id);
