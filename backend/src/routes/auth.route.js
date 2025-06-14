import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import {
  login,
  logout,
  signup,
  onboard,
  sendEmailVerification,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  updateProfile,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPasswordWithCode,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Đăng ký tài khoản
router.post("/signup", signup);

// Đăng nhập
router.post("/login", login);

// Đăng xuất
router.post("/logout", logout);

// Hoàn thành thông tin người dùng
router.post("/onboarding", protectRoute, onboard);

router.get("/me", protectRoute, (req, res) => {
  const user = req.user?.toObject ? req.user.toObject() : req.user;
  if (user) {
    user.isEmailVerified = user.isVerified;
    delete user.password;
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// Gửi mã xác minh
router.post("/send-verification", protectRoute, sendEmailVerification);

// Xác minh mã
router.post("/verify-email", protectRoute, verifyEmail);

// Gửi lại mã xác minh
router.post("/resend-verification", protectRoute, resendVerificationEmail);

// Đổi mật khẩu
router.post("/change-password", protectRoute, changePassword);

// Cập nhật thông tin cá nhân
router.put("/update-profile", protectRoute, updateProfile);

// Bắt đầu login với Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback sau khi Google xác thực
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.redirect(`http://localhost:5173/login/success?token=${token}`); // Redirect về frontend với token JWT
  }
);

// Quên mật khẩu bằng mã xác nhận OTP
router.post("/forgot-password", sendForgotPasswordCode);
router.post("/forgot-password/verify", verifyForgotPasswordCode);
router.post("/forgot-password/reset", resetPasswordWithCode);

export default router;
