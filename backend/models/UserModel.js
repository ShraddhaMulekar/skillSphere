import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ALL_ROLES, ROLES } from "../constants/roles.js";

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minLength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.CLIENT,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    phone: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 500 },
    location: { type: String, default: "" },
    companyName: { type: String, default: "" },
    skills: [skillSchema],
    hourlyRate: { type: Number, default: 0 },
    milestoneRate: { type: Number, default: 0 },
    portfolio: [{ type: String }], // URLs to projects/images
    resume: { type: String, default: "" }, // URL to uploaded resume
    certifications: [{ type: String }],
    experience: [
      {
        company: String,
        title: String,
        duration: String,
        description: String,
      },
    ],
    availability: {
      type: Map,
      of: String, // e.g., "Monday": "09:00 - 17:00"
      default: {},
    },
    verificationBadge: {
      type: Boolean,
      default: false,
    },
    verificationCode: String,
    verificationCodeExpire: Date,
    isSuspended: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre("validate", async function () {
  if (this.authProvider === "local" && !this.password && !this.googleId) {
    this.invalidate("password", "Password is required for local accounts");
  }
});

// Match password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const UserModel = mongoose.model("user", userSchema);
