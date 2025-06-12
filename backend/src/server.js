import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import groupRoutes from "./routes/group.route.js";
import twofaNumberRoutes from "./routes/twofa.number.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { connectDB } from "./lib/db.js";
import "./config/passport.js";
const app = express();
const PORT = process.env.PORT;

// Kết nối database
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Địa chỉ frontend
    credentials: true, // Cho phép gửi cookie từ frontend
  })
);

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
app.use("/api/2fa", twofaNumberRoutes); // Chỉ giữ lại route 2FA số điện thoại
app.use("/api/notifications", notificationRoutes);

// Khởi động server với http + socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Có thể chỉnh lại cho production
    methods: ["GET", "POST"],
  },
});

// Gán io vào app.locals để controller có thể sử dụng emit socket
app.locals.io = io;

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

  // Lời mời kết bạn
  socket.on("send_friend_request", (data) => {
    // data: { toUserId, fromUserId, ... }
    io.to(data.toUserId).emit("friend_request", data);
  });

  // Chấp nhận lời mời kết bạn (emit cho cả 2 phía)
  socket.on("accept_friend_request", (data) => {
    // data: { toUserId, fromUserId, ... }
    io.to(data.toUserId).emit("friend_request_accepted", data); // Người gửi lời mời
    io.to(data.fromUserId).emit("friend_request_accepted", data); // Người nhận lời mời
  });

  // Hủy kết bạn (emit cho cả 2 phía)
  socket.on("remove_friend", (data) => {
    // data: { userId1, userId2, ... }
    io.to(data.userId1).emit("friend_removed", data);
    io.to(data.userId2).emit("friend_removed", data);
  });

  // Mời vào nhóm
  socket.on("send_group_invite", (data) => {
    // data: { toUserId, groupId, fromUserId, ... }
    io.to(data.toUserId).emit("group_invite", data);
  });

  // Chấp nhận lời mời nhóm (emit cho cả user và admin mời)
  socket.on("accept_group_invite", (data) => {
    // data: { toUserId, groupId, invitedBy }
    io.to(data.toUserId).emit("group_invite_accepted", data); // Người được mời
    if (data.invitedBy)
      io.to(data.invitedBy).emit("group_invite_accepted", data); // Người mời
  });

  // Nhóm bị xóa (emit cho tất cả thành viên)
  socket.on("remove_group", (data) => {
    // data: { groupId, memberIds: [] }
    (data.memberIds || []).forEach((userId) => {
      io.to(userId).emit("group_removed", data);
    });
  });

  // Xin vào nhóm (gửi tới tất cả admin)
  socket.on("send_join_request", (data) => {
    // data: { groupId, fromUserId, adminUserIds: [] }
    (data.adminUserIds || []).forEach((adminId) => {
      io.to(adminId).emit("join_request", data);
    });
  });

  // Thông báo chung
  socket.on("send_notification", (data) => {
    // data: { toUserId, ... }
    io.to(data.toUserId).emit("notification", data);
  });

  // Rời nhóm (leave group)
  socket.on("leave_group", (data) => {
    // data: { groupId, userId, userName, ... }
    io.to(data.groupId).emit("group_member_left", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server is running on PORT: ${PORT}`);
});
