import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/mongoDB.js";
import { UserModel } from "../models/UserModel.js";
import { ROLES } from "../constants/roles.js";

dotenv.config();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUND) || 10;

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@skillsphere.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const name = process.env.ADMIN_NAME || "Platform Admin";

  await connectDB();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      existing.role = ROLES.ADMIN;
      existing.isVerified = true;
      await existing.save();
      console.log(`Updated ${email} to admin role`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  await UserModel.create({
    name,
    email,
    password: hashedPassword,
    role: ROLES.ADMIN,
    authProvider: "local",
    isVerified: true,
  });

  console.log("Admin user created:");
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log("Change ADMIN_PASSWORD in production.");
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
