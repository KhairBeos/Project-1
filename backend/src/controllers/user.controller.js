import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Group from "../models/Group.js";
import { generateStreamToken } from "../lib/stream.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
      ],
    });
    res.status(200).json({ recommendedUsers });
  } catch (error) {
    console.error("Error in getRecommendedUsers controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate("friends", "fullName profilePic nationality status lastActive");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params;

    if (myId.toString() === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient.friends.includes(myId)) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    const existingRequest = await User.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json({ friendRequest });
  } catch (error) {
    console.error("Error in sendFriendRequest controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    // Emit socket event cho cả 2 phía
    const io = req.app.locals.io;
    if (io) {
      io.to(friendRequest.sender.toString()).emit("friend_request_accepted", {
        toUserId: friendRequest.sender.toString(),
        fromUserId: friendRequest.recipient.toString(),
      });
      io.to(friendRequest.recipient.toString()).emit(
        "friend_request_accepted",
        {
          toUserId: friendRequest.sender.toString(),
          fromUserId: friendRequest.recipient.toString(),
        }
      );
    }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error("Error in acceptFriendRequest controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getFriendRequest(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      recipient: req.user._id,
      status: "pending",
    }).populate("sender", "fullName profilePic nationality status lastActive");

    const acceptedRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({
      incomingRequests,
      acceptedRequests,
    });
  } catch (error) {
    console.error("Error in getFriendRequest controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOutgoingFriendRequest(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic nationality status lastActive"
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error("Error in getOutgoingFriendRequest controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to reject this request" });
    }
    await friendRequest.deleteOne();
    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function cancelFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this request" });
    }
    await friendRequest.deleteOne();
    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeFriend(req, res) {
  try {
    const { id: friendId } = req.params;
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    // Emit socket event cho cả 2 phía
    const io = req.app.locals.io;
    if (io) {
      io.to(userId.toString()).emit("friend_removed", {
        userId1: userId.toString(),
        userId2: friendId.toString(),
      });
      io.to(friendId.toString()).emit("friend_removed", {
        userId1: userId.toString(),
        userId2: friendId.toString(),
      });
    }

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Missing search query" });
    const users = await User.find({
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { account: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    }).select("fullName profilePic email nationality status lastActive");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// Tìm kiếm user và group (all-in-one)
export async function searchAll(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Missing search query" });

    // Tìm user
    const users = await User.find({
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { account: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: req.user._id },
    }).select("fullName profilePic email nationality status lastActive");

    // Tìm group (chỉ group public hoặc group user chưa là thành viên)
    const groups = await Group.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
      isDirect: false,
    }).select("name avatar description members type");

    res.json({ users, groups });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// Chặn người dùng
export const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetId } = req.body;
    if (userId.toString() === targetId) {
      return res.status(400).json({ message: "Không thể tự chặn chính mình" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    if (!user.blockedUsers) user.blockedUsers = [];
    if (!user.blockedUsers.map((id) => String(id)).includes(String(targetId))) {
      user.blockedUsers.push(targetId);
      await user.save();
    }
    res.json({ success: true, blockedUsers: user.blockedUsers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi chặn người dùng", error: err.message });
  }
};

// Bỏ chặn người dùng
export const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    user.blockedUsers = (user.blockedUsers || []).filter(
      (id) => String(id) !== String(targetId)
    );
    await user.save();
    res.json({ success: true, blockedUsers: user.blockedUsers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi bỏ chặn người dùng", error: err.message });
  }
};

// Lấy thông tin user hiện tại (bao gồm trạng thái 2FA session)
export const getMe = async (req, res) => {
  try {
    // Lấy user, populate friends và groups chỉ lấy _id
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("friends", "_id")
      .populate("groups", "_id");
    if (!user) return res.status(404).json({ message: "User not found" });
    // Trả về friends và groups là mảng id, bổ sung streamToken
    res.json({
      ...user.toObject(),
      friends: user.friends?.map((f) => f._id) || [],
      groups: user.groups?.map((g) => g._id) || [],
      isTwoFAVerified: req.session?.isTwoFAVerified || false,
      streamToken: generateStreamToken(user._id.toString()),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Bật 2FA cho user hiện tại
export const enableTwoFA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA đã được bật trước đó" });
    }
    user.twoFactorEnabled = true;
    await user.save();
    // TODO: Gửi email xác nhận/bảo mật nếu cần
    res.json({ message: "Đã bật xác thực 2 lớp" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Tắt 2FA cho user hiện tại
export const disableTwoFA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA chưa được bật" });
    }
    user.twoFactorEnabled = false;
    await user.save();
    res.json({ message: "Đã tắt xác thực 2 lớp" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cập nhật thông tin cá nhân
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      avatar,
      fullName,
      bio,
      nationality,
      dateOfBirth,
      gender,
      location,
    } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (avatar !== undefined) update.avatar = avatar;
    if (fullName !== undefined) update.fullName = fullName;
    if (bio !== undefined) update.bio = bio;
    if (nationality !== undefined) update.nationality = nationality;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth;
    if (gender !== undefined) update.gender = gender;
    if (location !== undefined) update.location = location;
    // Có thể cập nhật thêm các trường khác nếu cần
    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Cập nhật thành công", user });
  } catch (err) {
    res.status(500).json({ message: "Cập nhật thất bại", error: err.message });
  }
};

// Lấy danh sách người dùng bị block
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "_id fullName profilePic email"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ users: user.blockedUsers || [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách người bị chặn", error: err.message });
  }
};
