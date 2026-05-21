import speakeasy from "speakeasy";
import qrcode from "qrcode";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/UserModel.js";
import {
  generateTemp2FAToken,
  verifyTemp2FAToken,
} from "../../utils/generateToken.js";
import { sendAuthSuccess } from "../../utils/authResponse.js";

export const setup2FA = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select("+twoFactorSecret");

    const secret = speakeasy.generateSecret({
      name: `SkillSphere (${user.email})`,
      length: 20,
    });

    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false;
    await user.save({ validateBeforeSave: false });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.json({
      success: true,
      qrCode: qrCodeUrl,
      manualEntry: secret.base32,
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

    const user = await UserModel.findById(req.user._id).select("+twoFactorSecret");
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: "Run 2FA setup first",
      });
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.twoFactorEnabled = true;
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
      .select("+password +twoFactorSecret");

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
        return res.status(400).json({
          success: false,
          message: "Current 2FA code is required",
        });
      }
      const valid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 1,
      });
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification code",
        });
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
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

    const user = await UserModel.findById(decoded.id).select("+twoFactorSecret");
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({
        success: false,
        message: "Invalid 2FA session",
      });
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid verification code",
      });
    }

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
