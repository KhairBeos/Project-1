import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api.js";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  XCircle,
  AlertCircle,
  WifiOff,
  MessageCircle,
  Star,
  Shield,
  Zap,
  CheckCircle,
  Heart,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ account: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    mutate: loginMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setLoginAttempts(0);
      // 2FA: Nếu backend trả về cần xác thực 2FA, điều hướng sang /2fa
      if (data?.require2FA) {
        navigate("/2fa", { state: { account: loginData.account } });
        return;
      }
      // Navigate to dashboard or intended page
      const redirectTo =
        new URLSearchParams(location.search).get("redirect") || "/dashboard";
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => {
      setLoginAttempts((prev) => prev + 1);
      setLoginData((prev) => ({ ...prev, password: "" })); // Reset password field on error
    },
  });

  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    if (!loginData.account.trim()) {
      errors.account = "Vui lòng nhập tài khoản hoặc email";
    } else if (
      loginData.account.includes("@") &&
      !isValidEmail(loginData.account)
    ) {
      errors.account = "Email không hợp lệ";
    }

    if (!loginData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (loginData.password.length < 8) {
      errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear validation error when user starts typing
  const handleInputChange = (field, value) => {
    setLoginData({ ...loginData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  // Enhanced error handling
  const getErrorMessage = (error) => {
    if (!error) return "";

    // Network errors
    if (error.code === "NETWORK_ERROR" || !navigator.onLine) {
      return "Không có kết nối mạng. Vui lòng kiểm tra lại.";
    }

    // HTTP status errors
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 401:
        return "Tài khoản hoặc mật khẩu không chính xác";
      case 429:
        return "Quá nhiều lần thử. Vui lòng đợi một chút.";
      case 500:
        return "Lỗi máy chủ. Vui lòng thử lại sau.";
      default:
        return message || "Đăng nhập thất bại. Vui lòng thử lại.";
    }
  };

  // Auto focus on mount
  useEffect(() => {
    const input = document.getElementById("login-account");
    if (input) input.focus();
  }, []);

  // Animation cycle for right panel
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Rate limiting - disable form after too many attempts
  const isRateLimited = loginAttempts >= 5;
  const rateLimitMessage = isRateLimited
    ? "Quá nhiều lần thử. Vui lòng đợi 5 phút."
    : "";

  const handleLogin = (e) => {
    e.preventDefault();

    if (isRateLimited) return;

    if (!validateForm()) return;

    loginMutation(loginData);
  };

  // Handle Enter key in password field
  const handleKeyPress = (e, field) => {
    if (e.key === "Enter") {
      if (field === "account") {
        document.getElementById("login-password")?.focus();
      } else if (field === "password") {
        handleLogin(e);
      }
    }
  };

  // Right panel content
  const stats = [
    { icon: <User className="w-5 h-5" />, number: "2M+", label: "Người dùng" },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      number: "10M+",
      label: "Tin nhắn/ngày",
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      number: "4.9/5",
      label: "Đánh giá",
    },
  ];

  const features = [
    {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "Chat siêu tốc",
      desc: "Nhắn tin tức thì, không độ trễ.",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Bảo mật cao",
      desc: "Mã hóa đầu cuối, an toàn tuyệt đối.",
      color: "from-green-400 to-emerald-500",
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      title: "Trải nghiệm tuyệt vời",
      desc: "Giao diện hiện đại, dễ sử dụng.",
      color: "from-yellow-400 to-orange-400",
    },
  ];

  const testimonials = [
    {
      text: "Ứng dụng chat tốt nhất mình từng dùng!",
      name: "Nguyễn Văn A",
      rating: 5,
    },
    {
      text: "Nhanh, mượt, bảo mật rất yên tâm.",
      name: "Trần Thị B",
      rating: 5,
    },
    {
      text: "Giao diện đẹp, nhiều tính năng hay.",
      name: "Lê C",
      rating: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex">
      <style>{`
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(255,255,255,0.3); }
          100% { box-shadow: 0 0 30px rgba(255,255,255,0.6); }
        }
      `}</style>

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
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Chào mừng trở lại!
            </h1>
            <p className="text-gray-600">
              Đăng nhập để tiếp tục trò chuyện với bạn bè
            </p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleLogin}
            className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
            noValidate
          >
            <div className="space-y-6">
              {/* Account Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  htmlFor="login-account"
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
                    id="login-account"
                    type="text"
                    placeholder="Tên tài khoản hoặc email"
                    className={`w-full px-4 py-3 bg-white/50 border-2 rounded-xl focus:outline-none transition-all duration-300 placeholder-gray-400 ${
                      validationErrors.account
                        ? "border-red-400 focus:border-red-500 bg-red-50/50"
                        : "border-gray-200 focus:border-purple-500"
                    }`}
                    value={loginData.account}
                    onChange={(e) =>
                      handleInputChange("account", e.target.value)
                    }
                    onKeyPress={(e) => handleKeyPress(e, "account")}
                    onFocus={() => setFocusedField("account")}
                    onBlur={() => setFocusedField("")}
                    required
                    autoComplete="username"
                    aria-label="Tài khoản hoặc Email"
                    aria-invalid={!!validationErrors.account}
                    disabled={isPending || isRateLimited}
                  />
                </div>
                {validationErrors.account && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.account}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  htmlFor="login-password"
                >
                  <Lock className="w-4 h-4" />
                  Mật khẩu
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "password" ? "scale-[1.02]" : ""
                  }`}
                >
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className={`w-full px-4 py-3 pr-12 bg-white/50 border-2 rounded-xl focus:outline-none transition-all duration-300 placeholder-gray-400 ${
                      validationErrors.password
                        ? "border-red-400 focus:border-red-500 bg-red-50/50"
                        : "border-gray-200 focus:border-purple-500"
                    }`}
                    value={loginData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    onKeyPress={(e) => handleKeyPress(e, "password")}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    required
                    autoComplete="current-password"
                    aria-label="Mật khẩu"
                    aria-invalid={!!validationErrors.password}
                    disabled={isPending || isRateLimited}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={isPending || isRateLimited}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.password}
                  </p>
                )}
              </div>

              {/* Error Messages */}
              {(error || rateLimitMessage) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    {!navigator.onLine ? (
                      <WifiOff className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {rateLimitMessage || getErrorMessage(error)}
                  </p>
                </div>
              )}

              {/* Network Status */}
              {!navigator.onLine && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    Không có kết nối mạng
                  </p>
                </div>
              )}

              {/* Login Attempts Warning */}
              {loginAttempts >= 3 && loginAttempts < 5 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Còn {5 - loginAttempts} lần thử
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || isRateLimited || !navigator.onLine}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang đăng nhập...
                  </div>
                ) : isRateLimited ? (
                  "Tạm khóa do quá nhiều lần thử"
                ) : !navigator.onLine ? (
                  <div className="flex items-center justify-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    Không có mạng
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>

              {/* Navigation Links */}
              <div className="flex justify-between items-center">
                <div />
                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-700 hover:underline focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => navigate("/forgot-password-otp")}
                  disabled={isPending}
                  aria-label="Quên mật khẩu"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => navigate("/signup")}
                    disabled={isPending}
                    aria-label="Đi đến trang đăng ký"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE - ENHANCED ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl float-animation"></div>
          <div
            className="absolute bottom-32 left-16 w-24 h-24 bg-white/5 rounded-full blur-2xl float-animation"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/2 right-10 w-16 h-16 bg-white/15 rounded-full blur-lg float-animation"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        <div className="relative z-10 text-center text-white p-8 max-w-md">
          {/* Main Hero Section */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center mb-6 pulse-glow">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Chào mừng trở lại!</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Hàng triệu người dùng đang đợi bạn trở lại để tiếp tục những cuộc
              trò chuyện thú vị.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto bg-white/10 rounded-lg flex items-center justify-center mb-2">
                  {stat.icon}
                </div>
                <div className="text-xl font-bold">{stat.number}</div>
                <div className="text-xs text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features with better spacing */}
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-3 bg-white/10 backdrop-blur-sm rounded-lg transition-all duration-500 hover:bg-white/20 hover:scale-105 ${
                  animationStep === index % 3 ? "ring-2 ring-white/30" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 bg-gradient-to-r ${feature.color} rounded-lg`}
                  >
                    {feature.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm">{feature.title}</div>
                    <div className="text-xs text-white/80">{feature.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials Carousel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold">
                Đánh giá từ người dùng
              </span>
            </div>
            <div className="transition-all duration-500">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`${animationStep === index ? "block" : "hidden"}`}
                >
                  <p className="text-sm text-white/90 mb-2 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      - {testimonial.name}
                    </span>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/80">
            <Heart className="w-4 h-4 text-red-400" />
            <span>Chúng tôi nhớ bạn rồi - Chào mừng về nhà!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
