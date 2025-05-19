import Group from "../models/Group.js";
import User from "../models/User.js";

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

// Thêm thành viên vào group
// Khi thêm thành viên vào group, kiểm tra nếu user đã block group hoặc bị group block thì không cho thêm
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group không tồn tại" });
    if (group.isDirect)
      return res
        .status(400)
        .json({ message: "Không thể thêm thành viên vào chat 1-1" });
    // Kiểm tra nếu user đã block group
    const user = await User.findById(userId);
    if (
      user?.blockedGroups?.map((id) => String(id)).includes(String(groupId))
    ) {
      return res
        .status(403)
        .json({ message: "User đã chặn group này, không thể thêm vào" });
    }
    // Kiểm tra nếu group đã block user (nếu muốn mở rộng, có thể thêm trường blockedUsers vào Group)
    if (
      group.blockedMembers &&
      group.blockedMembers.map((id) => String(id)).includes(String(userId))
    ) {
      return res.status(403).json({ message: "Bạn đã bị chặn khỏi group này" });
    }
    if (group.members.some((m) => String(m.userId) === userId)) {
      return res.status(400).json({ message: "User đã là thành viên" });
    }
    group.members.push({ userId });
    await group.save();
    res.json({ success: true, group });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi thêm thành viên", error: err.message });
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
      return res
        .status(403)
        .json({
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
      return res
        .status(403)
        .json({
          message: "Chỉ admin hoặc owner mới được phép bỏ chặn thành viên",
        });
    }
    group.blockedMembers = (group.blockedMembers || []).filter(
      (id) => String(id) !== String(userId)
    );
    await group.save();
    res.json({ success: true, blockedMembers: group.blockedMembers });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Lỗi bỏ chặn thành viên khỏi group",
        error: err.message,
      });
  }
};
