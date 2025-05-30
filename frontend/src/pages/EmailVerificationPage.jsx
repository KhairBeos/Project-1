import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { resendVerificationEmail, verifyEmail, logout } from "../lib/api.js";
import useAuthUser from "../hooks/useAuthUser.js";
import { useQueryClient } from "@tanstack/react-query";

const EmailVerificationPage = () => {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(300); // Thời gian hiệu lực mã xác thực (5 phút = 300 giây)
  const [backLoading, setBackLoading] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Đếm ngược thời gian hiệu lực mã xác thực
  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setTimeout(() => setOtpExpiry(otpExpiry - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiry]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit !== "") && !loading) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();

      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  // Khi gửi lại mã thì reset thời gian hiệu lực
  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await resendVerificationEmail();
      setCountdown(60);
      setOtpExpiry(300); // Reset lại thời gian hiệu lực mã xác thực
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      const successMsg = document.createElement("div");
      successMsg.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      successMsg.textContent = "Đã gửi lại mã xác thực!";
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
    } catch (err) {
      const errorMsg = document.createElement("div");
      errorMsg.className =
        "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      errorMsg.textContent = "Gửi lại mã thất bại!";
      document.body.appendChild(errorMsg);
      setTimeout(() => document.body.removeChild(errorMsg), 3000);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (codeString = null) => {
    const verificationCode = codeString || code.join("");
    if (verificationCode.length !== 6) {
      const errorMsg = document.createElement("div");
      errorMsg.className =
        "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      errorMsg.textContent = "Vui lòng nhập đầy đủ 6 số!";
      document.body.appendChild(errorMsg);
      setTimeout(() => document.body.removeChild(errorMsg), 3000);
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(verificationCode);
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.refetchQueries({ queryKey: ["authUser"] });
      setSuccess(true);
      setTimeout(() => {
        navigate("/onboarding", { replace: true });
      }, 1500);
    } catch (err) {
      const errorMsg = document.createElement("div");
      errorMsg.className =
        "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      errorMsg.textContent =
        err?.response?.data?.message || "Mã xác thực không đúng!";
      document.body.appendChild(errorMsg);
      setTimeout(() => document.body.removeChild(errorMsg), 3000);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    handleVerify();
  };

  const handleBack = async () => {
    setBackLoading(true);
    try {
      await logout();
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login", { replace: true });
    } finally {
      setBackLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex">
        {/* Floating background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full flex items-center justify-center px-4 py-6 relative z-10">
          <div className="w-full max-w-md text-center">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Xác thực thành công!
              </h2>

              <p className="text-gray-600 leading-relaxed mb-6">
                Email của bạn đã được xác thực thành công.
                <br />
                Bạn sẽ được chuyển hướng ngay lập tức...
              </p>

              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full flex items-center justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={handleBack}
            disabled={backLoading}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors duration-200 disabled:opacity-50"
          >
            {backLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span className="text-sm">
              {backLoading ? "Đang thoát..." : "Quay lại"}
            </span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Xác thực email
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi đã gửi mã xác thực 6 số đến
              <br />
              <span className="font-semibold text-purple-600">
                {authUser?.email}
              </span>
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 text-center block">
                  Nhập mã xác thực
                </label>

                <div className="flex gap-3 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      disabled={loading}
                      className={`
                        w-12 h-12 text-center text-xl font-bold border-2 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                        transition-all duration-300
                        ${
                          loading
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white/50"
                        }
                        ${
                          digit
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200"
                        }
                      `}
                      autoFocus={index === 0}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleManualSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xác thực...
                  </div>
                ) : (
                  "Xác nhận mã"
                )}
              </button>

              {/* Resend Button */}
              <button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className={`
                  w-full py-3 px-4 rounded-xl font-semibold border-2 transition-all duration-300
                  ${
                    resending || countdown > 0
                      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                      : "bg-white/50 text-purple-600 border-purple-600 hover:bg-purple-50 transform hover:scale-[1.02]"
                  }
                `}
              >
                {resending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    Đang gửi lại...
                  </div>
                ) : countdown > 0 ? (
                  `Gửi lại sau ${countdown}s`
                ) : (
                  "Gửi lại mã xác thực"
                )}
              </button>

              {/* Help Text */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 leading-relaxed">
                  <span className="whitespace-nowrap">Không nhận được mã?</span>
                </p>
                <p className="text-sm text-gray-500 leading-relaxed whitespace-nowrap">
                  Hãy kiểm tra mục <strong>Spam</strong> hoặc bấm "Gửi lại mã
                  xác thực" ở trên.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Mã xác thực sẽ hết hạn sau:{" "}
                  <span className="font-semibold text-purple-600">
                    {Math.floor(otpExpiry / 60)}:
                    {(otpExpiry % 60).toString().padStart(2, "0")}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
