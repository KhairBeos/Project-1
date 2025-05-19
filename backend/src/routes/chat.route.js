import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  sendMessage,
  editMessage,
  recallMessage,
  reactMessage,
  pinMessage,
  forwardMessage,
  getMessages,
  markSeen,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/send", protectRoute, sendMessage);
router.put("/edit/:messageId", protectRoute, editMessage);
router.delete("/recall/:messageId", protectRoute, recallMessage);
router.post("/react/:messageId", protectRoute, reactMessage);
router.put("/pin/:messageId", protectRoute, pinMessage);
router.post("/forward/:messageId", protectRoute, forwardMessage);
router.get("/history", protectRoute, getMessages);
router.post("/seen/:messageId", protectRoute, markSeen);

export default router;
