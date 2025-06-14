import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMyFriends,
  getRecommendedUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequest,
  getOutgoingFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsers,
  blockUser,
  unblockUser,
  getMe,
  enableTwoFA,
  disableTwoFA,
  updateProfile,
  searchAll,
  getBlockedUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.get("/me", getMe);
router.get("/blocked-users", getBlockedUsers);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-requests", getFriendRequest);
router.get("outgoing-friend-requests", getOutgoingFriendRequest);
router.delete("/friend-request/:id/reject", rejectFriendRequest);
router.delete("/friend-request/:id/cancel", cancelFriendRequest);
router.delete("/friends/:id", removeFriend);
router.get("/search", searchUsers);
router.get("/search/all", searchAll);
router.post("/block", blockUser);
router.post("/unblock", unblockUser);
router.post("/enable-2fa", enableTwoFA);
router.post("/disable-2fa", disableTwoFA);
router.post("/update-profile", updateProfile);

export default router;
