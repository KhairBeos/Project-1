import { useState, useRef, useEffect } from "react";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";

const EmailVerificationPage = () => {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(300);
  const [backLoading, setBackLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeInputs, setShakeInputs] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const inputRefs = useRef([]);
  // Mock user email for demo
  const authUser = { email: "user@example.com" };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (otpExpiry > 0) {
      const timer = setTimeout(() => setOtpExpiry(otpExpiry - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiry]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError(""); // Clear error when user types

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

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `
      fixed top-6 right-6 px-6 py-4 rounded-2xl shadow-2xl z-50 transform transition-all duration-500
      ${
        type === "success"
          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
          : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
      }
      animate-[slideInRight_0.5s_ease-out] backdrop-blur-lg border border-white/20
    `;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        ${
          type === "success"
            ? '<div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></div>'
            : '<div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></div>'
        }
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(60);
      setOtpExpiry(300);
      setCode(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
      showToast("Đã gửi lại mã xác thực!");
    } catch (err) {
      showToast("Gửi lại mã thất bại!", "error");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (codeString = null) => {
    const verificationCode = codeString || code.join("");
    if (verificationCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số!");
      setShakeInputs(true);
      setTimeout(() => setShakeInputs(false), 600);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Mock API call - accept any 6-digit code for demo
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      setShowCelebration(true);
      showToast("Xác thực thành công!");

      // In real app, navigate to onboarding
      setTimeout(() => {
        alert("Chuyển hướng đến trang onboarding...");
      }, 2000);
    } catch (err) {
      const errorMessage = "Mã xác thực không đúng!";
      setError(errorMessage);
      setShakeInputs(true);
      setTimeout(() => setShakeInputs(false), 600);
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
      // Mock logout
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert("Đăng xuất và chuyển về trang login...");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Chuyển về trang login...");
    } finally {
      setBackLoading(false);
    }
  };

  const getExpiryColor = () => {
    if (otpExpiry > 180) return "text-green-600";
    if (otpExpiry > 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getExpiryProgress = () => {
    return (otpExpiry / 300) * 100;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>

          {/* Celebration particles */}
          {showCelebration && (
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-full flex items-center justify-center px-4 py-6 relative z-10">
          <div className="w-full max-w-md text-center">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30 transform animate-[fadeInUp_0.6s_ease-out]">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg animate-[bounceIn_0.8s_ease-out]">
                <CheckCircle className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"></div>
              </div>

              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
                Xác thực thành công!
              </h2>

              <p className="text-gray-600 leading-relaxed mb-8 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
                Email của bạn đã được xác thực thành công.
                <br />
                <span className="text-green-600 font-semibold">
                  Đang chuyển hướng...
                </span>
              </p>

              <div className="flex items-center justify-center animate-[fadeInUp_0.6s_ease-out_0.6s_both]">
                <div className="relative">
                  <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-8 h-8 border-3 border-green-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex">
      {/* Enhanced floating background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite]"></div>

        {/* Sparkle effects */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
        <div
          className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-3/4 w-3 h-3 bg-pink-300 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="w-full flex items-center justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-md animate-[fadeInUp_0.6s_ease-out]">
          {/* Enhanced Back Button */}
          <button
            onClick={handleBack}
            disabled={backLoading}
            className="mb-6 flex items-center gap-3 text-gray-600 hover:text-purple-600 transition-all duration-300 disabled:opacity-50 group hover:bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm"
          >
            {backLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            )}
            <span className="font-medium">
              {backLoading ? "Đang thoát..." : "Quay lại"}
            </span>
          </button>

          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-2xl mb-6 shadow-2xl animate-[bounceIn_0.8s_ease-out]">
              <Mail className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse"></div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-3 animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              Xác thực email
            </h1>

            <p className="text-gray-600 leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
              Chúng tôi đã gửi mã xác thực 6 số đến
              <br />
              <span className="font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg inline-block mt-1">
                {authUser?.email}
              </span>
            </p>
          </div>

          {/* Enhanced Form Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30 animate-[fadeInUp_0.6s_ease-out_0.6s_both]">
            <div className="space-y-6">
              {/* Enhanced OTP Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <label className="text-sm font-semibold text-gray-700">
                    Nhập mã xác thực
                  </label>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>

                <div
                  className={`flex gap-3 justify-center ${
                    shakeInputs ? "animate-[shake_0.6s_ease-in-out]" : ""
                  }`}
                  role="group"
                  aria-label="Nhập mã xác thực"
                >
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label={`Số thứ ${index + 1}`}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={loading}
                      className={`
                        w-14 h-14 text-center text-2xl font-bold border-2 rounded-2xl
                        focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500
                        transition-all duration-300 transform hover:scale-105
                        ${
                          loading
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white/70"
                        }
                        ${
                          digit
                            ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
                            : "border-gray-200"
                        }
                        ${error ? "border-red-400 bg-red-50" : ""}
                      `}
                      autoFocus={index === 0}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="text-center animate-[fadeInUp_0.3s_ease-out]"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                    {error}
                  </p>
                </div>
              )}

              {/* Enhanced Submit Button */}
              <button
                onClick={handleManualSubmit}
                disabled={loading || code.join("").length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:scale-100 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang xác thực...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Xác nhận mã</span>
                  </div>
                )}
              </button>

              {/* Enhanced Resend Button */}
              <button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className={`
                  w-full py-4 px-4 rounded-2xl font-semibold border-2 transition-all duration-300 relative overflow-hidden group
                  ${
                    resending || countdown > 0
                      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                      : "bg-white/70 text-purple-600 border-purple-600 hover:bg-purple-50 transform hover:scale-[1.02] hover:shadow-lg"
                  }
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/0 via-purple-50/50 to-purple-50/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {resending ? (
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang gửi lại...</span>
                  </div>
                ) : countdown > 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>Gửi lại sau {countdown}s</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    <span>Gửi lại mã xác thực</span>
                  </div>
                )}
              </button>

              {/* Enhanced Help Section */}
              <div className="text-center pt-6 border-t border-gray-100 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">
                    Không nhận được mã?
                  </p>
                  <p className="text-sm text-gray-500">
                    Hãy kiểm tra mục <strong>Spam/Junk</strong> hoặc bấm "Gửi
                    lại mã xác thực"
                  </p>
                </div>

                {/* Enhanced Expiry Timer */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">
                      Thời gian còn lại
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <span
                        className={`text-2xl font-bold ${getExpiryColor()} tabular-nums`}
                      >
                        {Math.floor(otpExpiry / 60)}:
                        {(otpExpiry % 60).toString().padStart(2, "0")}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          otpExpiry > 180
                            ? "bg-green-500"
                            : otpExpiry > 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${getExpiryProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-5px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(5px);
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationPage;
