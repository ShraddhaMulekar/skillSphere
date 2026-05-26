import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/mongoDB.js";
import { configurePassport } from "./config/passport.js";
import { authRoutes } from "./routes/authRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { marketplaceRoutes } from "./routes/marketplaceRoutes.js";

dotenv.config();
configurePassport();

const app = express();
const port = process.env.PORT || 8080;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }
});

app.use(helmet());
app.use(passport.initialize());
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// Root health endpoints
app.get("/", (req, res) => {
  res.json({ success: true, message: "SkillSphere API is running", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

// API routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/api", marketplaceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Socket.io handling
const onlineUsers = new Map();
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user ID for direct messaging
  socket.on("register", (userId) => {
    if (userId) {
      onlineUsers.set(String(userId), socket.id);
      socket.join(String(userId));
    }
  });

  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("typing", ({ room, senderId, isTyping }) => {
    socket.to(room).emit("typing_status", { senderId, isTyping });
  });

  socket.on("read_messages", ({ room, userId }) => {
    socket.to(room).emit("messages_read", { userId });
  });

  socket.on("send_private_message", ({ to, message, senderId }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit("receive_private_message", { message, senderId });
  });

  socket.on("send_group_message", ({ room, message, senderId }) => {
    socket.to(room).emit("receive_group_message", { message, senderId });
  });

  // Forward video call offer to the intended receiver
  socket.on('call_offer', ({ to, from, offer }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit('call_offer', { from, offer });
    }
  });

  // Forward ICE candidates to the intended receiver
  socket.on('ice_candidate', ({ to, candidate }) => {
    const targetSocketId = onlineUsers.get(String(to));
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', { candidate });
    }
  });

  // Video call signalling
  socket.on('call_request', ({ to, from }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit('call_request', { from });
  });

  socket.on('call_end', ({ to, from }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit('call_end', { from });
  });

  socket.on('call_signal', ({ to, signal }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit('call_signal', { signal });
  });

  socket.on('call_answer', ({ to, answer }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit('call_answer', { answer });
  });

  socket.on('call_offer', ({ to, offer }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit('call_offer', { offer });
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        break;
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.set("io", io);
app.set("onlineUsers", onlineUsers);

server.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${port}`);
});
