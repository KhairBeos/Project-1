import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import * as groupController from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, groupController.createGroup);
router.post("/direct", protectRoute, groupController.createOrGetDirectChat);
router.get("/my", protectRoute, groupController.getMyGroups);
router.post("/:groupId/add-member", protectRoute, groupController.addMember);
router.post("/:groupId/nickname", protectRoute, groupController.setNickname);
router.post("/:groupId/pin", protectRoute, groupController.pinMessage);
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
router.post("/:groupId/unblock", protectRoute, groupController.unblockGroup);
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
router.delete("/:groupId", protectRoute, groupController.softDeleteGroup);

export default router;
