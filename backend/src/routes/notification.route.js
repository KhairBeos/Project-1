import express from "express";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.patch("/read/:id", protectRoute, markRead);
router.patch("/read-all", protectRoute, markAllRead);
router.delete("/:id", protectRoute, deleteNotification);
router.delete("/", protectRoute, deleteAllNotifications);

export default router;
