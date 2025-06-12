import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPasswordWithCode,
} from "../lib/api.js";
import {
  Mail,
  Shield,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  XCircle,
  ArrowLeft,
  User,
  MessageCircle,
  Zap,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import { useToast } from "../components/Toast.jsx";

const ForgotPasswordOTPFlowPage = () => {
  const [step, setStep] = useState(1); // 1: nhập tài khoản, 2: nhập mã, 3: đặt lại mật khẩu
  const [account, setAccount] = useState("");
  const [email, setEmail] = useState(""); // Lưu email thực tế từ backend
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Password strength validation
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  // Step 1: Gửi mã OTP
  const sendCodeMutation = useMutation({
    mutationFn: sendForgotPasswordCode,
    onSuccess: (data) => {
      // Nếu backend trả về email thực tế, lưu lại
      if (data?.email) setEmail(data.email);
      else setEmail(account); // fallback nếu backend chưa trả về
      setStep(2);
      setError("");
      setCountdown(60);
      addToast({ message: "Đã gửi mã xác nhận thành công!", type: "success" });
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Không thể gửi mã xác nhận");
      addToast({
        message: err?.response?.data?.message || "Không thể gửi mã xác nhận",
        type: "error",
      });
    },
  });

  // Step 2: Xác nhận mã OTP
  const verifyCodeMutation = useMutation({
    mutationFn: verifyForgotPasswordCode,
    onSuccess: () => {
      setStep(3);
      setError("");
      addToast({ message: "Xác nhận mã OTP thành công!", type: "success" });
    },
    onError: (err) => {
      setError(
        err?.response?.data?.message || "Mã xác nhận không đúng hoặc đã hết hạn"
      );
      addToast({
        message:
          err?.response?.data?.message ||
          "Mã xác nhận không đúng hoặc đã hết hạn",
        type: "error",
      });
    },
  });

  // Step 3: Đặt lại mật khẩu
  const resetMutation = useMutation({
    mutationFn: resetPasswordWithCode,
    onSuccess: () => {
      setSuccess(true);
      setError("");
      addToast({ message: "Đặt lại mật khẩu thành công!", type: "success" });
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Không thể đặt lại mật khẩu");
      addToast({
        message: err?.response?.data?.message || "Không thể đặt lại mật khẩu",
        type: "error",
      });
    },
  });

  // Handlers
  const handleSendCode = (e) => {
    e.preventDefault();
    setError("");
    if (!account.trim()) {
      setError("Vui lòng nhập tài khoản");
      return;
    }
    sendCodeMutation.mutate(account);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    verifyCodeMutation.mutate({ email: email || account, code: otp });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError("");
    if (!isPasswordValid) {
      setError("Vui lòng đáp ứng tất cả yêu cầu mật khẩu");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    resetMutation.mutate({ email: email || account, newPassword: password });
  };

  const handleResendCode = () => {
    if (countdown === 0) {
      sendCodeMutation.mutate(account);
    }
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    } else {
      navigate("/login");
    }
  };

  // Helper để ẩn đầu email
  const maskEmail = (emailOrAccount) => {
    if (!emailOrAccount) return "";
    const atIdx = emailOrAccount.indexOf("@");
    if (atIdx > 0) {
      // Là email
      const name = emailOrAccount.slice(0, atIdx);
      const domain = emailOrAccount.slice(atIdx);
      if (name.length <= 3) return "*****" + domain;
      return "*****" + name.slice(-5) + domain;
    }
    // Không phải email, fallback: ẩn hết trừ 3 ký tự cuối
    if (emailOrAccount.length <= 3) return "*****";
    return "*****" + emailOrAccount.slice(-3);
  };

  // Right side data
  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Bảo mật cao",
      desc: "Mã OTP được mã hóa và có thời hạn ngắn.",
      color: "from-green-400 to-emerald-500",
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Khôi phục nhanh",
      desc: "Nhận mã xác nhận qua email trong vài giây.",
      color: "from-blue-400 to-cyan-500",
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "An toàn tuyệt đối",
      desc: "Quy trình khôi phục tuân thủ tiêu chuẩn bảo mật.",
      color: "from-purple-400 to-indigo-500",
    },
  ];

  const [animationStep, setAnimationStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* LEFT SIDE - FORM */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-4 py-6 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              {step === 1 ? (
                <Mail className="w-8 h-8 text-white" />
              ) : step === 2 ? (
                <Shield className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {step === 1 && "Khôi phục tài khoản"}
              {step === 2 && "Xác nhận danh tính"}
              {step === 3 && "Tạo mật khẩu mới"}
            </h1>
            <p className="text-gray-600 text-lg">
              {step === 1 && "Nhập thông tin tài khoản để nhận mã xác nhận"}
              {step === 2 && `Nhập mã OTP đã gửi về: ${account}`}
              {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    i <= step
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {i}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded transition-all duration-300 ${
                      i < step
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={success ? "success" : step}
                timeout={300}
                classNames="fade-step"
                unmountOnExit
              >
                <div>
                  {success ? (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-green-600 mb-2">
                        Thành công!
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Mật khẩu đã được đặt lại thành công.
                        <br />
                        Đang chuyển về trang đăng nhập...
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full animate-pulse w-full"></div>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={
                        step === 1
                          ? handleSendCode
                          : step === 2
                          ? handleVerifyCode
                          : handleResetPassword
                      }
                      className="space-y-6"
                      noValidate
                    >
                      {step === 1 && (
                        <div className="space-y-2">
                          <label
                            htmlFor="forgot-account"
                            className="text-sm font-medium text-gray-700 flex items-center gap-2"
                          >
                            <User className="w-4 h-4" />
                            Tài khoản hoặc Email
                          </label>
                          <div
                            className={`relative transition-all duration-300 ${
                              focusedField === "account" ? "scale-[1.02]" : ""
                            }`}
                          >
                            <input
                              id="forgot-account"
                              type="text"
                              className="w-full px-4 py-3 bg-white/50 border-2 rounded-xl focus:outline-none border-gray-200 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                              placeholder="Nhập tên tài khoản hoặc email của bạn"
                              value={account}
                              onChange={(e) => setAccount(e.target.value)}
                              onFocus={() => setFocusedField("account")}
                              onBlur={() => setFocusedField("")}
                              required
                              autoComplete="username"
                              aria-label="Tài khoản"
                              disabled={sendCodeMutation.isPending}
                            />
                          </div>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-purple-700 mb-2">
                            Xác nhận danh tính
                          </h2>
                          <p className="text-gray-600 text-base">
                            Nhập mã OTP đã gửi về:{" "}
                            <span className="font-semibold text-purple-600">
                              {maskEmail(email || account)}
                            </span>
                          </p>
                        </div>
                      )}

                      {step === 2 && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label
                              htmlFor="otp"
                              className="text-sm font-medium text-gray-700 flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Mã xác nhận (6 chữ số)
                            </label>
                            <div
                              className={`relative transition-all duration-300 ${
                                focusedField === "otp" ? "scale-[1.02]" : ""
                              }`}
                            >
                              <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                className="w-full px-4 py-3 bg-white/50 border-2 rounded-xl focus:outline-none border-gray-200 focus:border-purple-500 transition-all duration-300 placeholder-gray-400 text-center tracking-widest text-xl font-semibold"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) =>
                                  setOtp(e.target.value.replace(/\D/g, ""))
                                }
                                onFocus={() => setFocusedField("otp")}
                                onBlur={() => setFocusedField("")}
                                required
                                autoComplete="one-time-code"
                                aria-label="Mã xác nhận"
                                disabled={verifyCodeMutation.isPending}
                              />
                            </div>
                          </div>

                          {/* Resend Code */}
                          <div className="text-center">
                            {countdown > 0 ? (
                              <div className="flex items-center justify-center gap-2 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">
                                  Gửi lại mã sau {countdown}s
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={sendCodeMutation.isPending}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendCodeMutation.isPending ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang gửi...
                                  </div>
                                ) : (
                                  "Gửi lại mã xác nhận"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {step === 3 && (
                        <div className="space-y-6">
                          {/* New Password */}
                          <div className="space-y-2">
                            <label
                              htmlFor="reset-password"
                              className="text-sm font-medium text-gray-700 flex items-center gap-2"
                            >
                              <Lock className="w-4 h-4" />
                              Mật khẩu mới
                            </label>
                            <div
                              className={`relative transition-all duration-300 ${
                                focusedField === "password"
                                  ? "scale-[1.02]"
                                  : ""
                              }`}
                            >
                              <input
                                id="reset-password"
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-3 pr-12 bg-white/50 border-2 rounded-xl focus:outline-none border-gray-200 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                                placeholder="Tạo mật khẩu mới"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField("")}
                                required
                                autoComplete="new-password"
                                aria-label="Mật khẩu mới"
                                disabled={resetMutation.isPending}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>

                            {/* Password Requirements */}
                            {password && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  Yêu cầu mật khẩu:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                                  {Object.entries({
                                    length: "Ít nhất 8 ký tự",
                                    uppercase: "Một ký tự viết hoa",
                                    lowercase: "Một ký tự viết thường",
                                    number: "Một số",
                                    symbol: "Một ký tự đặc biệt",
                                  }).map(([key, text]) => (
                                    <div
                                      key={key}
                                      className="flex items-center gap-1"
                                    >
                                      {passwordRequirements[key] ? (
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                      ) : (
                                        <XCircle className="w-3 h-3 text-red-400" />
                                      )}
                                      <span
                                        className={
                                          passwordRequirements[key]
                                            ? "text-green-600"
                                            : "text-red-500"
                                        }
                                      >
                                        {text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-2">
                            <label
                              htmlFor="reset-confirm"
                              className="text-sm font-medium text-gray-700 flex items-center gap-2"
                            >
                              <Lock className="w-4 h-4" />
                              Xác nhận mật khẩu
                            </label>
                            <div
                              className={`relative transition-all duration-300 ${
                                focusedField === "confirm" ? "scale-[1.02]" : ""
                              }`}
                            >
                              <input
                                id="reset-confirm"
                                type={showConfirm ? "text" : "password"}
                                className="w-full px-4 py-3 pr-12 bg-white/50 border-2 rounded-xl focus:outline-none border-gray-200 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                                placeholder="Xác nhận mật khẩu mới"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                onFocus={() => setFocusedField("confirm")}
                                onBlur={() => setFocusedField("")}
                                required
                                autoComplete="new-password"
                                aria-label="Xác nhận mật khẩu"
                                disabled={resetMutation.isPending}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                              >
                                {showConfirm ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            {confirm && password !== confirm && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Mật khẩu không khớp
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleGoBack}
                          disabled={
                            sendCodeMutation.isPending ||
                            verifyCodeMutation.isPending ||
                            resetMutation.isPending
                          }
                          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          {step === 1 ? "Đăng nhập" : "Quay lại"}
                        </button>

                        <button
                          type="submit"
                          disabled={
                            sendCodeMutation.isPending ||
                            verifyCodeMutation.isPending ||
                            resetMutation.isPending ||
                            (step === 3 &&
                              (!isPasswordValid || password !== confirm))
                          }
                          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {sendCodeMutation.isPending ||
                          verifyCodeMutation.isPending ||
                          resetMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : null}
                          {step === 1 && "Gửi mã xác nhận"}
                          {step === 2 && "Xác nhận mã"}
                          {step === 3 && "Đặt lại mật khẩu"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </CSSTransition>
            </SwitchTransition>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/15 rounded-full blur-lg animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 text-center text-white p-8 max-w-md">
          {/* Main Hero Section */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Khôi phục an toàn</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Quy trình khôi phục tài khoản được thiết kế với các lớp bảo mật
              cao nhất để đảm bảo an toàn cho bạn.
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-4 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-4 bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-500 hover:bg-white/20 hover:scale-105 ${
                  animationStep === index
                    ? "ring-2 ring-white/30 scale-105"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 bg-gradient-to-r ${feature.color} rounded-lg`}
                  >
                    {feature.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{feature.title}</div>
                    <div className="text-sm text-white/80">{feature.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Steps Guide */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Quy trình khôi phục
            </h3>
            <div className="space-y-2 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  1
                </div>
                <span>Nhập thông tin tài khoản</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  2
                </div>
                <span>Nhập mã OTP từ email</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  3
                </div>
                <span>Tạo mật khẩu mới</span>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
            <Zap className="w-4 h-4" />
            <span>Nhanh chóng • An toàn • Đáng tin cậy</span>
          </div>
        </div>
      </div>

      {/* Fade CSS for step transitions */}
      <style>
        {`
        .fade-step-enter {
          opacity: 0;
          transform: translateY(16px);
        }
        .fade-step-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms, transform 300ms;
        }
        .fade-step-exit {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-step-exit-active {
          opacity: 0;
          transform: translateY(-16px);
          transition: opacity 300ms, transform 300ms;
        }
        `}
      </style>
    </div>
  );
};

export default ForgotPasswordOTPFlowPage;
