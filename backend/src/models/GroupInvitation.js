import mongoose from "mongoose";

const groupInvitationSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người được mời
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Người gửi lời mời
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

groupInvitationSchema.index({ group: 1, user: 1 }, { unique: true });

const GroupInvitation = mongoose.model(
  "GroupInvitation",
  groupInvitationSchema
);
export default GroupInvitation;
