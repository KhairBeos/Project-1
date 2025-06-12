import Notification from "../models/Notification.js";

// Lấy danh sách thông báo của user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy thông báo", error: err.message });
  }
};

// Đánh dấu đã đọc 1 thông báo
export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif)
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật thông báo", error: err.message });
  }
};

// Đánh dấu tất cả đã đọc
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi cập nhật thông báo", error: err.message });
  }
};

// Xóa 1 thông báo
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.deleteOne({ _id: id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa thông báo", error: err.message });
  }
};

// Xóa tất cả thông báo
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa thông báo", error: err.message });
  }
};
