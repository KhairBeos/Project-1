import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware bảo vệ route (API cần xác thực người dùng)
export const protectRoute = async (req, res, next) => {
  try {
    // Lấy token từ cookies
    const token = req.cookies?.jwt; // Kiểm tra nếu có token trong cookies không

    // Nếu không có token, trả về lỗi 401 (Unauthorized)
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    // Kiểm tra và giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // jwt.verify dùng để kiểm tra tính hợp lệ của token và giải mã nó.

    // Nếu cấu trúc token không hợp lệ, trả về lỗi 401
    if (!decoded?.userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid token structure" });
    }

    // Tìm người dùng trong cơ sở dữ liệu với userId từ token
    const user = await User.findById(decoded.userId).select("-password");
    // .select("-password") để không trả về mật khẩu trong dữ liệu người dùng.

    // Nếu không tìm thấy người dùng trong cơ sở dữ liệu, trả về lỗi 401
    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Nếu tìm thấy người dùng hợp lệ, gán thông tin người dùng vào req.user
    req.user = user;

    // Chuyển sang middleware tiếp theo hoặc controller xử lý request
    next();
  } catch (error) {
    // Nếu có lỗi xảy ra trong quá trình kiểm tra token
    console.error("Error in protectRoute middleware:", error);

    // Kiểm tra nếu lỗi là do token hết hạn
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    // Kiểm tra nếu lỗi là do token không hợp lệ
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Nếu lỗi không xác định, trả về lỗi server
    return res.status(500).json({ message: "Internal server error" });
  }
};
