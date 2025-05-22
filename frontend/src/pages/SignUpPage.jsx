import { useState, useEffect } from "react";
import { ShipWheelIcon, Eye, EyeOff } from "lucide-react";
import { axiosInstance } from "../lib/axios.js";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import validator from "validator";

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
  const navigate = useNavigate();

  // Nếu đã login thì tự động điều hướng về trang chính
  useEffect(() => {
    if (authUser) {
      navigate("/", { replace: true });
    }
  }, [authUser, navigate]);

  // Kiểm tra độ mạnh mật khẩu
  const isStrongPassword = (password) =>
    validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });

  const handleSignup = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setBackendError("");
    if (signupData.password !== signupData.confirmPassword) {
      setPasswordError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    if (!isStrongPassword(signupData.password)) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and symbol."
      );
      toast.error(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and symbol."
      );
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/auth/signup", {
        account: signupData.account,
        password: signupData.password,
        fullName: signupData.fullName,
        email: signupData.email,
      });
      toast.success("Sign up successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setBackendError(
        err.response?.data?.message || "Sign up failed. Please try again."
      );
      toast.error(
        err.response?.data?.message || "Sign up failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
      data-theme="forest"
    >
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
        {/* SIGNUP FORM - LEFT SIDE */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/*LOGO*/}
          <div className="mb-4 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              Chat Application
            </span>
          </div>
          <div className="w-full">
            <form onSubmit={handleSignup}>
              <fieldset disabled={loading} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Create an Account</h2>
                  <p className="text-sm opacity-70">
                    Join us and start chatting with your friends and family!
                  </p>
                </div>
                <div className="space-y-3">
                  {/* ACCOUNT */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Account</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your account name"
                      className="input input-bordered w-full"
                      value={signupData.account}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          account: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* FULL NAME */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Full Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      className="input input-bordered w-full"
                      value={signupData.fullName}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          fullName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="yourgmail@gmail.com"
                      className="input input-bordered w-full"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {/* PASSWORD */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className="input input-bordered w-full pr-10"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-500 mt-1">
                        {passwordError}
                      </p>
                    )}
                    <p className="text-sx opacity-70 mt-1">
                      Password must be at least 8 characters long and contain a
                      mix of uppercase, lowercase, numbers, and special
                      characters.
                    </p>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Confirm Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="********"
                        className="input input-bordered w-full pr-10"
                        value={signupData.confirmPassword}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        required
                        disabled={loading}
                      />
                      <span className="text-xs leading-tight">
                        I agree to the{" "}
                        <span className="text-primary hover:underline">
                          Terms of Service
                        </span>{" "}
                        and{" "}
                        <span className="text-primary hover:underline">
                          Privacy Policy
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                {backendError && (
                  <div className="text-xs text-red-500 text-center mt-2">
                    {backendError}
                  </div>
                )}

                <button
                  className="btn btn-primary w-full"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>

                <div className="text-center mt-4">
                  <p className="text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
