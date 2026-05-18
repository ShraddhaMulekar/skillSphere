import { UserModel } from "../../models/UserModel.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import { sendEmail } from "../../utils/sendEmail.js";
import { generateToken } from "../../utils/generateToken.js";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    // Validate input
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        // console.log({existingUser})
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Create email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const newUser = await UserModel.create({
      name,
      email,
      password,
      role,
      emailVerificationToken: verificationToken,
    });

    // Send verification email
    const verifyURL = `${clientUrl}/verify-email/${verificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify your SkillSphere account",
      html: `<h2>Hi ${name}!</h2>
             <p>Click below to verify your email:</p>
             <a href="${verifyURL}">Verify Email</a>`,
    });

    // Hash password and save user
    bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUND),
      async (err, hash) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Error occurred while hashing password",
            error: err.message,
          });
        } else {
          newUser.password = hash;
          await newUser.save();
        }
      },
    );

    // Generate JWT token
    const token = generateToken(newUser._id, newUser.role);

            // console.log({token, newUser})
    return res.status(201).json({
      success: true,
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
            // console.log({error})
    return res.status(500).json({
      success: false,
      message: "Error occurred while registering user",
      error: error.message,
    });
  }
};
