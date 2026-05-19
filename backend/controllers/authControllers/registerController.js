import { UserModel } from "../../models/UserModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendEmail } from "../../utils/sendEmail.js";
import { generateToken } from "../../utils/generateToken.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;
const ALLOWED_ROLES = ["client", "freelancer"];

export const registerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be client or freelancer",
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      emailVerificationToken: verificationToken,
    });

    const verifyURL = `${clientUrl}/verify-email/${verificationToken}`;
    const apiVerifyURL = `http://localhost:${process.env.PORT || 8080}/auth/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        to: email,
        subject: "Verify your SkillSphere account",
        html: `<h2>Hi ${name}!</h2>
               <p>Click below to verify your email:</p>
               <a href="${verifyURL}">Verify on App</a>
               <p>Or use API link for Thunder Client:</p>
               <a href="${apiVerifyURL}">${apiVerifyURL}</a>`,
      });
    } catch (emailError) {
      console.warn("Email send failed:", emailError.message);
    }

    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while registering user",
      error: error.message,
    });
  }
};
