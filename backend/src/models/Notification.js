import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người nhận
    type: {
      type: String,
      enum: ["friend_request", "group_invite", "message", "system"],
      required: true,
    },
    content: { type: String, required: true },
    link: { type: String }, // Đường dẫn điều hướng (nếu có)
    read: { type: Boolean, default: false },
    meta: { type: Object }, // Thông tin bổ sung (nếu cần)
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
