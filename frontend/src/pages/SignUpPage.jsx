import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Lock,
  UserCheck,
  MessageCircle,
  Star,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "../lib/api.js";

const SignUpPage = ({ authUser }) => {
  const [signupData, setSignupData] = useState({
    account: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [backendError, setBackendError] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    mutate: signupMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      navigate("/verify-email");
    },
    onError: (error) => {
      setBackendError(
        error?.response?.data?.message ||
          "Đăng ký không thành công. Vui lòng thử lại."
      );
      setLoading(false);
    },
  });

  useEffect(() => {
    if (authUser) {
      if (!authUser.isEmailVerified) {
        navigate("/verify-email");
      } else if (!authUser.isOnboarded) {
        navigate("/onboarding");
      } else {
        navigate("/chat");
      }
    }
  }, [authUser, navigate]);

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

  const passwordRequirements = validatePassword(signupData.password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleSignup = (e) => {
    e.preventDefault();
    setPasswordError("");
    setBackendError("");

    if (signupData.password !== signupData.confirmPassword) {
      setPasswordError("Mật khẩu không khớp");
      return;
    }
    if (!isPasswordValid) {
      setPasswordError("Vui lòng đáp ứng tất cả yêu cầu mật khẩu");
      return;
    }
    setLoading(true);
    signupMutation({
      account: signupData.account,
      password: signupData.password,
      fullName: signupData.fullName,
      email: signupData.email,
    });
  };

  // Mock data cho right side illustration
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
      icon: <UserCheck className="w-5 h-5" />,
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

  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % testimonials.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex">
      <style>{`
        input[type="password"]::-webkit-textfield-decoration-container,
        input[type="password"]::-webkit-reveal {
          display: none !important;
        }
        input[type="password"]::-ms-reveal {
          display: none !important;
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
              Tham gia Chat App
            </h1>
            <p className="text-gray-600">
              Tạo tài khoản của bạn và bắt đầu kết nối
            </p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSignup}
            className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            <div className="space-y-6">
              {/* Account Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  htmlFor="signup-account"
                >
                  <User className="w-4 h-4" />
                  Tên tài khoản
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "account" ? "scale-[1.02]" : ""
                  }`}
                >
                  <input
                    id="signup-account"
                    type="text"
                    placeholder="Chọn tên người dùng độc đáo của bạn"
                    className={`w-full px-4 py-3 bg-white/50 border-2 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 placeholder-gray-400 ${
                      backendError?.toLowerCase().includes("tài khoản")
                        ? "border-red-400 bg-red-50/50"
                        : "border-gray-200"
                    }`}
                    value={signupData.account}
                    onChange={(e) => {
                      setSignupData({ ...signupData, account: e.target.value });
                      setBackendError("");
                    }}
                    onFocus={() => setFocusedField("account")}
                    onBlur={() => setFocusedField("")}
                    required
                    autoComplete="username"
                    aria-label="Tên tài khoản"
                    pattern="^[a-zA-Z0-9_]{4,20}$"
                    title="Chỉ dùng chữ, số, gạch dưới. 4-20 ký tự."
                  />
                  {backendError?.toLowerCase().includes("tài khoản") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <XCircle className="w-3 h-3" />
                      {backendError}
                    </p>
                  )}
                </div>
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Họ và tên
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "fullName" ? "scale-[1.02]" : ""
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    className="w-full px-4 py-3 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 placeholder-gray-400"
                    value={signupData.fullName}
                    onChange={(e) => {
                      setSignupData({
                        ...signupData,
                        fullName: e.target.value,
                      });
                      setBackendError("");
                    }}
                    onFocus={() => setFocusedField("fullName")}
                    onBlur={() => setFocusedField("")}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  htmlFor="signup-email"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "email" ? "scale-[1.02]" : ""
                  }`}
                >
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="email.của.bạn@example.com"
                    className={`w-full px-4 py-3 bg-white/50 border-2 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 placeholder-gray-400 ${
                      backendError?.toLowerCase().includes("email")
                        ? "border-red-400 bg-red-50/50"
                        : "border-gray-200"
                    }`}
                    value={signupData.email}
                    onChange={(e) => {
                      setSignupData({ ...signupData, email: e.target.value });
                      setBackendError("");
                    }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    required
                    autoComplete="email"
                    aria-label="Email"
                    pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                    title="Nhập đúng định dạng email."
                  />
                  {backendError?.toLowerCase().includes("email") && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <XCircle className="w-3 h-3" />
                      {backendError}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  htmlFor="signup-password"
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
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tạo mật khẩu mạnh"
                    className="w-full px-4 py-3 pr-12 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 placeholder-gray-400"
                    style={{
                      WebkitTextSecurity: showPassword ? "none" : "disc",
                    }}
                    value={signupData.password}
                    onChange={(e) => {
                      setSignupData({
                        ...signupData,
                        password: e.target.value,
                      });
                      setBackendError("");
                    }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    autoComplete="new-password"
                    aria-label="Mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {signupData.password && (
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
                        <div key={key} className="flex items-center gap-1">
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                  htmlFor="signup-confirm-password"
                >
                  <Lock className="w-4 h-4" />
                  Xác nhận mật khẩu
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    focusedField === "confirmPassword" ? "scale-[1.02]" : ""
                  }`}
                >
                  <input
                    id="signup-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu của bạn"
                    className="w-full px-4 py-3 pr-12 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 placeholder-gray-400"
                    style={{
                      WebkitTextSecurity: showConfirm ? "none" : "disc",
                    }}
                    value={signupData.confirmPassword}
                    onChange={(e) => {
                      setSignupData({
                        ...signupData,
                        confirmPassword: e.target.value,
                      });
                      setBackendError("");
                    }}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField("")}
                    autoComplete="new-password"
                    aria-label="Xác nhận mật khẩu"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    aria-label={
                      showConfirm
                        ? "Ẩn xác nhận mật khẩu"
                        : "Hiện xác nhận mật khẩu"
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {signupData.confirmPassword &&
                  signupData.password !== signupData.confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Mật khẩu không khớp
                    </p>
                  )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  Tôi đồng ý với{" "}
                  <span className="text-purple-600 hover:text-purple-700 cursor-pointer underline">
                    Điều khoản dịch vụ
                  </span>{" "}
                  và{" "}
                  <span className="text-purple-600 hover:text-purple-700 cursor-pointer underline">
                    Chính sách bảo mật
                  </span>
                </label>
              </div>

              {/* Error Message Block */}
              {(passwordError ||
                backendError ||
                (error && error.response?.data?.message)) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {passwordError ||
                      backendError ||
                      error.response?.data?.message}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isPending || !agreeToTerms}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed"
              >
                {loading || isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang tạo tài khoản...
                  </div>
                ) : (
                  "Tạo tài khoản"
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium hover:underline"
                    onClick={() => navigate("/login")}
                    aria-label="Đi đến trang đăng nhập"
                  >
                    Đăng nhập tại đây
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
            <h2 className="text-3xl font-bold mb-4">Chào mừng bạn đến!</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              Tham gia cộng đồng hàng triệu người dùng đang trò chuyện và kết
              nối trên nền tảng của chúng tôi.
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
            <Zap className="w-4 h-4" />
            <span>Tham gia ngay hôm nay - Hoàn toàn miễn phí!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
