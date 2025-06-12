import Group from "../models/Group.js";
import User from "../models/User.js";
import GroupInvitation from "../models/GroupInvitation.js";

// Tạo group chat (nhiều người)
export const createGroup = async (req, res) => {
  try {
    const { name, description, avatar, members, settings } = req.body;
    const ownerId = req.user._id;
    if (!name || !members || members.length < 2) {
      return res
        .status(400)
        .json({ message: "Group name và ít nhất 2 thành viên!" });
    }
    const group = await Group.create({
      name,
      description,
      avatar,
      createdBy: ownerId,
      members: [
        { userId: ownerId, role: "owner", joinedAt: new Date() },
        ...members
          .filter((id) => id !== String(ownerId))
          .map((id) => ({ userId: id })),
      ],
      settings,
      isDirect: false,
    });
    res.status(201).json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: "Tạo group thất bại", error: err.message });
  }
};

// Tạo hoặc lấy chat 1-1
export const createOrGetDirectChat = async (req, res) => {
  try {
    const userA = req.user._id;
    const { userB } = req.body;
    if (!userB) return res.status(400).json({ message: "Thiếu userB" });
    let group = await Group.findOne({
      isDirect: true,
      "members.userId": { $all: [userA, userB] },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    });
    if (!group) {
      group = await Group.create({
        name: "",
        createdBy: userA,
        members: [
          { userId: userA, role: "member" },
          { userId: userB, role: "member" },
        ],
        isDirect: true,
      });
    }
    res.json({ success: true, group });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi tạo/lấy chat 1-1", error: err.message });
  }
};

// Lấy danh sách group của user
// Khi lấy danh sách group của user, loại bỏ các group mà user đã chặn hoặc bị group chặn
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    let groups = await Group.find({
      "members.userId": userId,
      isDeleted: { $ne: true },
    });
    // Loại bỏ group mà user đã chặn
    if (user.blockedGroups && user.blockedGroups.length > 0) {
      groups = groups.filter(
        (g) =>
          !user.blockedGroups.map((id) => String(id)).includes(String(g._id))
      );
    }
    // Loại bỏ group mà user bị group chặn
    groups = groups.filter(
      (g) => !g.blockedMembers?.map((id) => String(id)).includes(String(userId))
    );
    res.json({ success: true, groups });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách group", error: err.message });
  }
};

// Lấy danh sách group bị block của user (trả về đầy đủ thông tin group)
export const getBlockedGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    const blockedGroupIds = user.blockedGroups || [];
    if (!blockedGroupIds.length) return res.json({ success: true, groups: [] });
    const groups = await Group.find({ _id: { $in: blockedGroupIds } })
      .select(
        "_id name avatar description members type isDirect createdBy createdAt updatedAt"
      )
      .lean();
    res.json({ success: true, groups });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Lỗi lấy danh sách group bị block",
        error: err.message,
      });
  }
};

// Xóa mềm group
export const softDeleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findByIdAndUpdate(
      groupId,
      { isDeleted: true },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });

    // Emit socket event for realtime update to all group members
    const io = req.app.locals.io;
    if (io && group.members && group.members.length > 0) {
      const memberIds = group.members.map((m) => String(m.userId));
      memberIds.forEach((userId) => {
        io.to(userId).emit("group_removed", {
          groupId: String(group._id),
          memberIds,
        });
      });
    }

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa group", error: err.message });
  }
};

// Đổi nickname
export const setNickname = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, nickname } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    const member = group.members.find((m) => String(m.userId) === userId);
    if (!member)
      return res.status(404).json({ message: "User không phải thành viên" });
    member.nickname = nickname;
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: "Lỗi đổi nickname", error: err.message });
  }
};

// Ghim tin nhắn
export const pinMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { messageId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    if (!group.pinnedMessages.includes(messageId)) {
      group.pinnedMessages.push(messageId);
      await group.save();
    }
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: "Lỗi ghim tin nhắn", error: err.message });
  }
};

// Bỏ ghim tin nhắn
export const unpinMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { messageId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được bỏ ghim
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res
        .status(403)
        .json({ message: "Chỉ admin hoặc owner mới được phép bỏ ghim" });
    }
    group.pinnedMessages = (group.pinnedMessages || []).filter(
      (id) => String(id) !== String(messageId)
    );
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi bỏ ghim tin nhắn", error: err.message });
  }
};

// Tắt thông báo group hoặc chat cá nhân (thêm cả group lẫn 1-1)
export const muteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    if (!user.mutedGroups) user.mutedGroups = [];
    if (!user.mutedGroups.map((id) => String(id)).includes(String(groupId))) {
      user.mutedGroups.push(groupId);
      await user.save();
    }
    res.json({ success: true, mutedGroups: user.mutedGroups });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi tắt thông báo group/chat", error: err.message });
  }
};

// Bật lại thông báo group hoặc chat cá nhân
export const unmuteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    user.mutedGroups = (user.mutedGroups || []).filter(
      (id) => String(id) !== String(groupId)
    );
    await user.save();
    res.json({ success: true, mutedGroups: user.mutedGroups });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi bật lại thông báo group/chat",
      error: err.message,
    });
  }
};

// Mute thành viên trong group (chỉ admin/owner mới được phép)
export const muteMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    const admin = group.members.find(
      (m) => String(m.userId) === String(userId)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc owner mới được phép mute thành viên",
      });
    }
    if (!group.mutedMembers.includes(memberId)) {
      group.mutedMembers.push(memberId);
      await group.save();
    }
    res.json({ success: true, mutedMembers: group.mutedMembers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi mute thành viên", error: err.message });
  }
};

// Unmute thành viên trong group
export const unmuteMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    const admin = group.members.find(
      (m) => String(m.userId) === String(userId)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc owner mới được phép unmute thành viên",
      });
    }
    group.mutedMembers = group.mutedMembers.filter(
      (id) => String(id) !== String(memberId)
    );
    await group.save();
    res.json({ success: true, mutedMembers: group.mutedMembers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi unmute thành viên", error: err.message });
  }
};

// Xóa thành viên khỏi group (chỉ admin/owner mới được phép)
export const removeMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    if (group.isDirect)
      return res
        .status(400)
        .json({ message: "Không thể xóa thành viên khỏi chat 1-1" });
    // Chỉ admin/owner mới được xóa thành viên
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res
        .status(403)
        .json({ message: "Chỉ admin hoặc owner mới được phép xóa thành viên" });
    }
    // Không cho phép xóa owner
    const member = group.members.find(
      (m) => String(m.userId) === String(userId)
    );
    if (!member)
      return res.status(404).json({ message: "User không phải thành viên" });
    if (member.role === "owner")
      return res
        .status(400)
        .json({ message: "Không thể xóa owner khỏi group" });
    group.members = group.members.filter(
      (m) => String(m.userId) !== String(userId)
    );
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa thành viên", error: err.message });
  }
};

// Chỉnh chế độ chỉ admin/owner được nhắn tin
export const setOnlyAdminCanSend = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { onlyAdminCanSend } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được chỉnh
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc owner mới được phép chỉnh chế độ này",
      });
    }
    group.settings = group.settings || {};
    group.settings.onlyAdminCanSend = !!onlyAdminCanSend;
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi chỉnh chế độ chỉ admin nhắn tin",
      error: err.message,
    });
  }
};

// Chặn group (user không muốn tham gia hoặc nhận tin nhắn từ group này)
export const blockGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    if (!user.blockedGroups) user.blockedGroups = [];
    if (!user.blockedGroups.map((id) => String(id)).includes(String(groupId))) {
      user.blockedGroups.push(groupId);
      // Nếu đang là thành viên group thì tự động rời khỏi group
      await Group.findByIdAndUpdate(groupId, {
        $pull: { members: { userId } },
      });
      await user.save();
    }
    res.json({ success: true, blockedGroups: user.blockedGroups });
  } catch (err) {
    res.status(500).json({ message: "Lỗi chặn group", error: err.message });
  }
};

// Bỏ chặn group
export const unblockGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { groupId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    user.blockedGroups = (user.blockedGroups || []).filter(
      (id) => String(id) !== String(groupId)
    );
    await user.save();
    res.json({ success: true, blockedGroups: user.blockedGroups });
  } catch (err) {
    res.status(500).json({ message: "Lỗi bỏ chặn group", error: err.message });
  }
};

// Chặn user khỏi group (chỉ admin/owner mới được phép)
export const blockMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được chặn
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc owner mới được phép chặn thành viên",
      });
    }
    if (!group.blockedMembers) group.blockedMembers = [];
    if (
      !group.blockedMembers.map((id) => String(id)).includes(String(userId))
    ) {
      group.blockedMembers.push(userId);
      // Nếu user đang là thành viên thì xóa khỏi group
      group.members = group.members.filter(
        (m) => String(m.userId) !== String(userId)
      );
      await group.save();
    }
    res.json({ success: true, blockedMembers: group.blockedMembers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi chặn thành viên khỏi group", error: err.message });
  }
};

// Bỏ chặn user khỏi group
export const unblockMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được bỏ chặn
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc owner mới được phép bỏ chặn thành viên",
      });
    }
    group.blockedMembers = (group.blockedMembers || []).filter(
      (id) => String(id) !== String(userId)
    );
    await group.save();
    res.json({ success: true, blockedMembers: group.blockedMembers });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi bỏ chặn thành viên khỏi group",
      error: err.message,
    });
  }
};

// --- Group Invitation APIs ---
// Gửi lời mời tham gia group (chỉ tạo invitation, không thêm vào group ngay)
export const inviteMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { identifier } = req.body; // username hoặc email
    if (!identifier)
      return res.status(400).json({ message: "Thiếu username hoặc email" });
    // Tìm user theo username (account) hoặc email
    const user = await User.findOne({
      $or: [{ account: identifier }, { email: identifier }],
    });
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    const userId = String(user._id);
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    if (group.isDirect)
      return res.status(400).json({ message: "Không thể mời vào chat 1-1" });
    // Kiểm tra block
    if (user.blockedGroups?.map((id) => String(id)).includes(String(groupId))) {
      return res.status(403).json({ message: "User đã chặn group này" });
    }
    if (group.blockedMembers?.map((id) => String(id)).includes(userId)) {
      return res.status(403).json({ message: "Bạn đã bị chặn khỏi group này" });
    }
    if (group.members.some((m) => String(m.userId) === userId)) {
      return res.status(400).json({ message: "User đã là thành viên" });
    }
    // Kiểm tra đã có lời mời chưa
    const existing = await GroupInvitation.findOne({
      group: groupId,
      user: userId,
      status: "pending",
    });
    if (existing)
      return res.status(400).json({ message: "Đã gửi lời mời trước đó" });
    await GroupInvitation.create({
      group: groupId,
      user: userId,
      invitedBy: req.user._id,
      status: "pending",
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi gửi lời mời", error: err.message });
  }
};

// Lấy danh sách lời mời group của user (pending)
export const getGroupInvitations = async (req, res) => {
  try {
    const invites = await GroupInvitation.find({
      user: req.user._id,
      status: "pending",
    })
      .populate("group", "name avatar")
      .populate("invitedBy", "fullName profilePic");
    res.json({ success: true, invites });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy lời mời group", error: err.message });
  }
};

// Accept lời mời group
export const acceptGroupInvitation = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const invite = await GroupInvitation.findById(inviteId);
    if (!invite || String(invite.user) !== String(req.user._id)) {
      return res.status(404).json({ message: "Lời mời không tồn tại" });
    }
    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Lời mời đã xử lý" });
    }
    // Thêm user vào group
    const group = await Group.findById(invite.group);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    if (group.members.some((m) => String(m.userId) === String(req.user._id))) {
      invite.status = "accepted";
      invite.respondedAt = new Date();
      await invite.save();
      return res.json({ success: true, message: "Đã là thành viên" });
    }
    group.members.push({ userId: req.user._id });
    await group.save();
    invite.status = "accepted";
    invite.respondedAt = new Date();
    await invite.save();

    // Emit socket event for realtime update
    const io = req.app.locals.io;
    if (io) {
      // Notify the invited user
      io.to(String(invite.user)).emit("group_invite_accepted", {
        groupId: String(group._id),
        toUserId: String(invite.user),
        invitedBy: String(invite.invitedBy),
      });
      // Notify the inviter (admin/owner who sent the invite)
      if (
        invite.invitedBy &&
        String(invite.invitedBy) !== String(invite.user)
      ) {
        io.to(String(invite.invitedBy)).emit("group_invite_accepted", {
          groupId: String(group._id),
          toUserId: String(invite.user),
          invitedBy: String(invite.invitedBy),
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi accept lời mời", error: err.message });
  }
};

// Reject lời mời group
export const rejectGroupInvitation = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const invite = await GroupInvitation.findById(inviteId);
    if (!invite || String(invite.user) !== String(req.user._id)) {
      return res.status(404).json({ message: "Lời mời không tồn tại" });
    }
    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Lời mời đã xử lý" });
    }
    invite.status = "rejected";
    invite.respondedAt = new Date();
    await invite.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi reject lời mời", error: err.message });
  }
};

// Thành viên tự rời group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    const member = group.members.find(
      (m) => String(m.userId) === String(userId)
    );
    if (!member)
      return res
        .status(404)
        .json({ message: "Bạn không phải thành viên nhóm này" });
    if (member.role === "owner") {
      return res.status(400).json({
        message:
          "Owner không thể tự rời nhóm. Hãy chuyển quyền owner hoặc xóa nhóm.",
      });
    }
    group.members = group.members.filter(
      (m) => String(m.userId) !== String(userId)
    );
    await group.save();

    // Emit socket event cho các thành viên khác biết user đã rời nhóm
    const user = await User.findById(userId);
    const io = req.app.locals.io;
    if (io && user) {
      io.to(groupId).emit("group_member_left", {
        groupId,
        userId,
        userName: user.fullName || user.account || user.email || userId,
        leftAt: new Date(),
      });
    }
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: "Lỗi rời nhóm", error: err.message });
  }
};

// --- Group Join Request APIs (user xin vào nhóm, admin duyệt) ---
// User gửi yêu cầu xin vào nhóm
export const requestJoinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    if (group.isDirect)
      return res.status(400).json({ message: "Không thể xin vào chat 1-1" });
    if (group.members.some((m) => String(m.userId) === String(userId))) {
      return res.status(400).json({ message: "Bạn đã là thành viên" });
    }
    // Kiểm tra đã có join request chưa
    const existing = await GroupInvitation.findOne({
      group: groupId,
      user: userId,
      status: "pending",
      invitedBy: userId, // Đánh dấu là user tự xin vào
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "Đã gửi yêu cầu trước đó, vui lòng chờ duyệt" });
    await GroupInvitation.create({
      group: groupId,
      user: userId,
      invitedBy: userId, // Đánh dấu là user tự xin vào
      status: "pending",
      type: "join_request", // Phân biệt với lời mời admin
    });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi gửi yêu cầu vào nhóm", error: err.message });
  }
};

// Admin lấy danh sách yêu cầu join group (pending)
export const getJoinRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được xem
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res
        .status(403)
        .json({ message: "Chỉ admin hoặc owner mới được xem yêu cầu" });
    }
    const requests = await GroupInvitation.find({
      group: groupId,
      status: "pending",
      type: "join_request",
    }).populate("user", "fullName profilePic email");
    res.json({ success: true, requests });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy yêu cầu vào nhóm", error: err.message });
  }
};

// Admin duyệt yêu cầu join group
export const acceptJoinRequest = async (req, res) => {
  try {
    const { groupId, requestId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được duyệt
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res
        .status(403)
        .json({ message: "Chỉ admin hoặc owner mới được duyệt" });
    }
    const joinReq = await GroupInvitation.findById(requestId);
    if (
      !joinReq ||
      String(joinReq.group) !== String(groupId) ||
      joinReq.status !== "pending"
    ) {
      return res
        .status(404)
        .json({ message: "Yêu cầu không tồn tại hoặc đã xử lý" });
    }
    // Thêm user vào group
    if (!group.members.some((m) => String(m.userId) === String(joinReq.user))) {
      group.members.push({ userId: joinReq.user });
      await group.save();
    }
    joinReq.status = "accepted";
    joinReq.respondedAt = new Date();
    await joinReq.save();
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi duyệt yêu cầu vào nhóm", error: err.message });
  }
};

// Admin từ chối yêu cầu join group
export const rejectJoinRequest = async (req, res) => {
  try {
    const { groupId, requestId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    // Chỉ admin/owner mới được từ chối
    const admin = group.members.find(
      (m) => String(m.userId) === String(req.user._id)
    );
    if (!admin || !["admin", "owner"].includes(admin.role)) {
      return res
        .status(403)
        .json({ message: "Chỉ admin hoặc owner mới được từ chối" });
    }
    const joinReq = await GroupInvitation.findById(requestId);
    if (
      !joinReq ||
      String(joinReq.group) !== String(groupId) ||
      joinReq.status !== "pending"
    ) {
      return res
        .status(404)
        .json({ message: "Yêu cầu không tồn tại hoặc đã xử lý" });
    }
    joinReq.status = "rejected";
    joinReq.respondedAt = new Date();
    await joinReq.save();
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi từ chối yêu cầu vào nhóm", error: err.message });
  }
};
