import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    avatar: { type: String, default: "" },
    type: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
        nickname: { type: String, default: "" }, // biệt danh từng thành viên
      },
    ],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    mutedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Thành viên bị admin mute (không gửi được tin nhắn)
    isDirect: { type: Boolean, default: false }, // true: chat 1-1, false: group chat
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    settings: {
      type: Object,
      default: { onlyAdminCanSend: false }, // Thêm cài đặt chỉ admin được nhắn tin
    }, // cài đặt nhóm (ai được mời, ai gửi tin nhắn...
    blockedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách user bị group chặn (admin/owner quản lý)
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
