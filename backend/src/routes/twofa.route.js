import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  enable2FA,
  verify2FA,
  verify2FALogin,
} from "../controllers/twofa.controller.js";

const router = express.Router();

router.post("/enable", protectRoute, enable2FA); // Bật 2FA, trả QR code
router.post("/verify", protectRoute, verify2FA); // Xác thực OTP và bật 2FA
router.post("/verify-login", verify2FALogin); // Xác thực OTP khi login

export default router;
