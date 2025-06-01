import express from "express";
import {
  generate2FANumber,
  verify2FANumber,
} from "../controllers/twofa.number.controller.js";

const router = express.Router();

// Sinh 3 số cho number-matching 2FA
router.post("/number-matching/generate", generate2FANumber);
// Xác thực số đã chọn
router.post("/number-matching/verify", verify2FANumber);

export default router;
