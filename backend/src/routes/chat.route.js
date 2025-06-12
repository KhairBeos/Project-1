import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../middleware/cloudinaryUpload.js";
import {
  getStreamToken,
  pinMessage,
  getMessages,
  markSeen,
  pinDirectMessage,
  unpinDirectMessage,
  addMessageReaction,
  uploadFile,
  searchMessages,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.put("/pin/:messageId", protectRoute, pinMessage);
router.get("/history", protectRoute, getMessages);
router.post("/seen/:messageId", protectRoute, markSeen);
router.post("/pin-direct", protectRoute, pinDirectMessage);
router.post("/unpin-direct", protectRoute, unpinDirectMessage);
router.post("/reaction", protectRoute, addMessageReaction);
router.post("/upload", protectRoute, upload.single("file"), uploadFile);
router.get("/search", protectRoute, searchMessages);

export default router;
