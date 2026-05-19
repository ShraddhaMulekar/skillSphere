import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import passport from "passport";
import { connectDB } from "./config/mongoDB.js";
import { configurePassport } from "./config/passport.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";

dotenv.config();
configurePassport();

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(passport.initialize());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SkillSphere API is running",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${port}`);
});
