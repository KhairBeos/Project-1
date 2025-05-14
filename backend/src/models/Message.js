import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
