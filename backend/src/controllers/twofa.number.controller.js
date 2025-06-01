import User from "../models/User.js";

// Số ngẫu nhiên cho number-matching 2FA (demo, production nên lưu DB/cache)
const numberMatchingStore = new Map(); // key: userId, value: { correct, options, expires }

// API: Sinh 3 số cho number-matching 2FA
export const generate2FANumber = async (req, res) => {
  try {
    const { account } = req.body;
    if (!account) return res.status(400).json({ message: "Thiếu account" });
    const user = await User.findOne({ account });
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "User chưa bật 2FA" });
    }
    // Sinh số đúng và 2 số nhiễu
    const correct = Math.floor(Math.random() * 10);
    let nums = [correct];
    while (nums.length < 3) {
      const n = Math.floor(Math.random() * 10);
      if (!nums.includes(n)) nums.push(n);
    }
    nums = nums.sort(() => Math.random() - 0.5); // shuffle
    // Lưu vào store (demo: 2 phút)
    numberMatchingStore.set(user._id.toString(), {
      correct,
      options: nums,
      expires: Date.now() + 2 * 60 * 1000,
    });
    res.json({ options: nums });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi sinh số xác thực", error: err.message });
  }
};

// API: Xác thực số đã chọn
export const verify2FANumber = async (req, res) => {
  try {
    const { account, token } = req.body;
    if (!account || typeof token === "undefined")
      return res.status(400).json({ message: "Thiếu thông tin" });
    const user = await User.findOne({ account });
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ message: "User chưa bật 2FA" });
    }
    const store = numberMatchingStore.get(user._id.toString());
    if (!store || Date.now() > store.expires) {
      return res
        .status(400)
        .json({ message: "Phiên xác thực đã hết hạn. Vui lòng thử lại." });
    }
    if (Number(token) !== store.correct) {
      return res.status(400).json({ message: "Số xác thực không đúng" });
    }
    // Xác thực thành công, xóa khỏi store
    numberMatchingStore.delete(user._id.toString());
    res.json({ success: true, message: "Xác thực thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xác thực số", error: err.message });
  }
};
