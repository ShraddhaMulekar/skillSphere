import { UserModel } from "../../models/UserModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../../utils/sendEmail.js";
import { PUBLIC_REGISTER_ROLES } from "../../constants/roles.js";
import { sendAuthSuccess } from "../../utils/authResponse.js";
import { getEmailValidationError } from "../../utils/emailValidator.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;

export const registerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const emailValidationError = getEmailValidationError(email);
    if (emailValidationError) {
      return res.status(400).json({
        success: false,
        message: emailValidationError,
      });
    }

    if (!PUBLIC_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be client or freelancer",
      });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await UserModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      authProvider: "local",
      emailVerificationToken: verificationToken,
      emailVerificationExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyURL = `${clientUrl}/verify-email/${verificationToken}`;
    const apiVerifyURL = `http://localhost:${process.env.PORT || 5000}/auth/verify-email/${verificationToken}`;

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    newUser.verificationCode = verificationCode;
    newUser.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
    await newUser.save();
    
    let emailSent = true;
    try {
      await sendEmail({
        to: newUser.email,
        subject: "Verify your SkillSphere account",
        html: `<h2>Hi ${name}!</h2>
               <p>Your 6-digit verification code is: <strong style="font-size: 1.25rem; letter-spacing: 2px; color: #6366f1;">${verificationCode}</strong></p>
               <p>Click below to verify your email automatically:</p>
               <a href="${verifyURL}">Verify on App</a>
               <p>Or use API link for Thunder Client:</p>
               <a href="${apiVerifyURL}">${apiVerifyURL}</a>`,
      });
    } catch (emailError) {
      emailSent = false;
      console.warn("Verification email failed during registration:", emailError.message);
    }

    return sendAuthSuccess(
      res,
      newUser,
      201,
      emailSent
        ? "Registration successful. Please verify your email."
        : "Registration successful. Email could not be sent, so use the verification link returned by the API.",
      {
        emailSent,
        verificationUrl: verifyURL,
        verificationCode: newUser.verificationCode,
        apiVerificationUrl: apiVerifyURL,
      },
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while registering user",
      error: error.message,
    });
  }
};
