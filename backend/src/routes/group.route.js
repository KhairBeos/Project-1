import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import * as groupController from "../controllers/group.controller.js";
import {
  inviteMember,
  getGroupInvitations,
  acceptGroupInvitation,
  rejectGroupInvitation,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, groupController.createGroup);
router.post("/direct", protectRoute, groupController.createOrGetDirectChat);
router.get("/my", protectRoute, groupController.getMyGroups);
router.post("/:groupId/nickname", protectRoute, groupController.setNickname);
router.post("/:groupId/pin", protectRoute, groupController.pinMessage);
router.post("/:groupId/unpin", protectRoute, groupController.unpinMessage);
router.post("/:groupId/mute", protectRoute, groupController.muteGroup);
router.post("/:groupId/unmute", protectRoute, groupController.unmuteGroup);
router.post("/:groupId/mute-member", protectRoute, groupController.muteMember);
router.post(
  "/:groupId/unmute-member",
  protectRoute,
  groupController.unmuteMember
);
router.post(
  "/:groupId/remove-member",
  protectRoute,
  groupController.removeMember
);
router.post(
  "/:groupId/only-admin-can-send",
  protectRoute,
  groupController.setOnlyAdminCanSend
);
router.post("/:groupId/block", protectRoute, groupController.blockGroup);
router.post(
  "/:groupId/block-member",
  protectRoute,
  groupController.blockMember
);
router.post(
  "/:groupId/unblock-member",
  protectRoute,
  groupController.unblockMember
);
router.post("/:groupId/invite", protectRoute, inviteMember);
router.get("/invitations/me", protectRoute, getGroupInvitations);
router.post(
  "/invitation/:inviteId/accept",
  protectRoute,
  acceptGroupInvitation
);
router.post(
  "/invitation/:inviteId/reject",
  protectRoute,
  rejectGroupInvitation
);
router.post("/:groupId/leave", protectRoute, groupController.leaveGroup);
router.delete("/:groupId", protectRoute, groupController.softDeleteGroup);
// --- Group Join Request APIs ---
router.post(
  "/:groupId/join-request",
  protectRoute,
  groupController.requestJoinGroup
);
router.get(
  "/:groupId/join-requests",
  protectRoute,
  groupController.getJoinRequests
);
router.post(
  "/:groupId/join-requests/:requestId/accept",
  protectRoute,
  groupController.acceptJoinRequest
);
router.post(
  "/:groupId/join-requests/:requestId/reject",
  protectRoute,
  groupController.rejectJoinRequest
);
// Lấy danh sách group bị block
router.get("/blocked-groups", protectRoute, groupController.getBlockedGroups);
// Bỏ chặn group (body: { groupId })
router.post("/unblock", protectRoute, groupController.unblockGroup);

export default router;
