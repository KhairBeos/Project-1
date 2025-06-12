import { upsertStreamUser, generateStreamToken } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import validator from "validator";
import { sendVerificationEmail } from "../services/emailService.js";

// ==== Đăng ký tài khoản ====
export async function signup(req, res) {
  const { account, password, fullName, email } = req.body;

  try {
    // Kiểm tra đầu vào
    if (!account || !password || !fullName || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Kiểm tra định dạng email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Kiểm tra account đã tồn tại
    const existingUser = await User.findOne({ account });
    if (existingUser) {
      return res.status(400).json({
        message: "Account already exists, please use a different one",
      });
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists, please use a different one",
      });
    }

    // Tạo avatar ngẫu nhiên
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    // Tạo người dùng mới
    const newUser = new User({
      account,
      password,
      fullName,
      email,
      profilePic: randomAvatar,
    });

    // Bắt lỗi duplicate khi nhiều người đăng ký cùng lúc
    try {
      await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message:
            "Account or Email already exists, please use a different one",
        });
      }
      throw error;
    }

    // Đăng ký user trên Stream Chat
    try {
      await upsertStreamUser({
        id: newUser._id.toString(), // Dùng _id làm id trên Stream
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName} successfully`);
    } catch (error) {
      console.error(
        `Error creating Stream user for userId=${newUser._id}, name=${newUser.fullName}:`,
        error
      );
    }

    // ==== GỬI MÃ XÁC THỰC EMAIL NGAY SAU ĐĂNG KÝ === =
    const code = Math.floor(100000 + Math.random() * 900000);
    newUser.verifyCode = code;
    newUser.verifyCodeExpiry = Date.now() + 5 * 60 * 1000; // 5 phút
    await newUser.save();
    await sendVerificationEmail(newUser.email, code);

    // Tạo token JWT
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Tạo stream token để client kết nối vào chat
    const streamToken = generateStreamToken(newUser._id.toString());

    // Lưu token vào cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      httpOnly: true, // Chỉ cho phép truy cập cookie từ server
      secure: process.env.NODE_ENV === "production", // Chỉ gửi cookie qua HTTPS
      sameSite: "strict", // Ngăn chặn CSRF
    });

    // Ẩn mật khẩu khi trả về
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;
    userWithoutPassword.isEmailVerified = userWithoutPassword.isVerified;
    // Trả về user + streamToken
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      streamToken,
    });

    console.log("User created successfully:", newUser);
  } catch (error) {
    console.error("Error in signup controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Đăng nhập ====
export async function login(req, res) {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ account });
    if (!user) {
      return res.status(401).json({ message: "Invalid account or password" });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid account or password" });
    }

    // Nếu user đã bật 2FA thì trả về require2FA, không trả token đăng nhập
    if (user.twoFactorEnabled) {
      return res.status(200).json({ require2FA: true });
    }

    // Đăng ký user trên Stream Chat nếu chưa có (phòng trường hợp user cũ)
    try {
      await upsertStreamUser({
        id: user._id.toString(),
        name: user.fullName,
        image: user.profilePic || "",
      });
    } catch (error) {
      console.error(
        `Error upserting Stream user for userId=${user._id}, name=${user.fullName}:`,
        error
      );
    }

    // Tạo JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    // Tạo Stream token
    const streamToken = generateStreamToken(user._id.toString());

    // Lưu token vào cookie
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Ẩn mật khẩu khi trả về
    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;
    userWithoutPassword.isEmailVerified = userWithoutPassword.isVerified;
    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      streamToken,
    });
  } catch (error) {
    console.error("Error in login controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Đăng xuất ====
export async function logout(req, res) {
  try {
    // Xóa cookie chứa JWT token khi người dùng đăng xuất
    res.clearCookie("jwt", {
      httpOnly: true, // Chỉ có thể truy cập cookie từ server
      secure: process.env.NODE_ENV === "production", // Chỉ gửi cookie qua HTTPS khi production
      sameSite: "strict", // Ngăn chặn CSRF
    });

    // Trả về phản hồi thành công khi người dùng đã đăng xuất
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    // Nếu có lỗi xảy ra, log lỗi và trả về thông báo lỗi server
    console.error("Error in logout controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Hoàn thành thông tin người dùng ====
export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nationality, location, dateOfBirth, gender } =
      req.body;

    const requiredFields = {
      fullName,
      bio,
      nationality,
      "location.address": location?.address,
      "location.district": location?.district,
      "location.city_or_province": location?.city_or_province,
      "location.country": location?.country,
      dateOfBirth,
      gender,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Kiểm tra định dạng ngày sinh
    if (dateOfBirth && !validator.isDate(dateOfBirth)) {
      return res.status(400).json({ message: "Invalid date of birth" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nationality,
        location,
        dateOfBirth,
        gender,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userWithoutPassword = { ...updatedUser.toObject() };
    delete userWithoutPassword.password;
    userWithoutPassword.isEmailVerified = userWithoutPassword.isVerified;
    res.status(200).json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Xác thực tài khoản Email ====

// ==== Gửi mã xác minh ====
export async function sendEmailVerification(req, res) {
  const { email } = req.body;

  try {
    // Tìm người dùng trong hệ thống
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tạo mã xác minh
    const code = Math.floor(100000 + Math.random() * 900000); // 6 chữ số
    user.email = email;
    user.verifyCode = code;
    user.verifyCodeExpiry = Date.now() + 5 * 60 * 1000; // Mã hết hạn sau 5 phút
    await user.save();

    // Gửi mã xác minh qua email
    await sendVerificationEmail(email, code);
    res.status(200).json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Xác minh mã ====
export async function verifyEmail(req, res) {
  const { code } = req.body;

  try {
    const user = await User.findById(req.user._id);

    // Kiểm tra mã xác minh
    if (
      !user ||
      user.verifyCode !== code ||
      Date.now() > user.verifyCodeExpiry
    ) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Xác minh thành công
    user.isVerified = true;
    user.verifyCode = null;
    user.verifyCodeExpiry = null;
    await user.save();

    res.status(200).json({ message: "Email verified" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Gửi lại mã xác minh ====
export const resendVerificationEmail = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Giới hạn gửi lại mã: 60s/lần
    if (user.verifyCodeExpiry && user.verifyCode) {
      const now = Date.now();
      const lastSent = user.verifyCodeExpiry - 5 * 60 * 1000;
      if (now - lastSent < 60 * 1000) {
        return res.status(429).json({
          message:
            "Bạn vừa yêu cầu mã, vui lòng đợi 60 giây trước khi gửi lại.",
        });
      }
    }
    // Kiểm tra nếu mã xác minh đã hết hạn hoặc chưa có mã
    if (!user.verifyCode || Date.now() > user.verifyCodeExpiry) {
      const code = Math.floor(100000 + Math.random() * 900000); // 6 chữ số mới
      user.verifyCode = code;
      user.verifyCodeExpiry = Date.now() + 5 * 60 * 1000; // Gia hạn thêm 5 phút
      await user.save();
      // Gửi lại mã xác minh qua email
      await sendVerificationEmail(user.email, user.verifyCode);
      return res.status(200).json({ message: "New verification code sent" });
    }
    // Nếu mã vẫn còn hiệu lực, chỉ gửi lại email
    await sendVerificationEmail(user.email, user.verifyCode);
    return res
      .status(200)
      .json({ message: "Verification code is still valid" });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ==== Đổi mật khẩu === =
export async function changePassword(req, res) {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Cập nhật thông tin cá nhân === =
export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const {
      fullName,
      bio,
      profilePic,
      nationality,
      location,
      dateOfBirth,
      gender,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, bio, profilePic, nationality, location, dateOfBirth, gender },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const userWithoutPassword = { ...updatedUser.toObject() };
    delete userWithoutPassword.password;
    userWithoutPassword.isEmailVerified = userWithoutPassword.isVerified;
    res.status(200).json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Quên mật khẩu: Gửi mã xác nhận về email === =
export async function sendForgotPasswordCode(req, res) {
  try {
    const { account } = req.body;
    if (!account)
      return res.status(400).json({ message: "Tài khoản là bắt buộc" });
    const user = await User.findOne({ account });
    if (!user)
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    const email = user.email;
    if (!email)
      return res.status(400).json({ message: "Tài khoản này chưa có email" });
    // Giới hạn gửi lại mã: 60s/lần
    if (user.resetPasswordCodeExpiry && user.resetPasswordCode) {
      const now = Date.now();
      const lastSent = user.resetPasswordCodeExpiry - 10 * 60 * 1000;
      if (now - lastSent < 60 * 1000) {
        return res.status(429).json({
          message:
            "Bạn vừa yêu cầu mã, vui lòng đợi 60 giây trước khi gửi lại.",
        });
      }
    }
    // Sinh mã 6 số
    const code = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordCode = code;
    user.resetPasswordCodeExpiry = Date.now() + 10 * 60 * 1000; // 10 phút
    await user.save();
    await sendVerificationEmail(email, code); // Tái sử dụng hàm gửi mã
    res.status(200).json({
      message: "Đã gửi mã xác nhận về email đã đăng ký của tài khoản",
      email, // trả về email thực tế để frontend dùng cho các bước tiếp theo
    });
  } catch (error) {
    console.error("Error sendForgotPasswordCode:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Xác nhận mã quên mật khẩu === =
export async function verifyForgotPasswordCode(req, res) {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (
      !user ||
      user.resetPasswordCode != code ||
      Date.now() > user.resetPasswordCodeExpiry
    ) {
      return res
        .status(400)
        .json({ message: "Mã xác nhận không đúng hoặc đã hết hạn" });
    }
    // Đánh dấu đã xác nhận, cho phép đặt lại mật khẩu
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpiry = null;
    user.canResetPassword = true;
    await user.save();
    res.status(200).json({ message: "Xác nhận thành công" });
  } catch (error) {
    console.error("Error verifyForgotPasswordCode:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ==== Đặt lại mật khẩu mới sau khi xác nhận === =
export async function resetPasswordWithCode(req, res) {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.canResetPassword) {
      return res
        .status(400)
        .json({ message: "Bạn chưa xác nhận mã hoặc mã đã hết hạn" });
    }
    user.password = newPassword;
    user.canResetPassword = false;
    await user.save();
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Error resetPasswordWithCode:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
