import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

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
