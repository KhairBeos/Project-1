import { generateStreamToken } from "../lib/stream.js";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user._id);
    if (!token) {
      return res.status(500).json({ message: "Failed to generate token" });
    }
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error in getStreamToken controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Gửi tin nhắn (text, file, image, ...)
export async function sendMessage(req, res) {
  try {
    const {
      group,
      receiver,
      content,
      messageType,
      replyTo,
      attachments,
      forwardedFrom,
    } = req.body;
    const sender = req.user._id;
    if (!content && (!attachments || attachments.length === 0)) {
      return res
        .status(400)
        .json({ message: "Message content or attachment required" });
    }
    // Nếu gửi vào group, kiểm tra quyền gửi
    if (group) {
      const groupDoc = await Group.findById(group);
      if (!groupDoc)
        return res.status(404).json({ message: "Group không tồn tại" });
      // Nếu group bật chế độ chỉ admin/owner được gửi tin nhắn
      if (groupDoc.settings?.onlyAdminCanSend) {
        const member = groupDoc.members.find(
          (m) => String(m.userId) === String(sender)
        );
        if (!member || !["admin", "owner"].includes(member.role)) {
          return res
            .status(403)
            .json({
              message:
                "Chỉ admin hoặc owner mới được gửi tin nhắn trong group này",
            });
        }
      }
      // Nếu user bị mute thì không cho gửi
      if (
        groupDoc.mutedMembers &&
        groupDoc.mutedMembers.map((id) => String(id)).includes(String(sender))
      ) {
        return res
          .status(403)
          .json({ message: "Bạn đã bị admin mute, không thể gửi tin nhắn" });
      }
      // Nếu user bị group chặn thì không gửi được
      if (
        groupDoc.blockedMembers &&
        groupDoc.blockedMembers.map((id) => String(id)).includes(String(sender))
      ) {
        return res
          .status(403)
          .json({ message: "Bạn đã bị chặn khỏi group này" });
      }
    }
    // Nếu gửi tin nhắn 1-1, kiểm tra block
    if (receiver) {
      const senderUser = await User.findById(sender);
      const receiverUser = await User.findById(receiver);
      if (
        senderUser.blockedUsers
          ?.map((id) => String(id))
          .includes(String(receiver)) ||
        receiverUser.blockedUsers
          ?.map((id) => String(id))
          .includes(String(sender))
      ) {
        return res
          .status(403)
          .json({
            message:
              "Bạn không thể nhắn tin với người đã chặn hoặc bị bạn chặn",
          });
      }
    }
    const message = await Message.create({
      sender,
      group: group || undefined,
      receiver: receiver || undefined,
      content,
      messageType: messageType || "text",
      replyTo: replyTo || undefined,
      attachments: attachments || [],
      forwardedFrom: forwardedFrom || undefined,
    });
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
}

// Sửa tin nhắn
export async function editMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!message.sender.equals(userId))
      return res.status(403).json({ message: "Not allowed" });
    message.editHistory = message.editHistory || [];
    message.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });
    message.content = content;
    message.isEdited = true;
    await message.save();
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: "Failed to edit message" });
  }
}

// Thu hồi (unsend) tin nhắn
export async function recallMessage(req, res) {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!message.sender.equals(userId))
      return res.status(403).json({ message: "Not allowed" });
    message.isDeleted = true;
    message.content = "";
    await message.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to recall message" });
  }
}

// Thả cảm xúc (reaction)
export async function reactMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    // Xóa reaction cũ nếu có
    message.reactions = (message.reactions || []).filter(
      (r) => !r.user.equals(userId)
    );
    // Thêm reaction mới
    message.reactions.push({ user: userId, emoji });
    await message.save();
    res.status(200).json({ success: true, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: "Failed to react to message" });
  }
}

// Ghim/ghỡ ghim tin nhắn
export async function pinMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { isPinned } = req.body;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { isPinned },
      { new: true }
    );
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: "Failed to pin/unpin message" });
  }
}

// Chuyển tiếp tin nhắn
export async function forwardMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { group, receiver } = req.body;
    const userId = req.user._id;
    const original = await Message.findById(messageId);
    if (!original)
      return res.status(404).json({ message: "Original message not found" });
    const message = await Message.create({
      sender: userId,
      group: group || undefined,
      receiver: receiver || undefined,
      content: original.content,
      messageType: original.messageType,
      attachments: original.attachments,
      forwardedFrom: original._id,
    });
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: "Failed to forward message" });
  }
}

// Lấy lịch sử chat (group hoặc 1-1)
export async function getMessages(req, res) {
  try {
    const { group, user, limit = 30, skip = 0 } = req.query;
    let filter = {};
    if (group) filter.group = group;
    else if (user) {
      filter.$or = [
        { sender: req.user._id, receiver: user },
        { sender: user, receiver: req.user._id },
      ];
    }
    filter.isDeleted = false;
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("sender receiver replyTo reactions.user");
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to get messages" });
  }
}

// Đánh dấu đã xem
export async function markSeen(req, res) {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!message.seenBy.includes(userId)) {
      message.seenBy.push(userId);
      await message.save();
    }
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark as seen" });
  }
}
