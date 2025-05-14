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

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}



// ==== Xác thực tài khoản Email ====

// ==== Gửi mã xác minh ====
export const sendEmailVerification = async (req, res) => {
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
    user.verifyCodeExpiry = Date.now() + 10 * 60 * 1000; // Mã hết hạn sau 10 phút
    await user.save();

    // Gửi mã xác minh qua email
    await sendVerificationEmail(email, code);
    res.status(200).json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ==== Xác minh mã ====
export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findById(req.user._id);

    // Kiểm tra mã xác minh
    if (!user || user.verifyCode !== code || Date.now() > user.verifyCodeExpiry) {
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
};

// ==== Gửi lại mã xác minh ====
export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    // Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu mã xác minh đã hết hạn
    if (Date.now() > user.verifyCodeExpiry) {
      const code = Math.floor(100000 + Math.random() * 900000); // 6 chữ số mới
      user.verifyCode = code;
      user.verifyCodeExpiry = Date.now() + 10 * 60 * 1000; // Gia hạn thêm 10 phút
      await user.save();

      // Gửi lại mã xác minh qua email
      await sendVerificationEmail(email, code);
      return res.status(200).json({ message: "New verification code sent" });
    }

    return res.status(200).json({ message: "Verification code is still valid" });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
