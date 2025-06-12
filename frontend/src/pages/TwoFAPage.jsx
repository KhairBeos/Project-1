import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useToast } from "../components/Toast.jsx";
import useAuthUser from "../hooks/useAuthUser.js";
import api from "../lib/api.js";

// Enhanced 2FA Page with improved UX and security features
const TwoFAPage = () => {
  const {
    authUser,
    isLoading: authLoading,
    error: authError,
    refetch,
  } = useAuthUser();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [numbers, setNumbers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isExpired, setIsExpired] = useState(false);
  const account = authUser?.email || authUser?.account || "";

  // Lấy 3 số từ backend (không tự sinh ở frontend)
  const fetchNumbers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/twofa/number-matching/generate", {
        account,
      });
      if (res.data && Array.isArray(res.data.options)) {
        setNumbers(res.data.options);
        setTimeLeft(30);
        setIsExpired(false);
      } else {
        setError("Không lấy được mã xác thực. Vui lòng thử lại.");
        addToast({
          message: "Không lấy được mã xác thực. Vui lòng thử lại.",
          type: "error",
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không lấy được mã xác thực. Vui lòng thử lại.";
      setError(msg);
      addToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Gọi khi mount và khi refresh
  useEffect(() => {
    fetchNumbers();
    // eslint-disable-next-line
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !success && !isExpired) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsExpired(true);
      setError("Mã xác thực đã hết hạn. Vui lòng tạo mã mới.");
    }
  }, [timeLeft, success, isExpired]);

  // Gửi số đã chọn lên backend để xác thực
  const verify2FA = async (selectedNumber) => {
    try {
      const res = await api.post("/twofa/number-matching/verify", {
        account,
        token: selectedNumber,
      });
      if (res.data.success) return true;
      throw new Error(res.data.message || "Xác thực không thành công");
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          "Xác thực không thành công"
      );
    }
  };

  const handleSelect = async (num) => {
    if (isExpired || loading) return;

    setError("");
    setLoading(true);

    try {
      await verify2FA(num);
      setSuccess(true);
      addToast({ message: "Xác thực thành công!", type: "success" });
      // Refetch user info để cập nhật trạng thái isTwoFAVerified
      refetch && refetch();
      setTimeout(() => {
        navigate("/chat");
      }, 1200);
    } catch (err) {
      setAttempts((prev) => prev + 1);
      setError(err.message || "Xác thực không thành công");
      addToast({
        message: err.message || "Xác thực không thành công",
        type: "error",
      });

      // Lock after 3 failed attempts
      if (attempts >= 2) {
        setError("Quá nhiều lần thử sai. Tài khoản tạm thời bị khóa.");
        addToast({
          message: "Quá nhiều lần thử sai. Tài khoản tạm thời bị khóa.",
          type: "error",
        });
        setIsExpired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNumbers();
    setError("");
    setAttempts(0);
  };

  const handleBack = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Xác thực đăng nhập
          </h1>
          <p className="text-gray-600 text-sm">
            Chọn số nhận được qua email xác thực của bạn
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Tài khoản:{" "}
            {account ? account.replace(/(.{2}).+(@.*)/, "$1***$2") : "Ẩn"}
          </div>
        </div>

        {/* Timer */}
        {!success && !isExpired && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              Hết hạn sau: {timeLeft}s
            </div>
          </div>
        )}

        {/* Success State */}
        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-green-600 font-medium">
              Xác thực thành công!
            </div>
            <div className="text-sm text-gray-600">Đang chuyển hướng...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Number Selection */}
            <div className="flex justify-center gap-4 mb-6">
              {numbers.map((num) => (
                <button
                  key={num}
                  onClick={() => handleSelect(num)}
                  disabled={loading || isExpired}
                  className={`
                    w-32 h-20 rounded-2xl text-2xl font-bold shadow-lg border-2 
                    transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-200
                    ${
                      loading || isExpired
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "bg-gradient-to-br from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-700 border-white/40 hover:shadow-xl active:scale-95"
                    }
                  `}
                  aria-label={`Chọn số ${num}`}
                >
                  {num.toString().padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {attempts > 0 && attempts < 3 && (
                  <div className="text-xs text-red-500 mt-1">
                    Còn lại {3 - attempts} lần thử
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Đang xác thực...</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tạo mã mới
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
              <p>
                Không nhận được mã? Kiểm tra email xác thực hoặc thư mục spam
                của bạn.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFAPage;
