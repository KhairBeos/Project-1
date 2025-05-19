import speakeasy from "speakeasy";
import qrcode from "qrcode";
import User from "../models/User.js";

// Bật 2FA: sinh secret và trả QR code
export const enable2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const secret = speakeasy.generateSecret({
      name: `ChatApp (${req.user.email})`,
    });
    await User.findByIdAndUpdate(userId, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false, // Chỉ bật sau khi xác thực OTP thành công
    });
    const otpauthUrl = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauthUrl);
    res.json({ otpauthUrl, qr });
  } catch (err) {
    res.status(500).json({ message: "Lỗi bật 2FA", error: err.message });
  }
};

// Xác thực OTP và bật 2FA
export const verify2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret)
      return res.status(400).json({ message: "Chưa thiết lập 2FA" });
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });
    if (!verified) return res.status(400).json({ message: "OTP không hợp lệ" });
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ success: true, message: "Đã bật xác thực 2 lớp" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xác thực 2FA", error: err.message });
  }
};

// Xác thực OTP khi đăng nhập
export const verify2FALogin = async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: "User chưa bật 2FA" });
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });
    if (!verified) return res.status(400).json({ message: "OTP không hợp lệ" });
    res.json({ success: true, message: "Xác thực 2FA thành công" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi xác thực 2FA khi login", error: err.message });
  }
};
