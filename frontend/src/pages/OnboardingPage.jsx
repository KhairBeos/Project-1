import { useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit3,
  Camera,
  Globe,
  CheckCircle,
  XCircle,
  Users,
  MessageCircle,
  Heart,
  Star,
} from "lucide-react";
import { onboard } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser.js";

const initialState = (authUser) => ({
  fullName: authUser?.fullName || "",
  email: authUser?.email || "",
  bio: authUser?.bio || "",
  profilePic: authUser?.profilePic || "",
  nationality: authUser?.nationality || "",
  gender: authUser?.gender || "",
  dateOfBirth: authUser?.dateOfBirth || "",
  address: authUser?.address || "",
  district: authUser?.district || "",
  city_or_province: authUser?.city_or_province || "",
  country: authUser?.country || "",
});

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const [formState, setFormState] = useState(initialState(authUser));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [focusedField, setFocusedField] = useState("");
  const navigate = useNavigate();

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Họ và tên là bắt buộc";
        if (value.trim().length < 2) return "Họ và tên phải có ít nhất 2 ký tự";
        if (value.trim().length > 50)
          return "Họ và tên không được quá 50 ký tự";
        return "";

      case "email":
        if (!value.trim()) return "Email là bắt buộc";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Email không hợp lệ";
        return "";

      case "bio":
        if (value.length > 120) return "Giới thiệu không được quá 120 ký tự";
        return "";

      case "profilePic":
        if (value && !isValidUrl(value)) return "URL ảnh không hợp lệ";
        return "";

      case "nationality":
        if (value && value.length > 30)
          return "Quốc tịch không được quá 30 ký tự";
        return "";

      case "dateOfBirth":
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 13) return "Bạn phải trên 13 tuổi";
          if (age > 120) return "Ngày sinh không hợp lệ";
        }
        return "";

      case "address":
        if (value && value.length > 100)
          return "Địa chỉ không được quá 100 ký tự";
        return "";

      case "district":
        if (value && value.length > 50)
          return "Quận/Huyện không được quá 50 ký tự";
        return "";

      case "city_or_province":
        if (value && value.length > 50)
          return "Tỉnh/Thành phố không được quá 50 ký tự";
        return "";

      case "country":
        if (value && value.length > 30)
          return "Quốc gia không được quá 30 ký tự";
        return "";

      default:
        return "";
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formState).forEach((key) => {
      const error = validateField(key, formState[key]);
      if (error) newErrors[key] = error;
    });

    // Check required fields
    if (!formState.fullName.trim()) {
      newErrors.fullName = "Họ và tên là bắt buộc";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFocusedField("");

    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formState).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const location = {
        address: formState.address,
        district: formState.district,
        city_or_province: formState.city_or_province,
        country: formState.country,
      };
      await onboard({
        fullName: formState.fullName,
        bio: formState.bio,
        profilePic: formState.profilePic,
        nationality: formState.nationality,
        gender: formState.gender,
        dateOfBirth: formState.dateOfBirth,
        location,
      });
      navigate("/chat");
    } catch (err) {
      let errorMessage = "Có lỗi xảy ra, vui lòng thử lại.";

      if (err.message?.includes("Network")) {
        errorMessage =
          "Lỗi kết nối mạng, vui lòng kiểm tra internet và thử lại.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClass =
      "w-full px-4 py-3 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 placeholder-gray-400";
    const focusClass = focusedField === fieldName ? "scale-[1.02]" : "";

    if (errors[fieldName] && touched[fieldName]) {
      return `${baseClass} border-red-400 bg-red-50/50`;
    }
    return `${baseClass} ${focusClass}`;
  };

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
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Hoàn thiện hồ sơ
            </h1>
            <p className="text-gray-600">
              Điền thông tin để có trải nghiệm chat tốt nhất
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {errors.general}
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Thông tin cá nhân
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formState.fullName}
                        className="w-full px-4 py-3 bg-gray-100/80 border-2 border-gray-200 rounded-xl cursor-not-allowed text-gray-600"
                        disabled
                        title="Họ và tên đã được nhập khi đăng ký và không thể thay đổi ở bước này"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formState.email}
                        className="w-full px-4 py-3 bg-gray-100/80 border-2 border-gray-200 rounded-xl cursor-not-allowed text-gray-600"
                        disabled
                        title="Email đã được xác thực và không thể thay đổi"
                      />
                    </div>
                    <p className="text-gray-500 text-xs">
                      Email đã được xác thực
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Giới thiệu bản thân
                  </label>
                  <div
                    className={`relative transition-all duration-300 ${
                      focusedField === "bio" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <textarea
                      name="bio"
                      value={formState.bio}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => handleFocus("bio")}
                      className={`${getInputClassName("bio")} h-20 resize-none`}
                      placeholder="Giới thiệu ngắn gọn về bạn..."
                      maxLength={120}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    {errors.bio && touched.bio && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.bio}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs ml-auto">
                      {formState.bio.length}/120
                    </p>
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Ảnh đại diện (URL)
                  </label>
                  <div
                    className={`relative transition-all duration-300 ${
                      focusedField === "profilePic" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <input
                      type="url"
                      name="profilePic"
                      value={formState.profilePic}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => handleFocus("profilePic")}
                      className={getInputClassName("profilePic")}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  {errors.profilePic && touched.profilePic && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.profilePic}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nationality */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Quốc tịch
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        focusedField === "nationality" ? "scale-[1.02]" : ""
                      }`}
                    >
                      <input
                        type="text"
                        name="nationality"
                        value={formState.nationality}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => handleFocus("nationality")}
                        className={getInputClassName("nationality")}
                        placeholder="VD: Việt Nam"
                      />
                    </div>
                    {errors.nationality && touched.nationality && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.nationality}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Giới tính
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        focusedField === "gender" ? "scale-[1.02]" : ""
                      }`}
                    >
                      <select
                        name="gender"
                        value={formState.gender}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => handleFocus("gender")}
                        className={getInputClassName("gender")}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Ngày sinh
                  </label>
                  <div
                    className={`relative transition-all duration-300 ${
                      focusedField === "dateOfBirth" ? "scale-[1.02]" : ""
                    }`}
                  >
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formState.dateOfBirth}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={() => handleFocus("dateOfBirth")}
                      className={getInputClassName("dateOfBirth")}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  {errors.dateOfBirth && touched.dateOfBirth && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Thông tin địa chỉ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Địa chỉ
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        focusedField === "address" ? "scale-[1.02]" : ""
                      }`}
                    >
                      <input
                        type="text"
                        name="address"
                        value={formState.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => handleFocus("address")}
                        className={getInputClassName("address")}
                        placeholder="Số nhà, tên đường..."
                      />
                    </div>
                    {errors.address && touched.address && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* District */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Quận/Huyện
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        focusedField === "district" ? "scale-[1.02]" : ""
                      }`}
                    >
                      <input
                        type="text"
                        name="district"
                        value={formState.district}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => handleFocus("district")}
                        className={getInputClassName("district")}
                        placeholder="VD: Quận 1, Huyện Gia Lâm"
                      />
                    </div>
                    {errors.district && touched.district && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.district}
                      </p>
                    )}
                  </div>

                  {/* City/Province */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tỉnh/Thành phố
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        focusedField === "city_or_province"
                          ? "scale-[1.02]"
                          : ""
                      }`}
                    >
                      <input
                        type="text"
                        name="city_or_province"
                        value={formState.city_or_province}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => handleFocus("city_or_province")}
                        className={getInputClassName("city_or_province")}
                        placeholder="VD: Hồ Chí Minh, Hà Nội"
                      />
                    </div>
                    {errors.city_or_province && touched.city_or_province && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.city_or_province}
                      </p>
                    )}
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Quốc gia
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        focusedField === "country" ? "scale-[1.02]" : ""
                      }`}
                    >
                      <input
                        type="text"
                        name="country"
                        value={formState.country}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={() => handleFocus("country")}
                        className={getInputClassName("country")}
                        placeholder="VD: Việt Nam"
                      />
                    </div>
                    {errors.country && touched.country && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        {errors.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang lưu thông tin...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Lưu thông tin & Tiếp tục
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                <span className="text-red-500">*</span> Thông tin bắt buộc
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-[45%] items-center justify-center min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
          <div
            className="absolute top-40 right-32 w-8 h-8 bg-white/20 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div
            className="absolute bottom-40 left-16 w-12 h-12 bg-white/15 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-32 right-20 w-6 h-6 bg-white/25 rounded-full animate-bounce"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div
            className="absolute top-1/2 left-8 w-10 h-10 bg-white/10 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-10 text-center text-white p-8 max-w-md">
          {/* Main content */}
          <div className="mb-12">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center mb-6 shadow-2xl">
                <User className="w-16 h-16 text-white" />
              </div>
              {/* Floating icons around main icon */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center animate-bounce">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Chào mừng đến với Chat App!
            </h2>
            <p className="text-xl text-white/90 leading-relaxed mb-8">
              Hoàn thiện hồ sơ để kết nối và trò chuyện với mọi người trên khắp
              thế giới.
            </p>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold mb-1">10K+</div>
              <div className="text-sm text-white/80">Người dùng</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold mb-1">50K+</div>
              <div className="text-sm text-white/80">Tin nhắn/ngày</div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3 text-left">
            {[
              {
                icon: MessageCircle,
                text: "Tin nhắn siêu nhanh",
                color: "from-blue-400 to-cyan-400",
              },
              {
                icon: Heart,
                text: "Kết nối ý nghĩa",
                color: "from-pink-400 to-rose-400",
              },
              {
                icon: Globe,
                text: "Trò chuyện toàn cầu",
                color: "from-green-400 to-emerald-400",
              },
              {
                icon: Star,
                text: "Trải nghiệm tuyệt vời",
                color: "from-yellow-400 to-orange-400",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center`}
                >
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom decoration */}
          <div className="mt-8 flex justify-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Enhanced decorative elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/3 right-5 w-24 h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  );
};

export default OnboardingPage;
