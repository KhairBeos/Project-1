import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import groupRoutes from "./routes/group.route.js";
import twofaRoutes from "./routes/twofa.route.js";

import { connectDB } from "./lib/db.js";
import "./config/passport.js";
const app = express();
const PORT = process.env.PORT;

// Kết nối database
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    },
  })
);

// Khởi tạo Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/2fa", twofaRoutes);

// Khởi động server với http + socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Có thể chỉnh lại cho production
    methods: ["GET", "POST"],
  },
});

// Socket.io event cơ bản
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Nhận tin nhắn mới và broadcast cho group/receiver
  socket.on("send_message", (data) => {
    // data: { group, receiver, message }
    if (data.group) {
      io.to(data.group).emit("receive_message", data);
    } else if (data.receiver) {
      io.to(data.receiver).emit("receive_message", data);
    }
  });

  // Tham gia room group hoặc 1-1
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
  });

  // Thả cảm xúc
  socket.on("react_message", (data) => {
    // data: { messageId, emoji, userId, group/receiver }
    if (data.group) {
      io.to(data.group).emit("message_reaction", data);
    } else if (data.receiver) {
      io.to(data.receiver).emit("message_reaction", data);
    }
  });

  // Đánh dấu đã xem
  socket.on("seen_message", (data) => {
    // data: { messageId, userId, group/receiver }
    if (data.group) {
      io.to(data.group).emit("message_seen", data);
    } else if (data.receiver) {
      io.to(data.receiver).emit("message_seen", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server is running on PORT: ${PORT}`);
});
