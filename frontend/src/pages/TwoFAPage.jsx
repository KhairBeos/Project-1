import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { verify2FALogin } from "../lib/api";
import { Shield, Loader2, AlertCircle } from "lucide-react";

// Trang xác thực 2 lớp kiểu chọn số (Number Matching)
const TwoFAPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState([]); // 3 số hiển thị
  const [correctNumber, setCorrectNumber] = useState(null); // số đúng
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const account = location.state?.account || "";

  // Giả lập lấy 3 số từ backend (bạn nên thay bằng API thực tế)
  useEffect(() => {
    // Sinh số đúng và 2 số nhiễu
    const correct = Math.floor(Math.random() * 10);
    let nums = [correct];
    while (nums.length < 3) {
      const n = Math.floor(Math.random() * 10);
      if (!nums.includes(n)) nums.push(n);
    }
    nums = nums.sort(() => Math.random() - 0.5); // shuffle
    setNumbers(nums);
    setCorrectNumber(correct);
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: verify2FALogin,
    onSuccess: () => {
      setSuccess(true);
      setError("");
      setTimeout(() => navigate("/chat"), 1000);
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message ||
          "Xác thực không thành công. Vui lòng thử lại."
      );
    },
  });

  const handleSelect = (num) => {
    setError("");
    mutate({ account, token: num }); // token là số đã chọn
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Xác thực đăng nhập
          </h1>
          <p className="text-gray-600">
            Chọn đúng số hiển thị trên thiết bị xác thực của bạn.
          </p>
        </div>
        {success ? (
          <div className="text-center text-green-600 font-medium">
            Xác thực thành công! Đang chuyển...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center gap-6 mb-4">
              {numbers.map((num) => (
                <button
                  key={num}
                  onClick={() => handleSelect(num)}
                  disabled={isPending}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-3xl font-bold text-purple-700 shadow-lg border-2 border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                  aria-label={`Chọn số ${num}`}
                >
                  {num}
                </button>
              ))}
            </div>
            {error && (
              <div className="text-sm text-red-600 flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {isPending && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            )}
            <div className="text-center pt-4 border-t border-gray-100">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-purple-600 hover:underline"
                onClick={() => navigate("/login")}
                disabled={isPending}
              >
                Quay lại đăng nhập
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFAPage;
