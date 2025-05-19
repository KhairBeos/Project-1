import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "video", "audio", "sticker"],
      default: "text",
    },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachments: [
      {
        url: { type: String },
        name: { type: String },
        type: { type: String }, // e.g. image/png, application/pdf
      },
    ],
    // Messenger-like features
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String }, // e.g. "👍", "❤️"
      },
    ],
    isEdited: { type: Boolean, default: false },
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
    isDeleted: { type: Boolean, default: false }, // For recall/unsend
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    isPinned: { type: Boolean, default: false },
    isSystemMessage: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
