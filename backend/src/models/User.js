import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // Đăng nhập bằng tài khoản truyền thống
    account: { type: String, unique: true, sparse: true, trim: true }, // Tài khoản đăng nhập (tùy chọn nếu dùng Google)
    password: { type: String, minlength: 8 }, // Mật khẩu (chỉ cần khi đăng ký truyền thống)

    // Đăng nhập bằng Google
    googleId: { type: String, unique: true, sparse: true }, // ID người dùng từ Google OAuth

    // Email xác thực và dùng để login qua Google
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    isVerified: { type: Boolean, default: false }, // Trạng thái xác minh email
    verifyCode: String, // Mã xác thực email
    verifyCodeExpiry: Date, // Thời gian hết hạn mã xác thực

    // Quên mật khẩu bằng OTP
    resetPasswordCode: String,
    resetPasswordCodeExpiry: Date,
    canResetPassword: { type: Boolean, default: false },

    // Hồ sơ cá nhân
    fullName: { type: String, default: "" }, // Họ và tên
    bio: { type: String, default: "" }, // Mô tả bản thân
    profilePic: { type: String, default: "" }, // Ảnh đại diện (URL)
    nationality: { type: String, default: "" }, // Quốc tịch

    location: {
      address: { type: String, default: "" }, // Số nhà và tên đường
      district: { type: String, default: "" }, // Quận/huyện
      city_or_province: { type: String, default: "" }, // Tỉnh/thành phố
      country: { type: String, default: "" }, // Quốc gia
    },

    dateOfBirth: { type: Date }, // Ngày sinh
    gender: {
      type: String,
      enum: ["male", "female", "other", ""], // Giới tính
      default: "",
    },

    isOnboarded: { type: Boolean, default: false }, // Đã hoàn tất nhập thông tin cá nhân chưa

    lastActive: { type: Date, default: Date.now }, // Thời gian hoạt động gần nhất
    status: {
      type: String,
      enum: ["online", "offline", "away", "busy"], // Trạng thái online hiện tại
      default: "offline",
    },

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách bạn bè
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }], // Danh sách nhóm
    mutedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }], // Danh sách group (bao gồm cả 1-1) user đã tắt thông báo
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách user bị chặn (block)
    blockedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }], // Danh sách group mà user đã chặn (không muốn tham gia/nhận tin nhắn từ group đó)

    twoFactorEnabled: { type: Boolean, default: false }, // Đã bật 2FA chưa
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// So sánh mật khẩu khi đăng nhập
userSchema.methods.matchPassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

const User = mongoose.model("User", userSchema);
export default User;
