import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session"; // Nếu bạn muốn dùng session
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import "./lib/passport.js"; // Quan trọng: đảm bảo cấu hình passport được import

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
    secret: process.env.SESSION_SECRET, //
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

// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server is running on PORT: ${PORT}`);
});
