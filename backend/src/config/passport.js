import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email }); // Tìm người dùng qua email

        if (!user) {
          // Tạo tài khoản mới nếu không tìm thấy user
          user = await User.create({
            account: email,
            fullName: profile.displayName,
            email, // Lưu email để dễ dàng xác thực sau này
            isVerified: true, // Thiết lập mặc định là đã xác minh
            profilePic: profile.photos?.[0]?.value || "default-avatar.png", // Dùng ảnh mặc định nếu không có
          });
        }

        done(null, user); // Trả về user nếu đã tìm thấy hoặc tạo mới
      } catch (err) {
        done(err, null); // Xử lý lỗi nếu có
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id)); // Lưu ID người dùng vào session
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id).select("-password"); // Lấy user và loại bỏ mật khẩu
  done(null, user); // Trả về thông tin user
});
