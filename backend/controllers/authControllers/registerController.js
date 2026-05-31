import { UserModel } from "../../models/UserModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../../utils/sendEmail.js";
import { PUBLIC_REGISTER_ROLES } from "../../constants/roles.js";
import { sendAuthSuccess } from "../../utils/authResponse.js";
import { getEmailValidationError } from "../../utils/emailValidator.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;
const PASSWORD_RULE_MESSAGE =
  "Password must contain at least one letter, one number, one special character, and be at most 8 characters long.";

const isValidPassword = (password = "") => {
  const regexPass =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;"'<>,.?/\\|]).{1,8}$/;
  return regexPass.test(password);
};

export const registerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const emailValidationError = getEmailValidationError(normalizedEmail);
    if (emailValidationError) {
      return res.status(400).json({
        success: false,
        message: emailValidationError,
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: PASSWORD_RULE_MESSAGE,
        success: false,
      });
    }

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!PUBLIC_REGISTER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be client, freelancer, or admin",
      });
    }

    const existingUser = await UserModel.findOne({ email: normalizedEmail }).select("+password");

    let newUser = existingUser;
    let createdFreshAccount = false;
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: existingUser.authProvider === "google" && !existingUser.password
            ? "This email uses Google sign-in. Please continue with Google."
            : "User already exists",
        });
      }

      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.authProvider = "local";
      existingUser.emailVerificationToken = verificationToken;
      existingUser.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);
      await existingUser.save();
    } else {
      newUser = await UserModel.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        authProvider: "local",
        emailVerificationToken: verificationToken,
        emailVerificationExpire: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationCode,
        verificationCodeExpire: new Date(Date.now() + 10 * 60 * 1000),
      });
      createdFreshAccount = true;
    }

    const verifyURL = `${clientUrl}/verify-email/${verificationToken}`;
    const apiVerifyURL = `http://localhost:${process.env.PORT || 5000}/auth/verify-email/${verificationToken}`;

    let emailSent = true;
    let emailErrorMessage = "";
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your SkillSphere account",
        html: `<h2>Hi ${name}!</h2>
               <p>Your 6-digit verification code is: 
                 <strong style="font-size: 1.25rem; letter-spacing: 2px; color: #6366f1;">
                   ${verificationCode}
                 </strong>
               </p>
               <p>Click below to verify your email automatically:</p>
               <a href="${verifyURL}">Verify on App</a>
               <p>Or use API link for Thunder Client:</p>
               <a href="${apiVerifyURL}">${apiVerifyURL}</a>`,
        verificationCode,
      });
    } catch (emailError) {
      emailSent = false;
      emailErrorMessage = emailError.message;
      console.warn(
        "Verification email failed during registration:",
        emailError.message,
      );
    }

    return sendAuthSuccess(
      res,
      newUser,
      201,
      emailSent
        ? createdFreshAccount
          ? "Registration successful. Please verify your email."
          : "Account updated. Please verify your email."
        : createdFreshAccount
          ? "Registration successful. Email could not be sent, so use the verification link returned by the API."
          : "Account updated. Email could not be sent, so use the verification link returned by the API.",
      {
        emailSent,
        emailErrorMessage,
        verificationUrl: verifyURL,
        verificationCode,
        apiVerificationUrl: apiVerifyURL,
      },
    );
  } catch (error) {
    console.error("Error in registerController:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while registering user",
      error: error.message,
    });
  }
};
