import { generateStreamToken } from "../lib/stream.js";
import Message from "../models/Message.js";
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

// Ghim tin nhắn trong chat 1-1
export async function pinDirectMessage(req, res) {
  try {
    const userId = req.user._id;
    const { targetUserId, messageId } = req.body;
    if (!targetUserId || !messageId) {
      return res
        .status(400)
        .json({ message: "Missing targetUserId or messageId" });
    }
    // Kiểm tra message tồn tại và thuộc về cuộc trò chuyện 1-1 này
    const message = await Message.findById(messageId);
    if (
      !message ||
      !(
        (message.sender.equals(userId) &&
          message.receiver.equals(targetUserId)) ||
        (message.sender.equals(targetUserId) && message.receiver.equals(userId))
      )
    ) {
      return res
        .status(404)
        .json({ message: "Message not found or not in this direct chat" });
    }
    // Chỉ cho phép 1 tin nhắn pin với mỗi cặp user
    await User.updateOne(
      { _id: userId },
      {
        $pull: { pinnedDirectMessages: { user: targetUserId } },
      }
    );
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          pinnedDirectMessages: { user: targetUserId, message: messageId },
        },
      }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to pin direct message" });
  }
}

// Bỏ ghim tin nhắn trong chat 1-1
export async function unpinDirectMessage(req, res) {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ message: "Missing targetUserId" });
    }
    await User.updateOne(
      { _id: userId },
      {
        $pull: { pinnedDirectMessages: { user: targetUserId } },
      }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to unpin direct message" });
  }
}

// Thả reaction cho tin nhắn (group hoặc direct)
export async function addMessageReaction(req, res) {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.user._id;
    if (!messageId || !emoji) {
      return res.status(400).json({ message: "Missing messageId or emoji" });
    }
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    // Xóa reaction cũ của user với emoji này (nếu có)
    message.reactions = message.reactions.filter(
      (r) => !(r.user.equals(userId) && r.emoji === emoji)
    );
    // Thêm reaction mới
    message.reactions.push({ user: userId, emoji });
    await message.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to add reaction" });
  }
}

// Upload file (Cloudinary)
export async function uploadFile(req, res) {
  try {
    const { receiver, roomId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Tạo message mới
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiver || undefined,
      group: undefined, // Nếu muốn hỗ trợ group chat, truyền groupId thay cho receiver
      content: "",
      messageType: file.mimetype.startsWith("image/") ? "image" : "file",
      attachments: [
        {
          url: file.path,
          name: file.originalname,
          type: file.mimetype,
        },
      ],
      roomId: roomId || undefined,
    });

    res.json({
      messageId: message._id,
      fileUrl: file.path,
      fileName: file.originalname,
      fileType: file.mimetype,
    });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
}

// Tìm kiếm tin nhắn (group hoặc 1-1)
export async function searchMessages(req, res) {
  try {
    const { group, user, query = "", limit = 50 } = req.query;
    if (!group && !user) {
      return res
        .status(400)
        .json({ message: "Missing group or user parameter" });
    }
    let filter = { isDeleted: false };
    if (group) {
      filter.group = group;
    } else if (user) {
      filter.$or = [
        { sender: req.user._id, receiver: user },
        { sender: user, receiver: req.user._id },
      ];
    }
    if (query) {
      filter.content = { $regex: query, $options: "i" };
    }
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("sender receiver replyTo reactions.user");
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to search messages" });
  }
}
