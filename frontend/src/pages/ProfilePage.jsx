import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser.js";
import {
  updateProfile,
  resendVerifyEmail,
  changePassword,
  enable2FA,
  disable2FA,
} from "../lib/api.js";
import {
  Shield,
  Mail,
  User,
  Loader2,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../components/Toast.jsx";

// Trang cập nhật thông tin cá nhân
const ProfilePage = () => {
  const { authUser, refetch } = useAuthUser();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Đổi mật khẩu
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // 2FA
  const [twoFAloading, setTwoFAloading] = useState(false);
  const [twoFASuccess, setTwoFASuccess] = useState("");
  const [twoFAError, setTwoFAError] = useState("");

  // Thông tin cá nhân mở rộng
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [nationality, setNationality] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [cityOrProvince, setCityOrProvince] = useState("");
  const [country, setCountry] = useState("");

  // Initialize form data when authUser is loaded
  useEffect(() => {
    if (authUser) {
      setName(authUser.name || "");
      setAvatar(authUser.avatar || "");
      setFullName(authUser.fullName || "");
      setBio(authUser.bio || "");
      setNationality(authUser.nationality || "");
      setDateOfBirth(
        authUser.dateOfBirth ? authUser.dateOfBirth.slice(0, 10) : ""
      );
      setGender(authUser.gender || "");
      setAddress(authUser.location?.address || "");
      setDistrict(authUser.location?.district || "");
      setCityOrProvince(authUser.location?.city_or_province || "");
      setCountry(authUser.location?.country || "");
    }
  }, [authUser]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    if (pwSuccess || pwError) {
      const timer = setTimeout(() => {
        setPwSuccess("");
        setPwError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pwSuccess, pwError]);

  useEffect(() => {
    if (twoFASuccess || twoFAError) {
      const timer = setTimeout(() => {
        setTwoFASuccess("");
        setTwoFAError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [twoFASuccess, twoFAError]);

  // Validate password strength
  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
    };
  };

  const passwordStrength = validatePassword(newPassword);

  // Cập nhật thông tin cá nhân
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (!name.trim()) {
      setError("Tên hiển thị không được để trống");
      setLoading(false);
      return;
    }

    if (avatar && !isValidUrl(avatar)) {
      setError("URL avatar không hợp lệ");
      setLoading(false);
      return;
    }
    try {
      await updateProfile({
        name: name.trim(),
        avatar: avatar.trim(),
        fullName: fullName.trim(),
        bio: bio.trim(),
        nationality: nationality.trim(),
        dateOfBirth,
        gender,
        location: {
          address: address.trim(),
          district: district.trim(),
          city_or_province: cityOrProvince.trim(),
          country: country.trim(),
        },
      });
      setSuccess("Cập nhật thành công!");
      addToast({ message: "Cập nhật thành công!", type: "success" });
      refetch && refetch();
    } catch (err) {
      setError(err?.response?.data?.message || "Cập nhật thất bại");
      addToast({
        message: err?.response?.data?.message || "Cập nhật thất bại",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validate URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Gửi lại email xác thực
  const handleResendVerify = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await resendVerifyEmail(authUser.email);
      setSuccess("Đã gửi lại email xác thực!");
      addToast({ message: "Đã gửi lại email xác thực!", type: "success" });
    } catch (err) {
      setError(err?.response?.data?.message || "Gửi lại thất bại");
      addToast({
        message: err?.response?.data?.message || "Gửi lại thất bại",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError("Vui lòng nhập đầy đủ thông tin");
      setPwLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu xác nhận không khớp");
      setPwLoading(false);
      return;
    }

    if (!passwordStrength.isValid) {
      setPwError(
        "Mật khẩu mới không đủ mạnh. Vui lòng kiểm tra các yêu cầu bên dưới."
      );
      setPwLoading(false);
      return;
    }

    if (oldPassword === newPassword) {
      setPwError("Mật khẩu mới phải khác mật khẩu cũ");
      setPwLoading(false);
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword });
      setPwSuccess("Đổi mật khẩu thành công!");
      addToast({ message: "Đổi mật khẩu thành công!", type: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    } catch (err) {
      setPwError(err?.response?.data?.message || "Đổi mật khẩu thất bại");
      addToast({
        message: err?.response?.data?.message || "Đổi mật khẩu thất bại",
        type: "error",
      });
    } finally {
      setPwLoading(false);
    }
  };

  // Bật/tắt 2FA
  const handleToggle2FA = async () => {
    setTwoFAloading(true);
    setTwoFAError("");
    setTwoFASuccess("");
    try {
      if (authUser?.twoFactorEnabled) {
        await disable2FA();
        setTwoFASuccess("Đã tắt xác thực 2 lớp");
        addToast({ message: "Đã tắt xác thực 2 lớp", type: "success" });
      } else {
        await enable2FA();
        setTwoFASuccess(
          "Đã bật xác thực 2 lớp. Vui lòng kiểm tra email để xác thực!"
        );
        addToast({
          message:
            "Đã bật xác thực 2 lớp. Vui lòng kiểm tra email để xác thực!",
          type: "success",
        });
      }
      refetch && refetch();
    } catch (err) {
      setTwoFAError(err?.response?.data?.message || "Thao tác thất bại");
      addToast({
        message: err?.response?.data?.message || "Thao tác thất bại",
        type: "error",
      });
    } finally {
      setTwoFAloading(false);
    }
  };

  // Password input component
  const PasswordInput = ({
    label,
    value,
    onChange,
    show,
    onToggleShow,
    disabled,
    placeholder,
  }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          onClick={onToggleShow}
          disabled={disabled}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-8 h-8 text-purple-600" />
        <h2 className="text-3xl font-bold text-gray-800">Thông tin cá nhân</h2>
      </div>

      {/* Profile Update Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên hiển thị <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="Nhập tên hiển thị"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">{name.length}/50 ký tự</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avatar (URL)
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            disabled={loading}
            placeholder="https://example.com/avatar.jpg"
          />
          {avatar && (
            <div className="mt-2">
              <img
                src={avatar}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-800">{authUser?.email}</span>
            </div>
            {authUser?.isVerified ? (
              <span className="text-green-600 flex items-center gap-2 font-medium">
                <CheckCircle className="w-5 h-5" /> Đã xác thực
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendVerify}
                className="text-purple-600 hover:text-purple-800 font-medium underline transition-colors"
                disabled={loading}
              >
                Gửi lại xác thực
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            placeholder="Nhập họ và tên"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giới thiệu bản thân
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-3"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            placeholder="Giới thiệu ngắn về bạn"
            maxLength={300}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quốc tịch
          </label>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            disabled={loading}
            placeholder="Nhập quốc tịch"
            maxLength={50}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày sinh
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giới tính
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={loading}
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              placeholder="Số nhà, tên đường"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quận/Huyện
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={loading}
              placeholder="Quận/Huyện"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỉnh/Thành phố
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={cityOrProvince}
              onChange={(e) => setCityOrProvince(e.target.value)}
              disabled={loading}
              placeholder="Tỉnh/Thành phố"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quốc gia
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={loading}
              placeholder="Quốc gia"
              maxLength={50}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpdate}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </div>

      {/* Change Password Section */}
      <div className="mt-12 border-t pt-8">
        <button
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors mb-4"
          onClick={() => setShowChangePassword((v) => !v)}
        >
          <Lock className="w-5 h-5" />
          {showChangePassword ? "Ẩn đổi mật khẩu" : "Đổi mật khẩu"}
        </button>

        {showChangePassword && (
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="space-y-4">
              <PasswordInput
                label="Mật khẩu cũ"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                show={showOldPassword}
                onToggleShow={() => setShowOldPassword(!showOldPassword)}
                disabled={pwLoading}
                placeholder="Nhập mật khẩu hiện tại"
              />

              <PasswordInput
                label="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                show={showNewPassword}
                onToggleShow={() => setShowNewPassword(!showNewPassword)}
                disabled={pwLoading}
                placeholder="Nhập mật khẩu mới"
              />

              {newPassword && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-700">Yêu cầu mật khẩu:</p>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.minLength
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {passwordStrength.minLength ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Ít nhất 8 ký tự
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasUpperCase
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {passwordStrength.hasUpperCase ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Có chữ hoa
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasLowerCase
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {passwordStrength.hasLowerCase ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Có chữ thường
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasNumbers
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {passwordStrength.hasNumbers ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    Có số
                  </div>
                </div>
              )}

              <PasswordInput
                label="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                show={showConfirmPassword}
                onToggleShow={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                disabled={pwLoading}
                placeholder="Nhập lại mật khẩu mới"
              />

              {pwError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {pwError}
                </div>
              )}

              {pwSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {pwSuccess}
                </div>
              )}

              <button
                type="button"
                onClick={handleChangePassword}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                disabled={pwLoading}
              >
                {pwLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang đổi...
                  </>
                ) : (
                  "Đổi mật khẩu"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2FA Section */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-800">
                Xác thực 2 lớp (2FA)
              </h3>
              <p className="text-sm text-gray-600">
                Tăng cường bảo mật cho tài khoản của bạn
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                authUser?.twoFactorEnabled
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {authUser?.twoFactorEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Đã bật
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Chưa bật
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleToggle2FA}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              authUser?.twoFactorEnabled
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
            disabled={twoFAloading}
          >
            {twoFAloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : authUser?.twoFactorEnabled ? (
              "Tắt 2FA"
            ) : (
              "Bật 2FA"
            )}
          </button>

          {twoFAError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-3">
              <AlertCircle className="w-4 h-4" />
              {twoFAError}
            </div>
          )}

          {twoFASuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mt-3">
              <CheckCircle className="w-4 h-4" />
              {twoFASuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
