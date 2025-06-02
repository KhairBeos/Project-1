import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useMemo } from "react";
import useAuthUser from "../hooks/useAuthUser";

const Navbar = () => {
  const { authUser, logout, loading } = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();

  // States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Mock data

  // Refs
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Generate fallback avatar URL
  const getFallbackAvatar = (user) => {
    const name = user?.fullName || user?.account || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&color=ffffff`;
  };

  // Handle avatar error
  const handleAvatarError = (e) => {
    if (!avatarError) {
      setAvatarError(true);
      e.target.src = getFallbackAvatar(authUser);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call logout from custom hook if available
      if (logout) {
        await logout();
      } else {
        // Fallback logout logic
        localStorage.removeItem("token");
        sessionStorage.clear();
      }

      // Close dropdown
      setIsDropdownOpen(false);

      // Navigate to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Dropdown menu items
  const dropdownItems = useMemo(
    () => [
      {
        label: "Hồ sơ của tôi",
        to: "/profile",
        icon: <span className="i-lucide-user w-4 h-4" />,
      },
      {
        label: "Cài đặt",
        to: "/settings",
        icon: <span className="i-lucide-settings w-4 h-4" />,
      },
      {
        label: "Trợ giúp",
        to: "/help",
        icon: <span className="i-lucide-help-circle w-4 h-4" />,
      },
    ],
    []
  );

  // User avatar component
  const UserAvatar = ({ size = "w-8 h-8", showOnlineStatus = false }) => (
    <div className="relative">
      <img
        src={
          avatarError
            ? getFallbackAvatar(authUser)
            : authUser?.avatar || getFallbackAvatar(authUser)
        }
        alt={`Ảnh đại diện của ${
          authUser?.fullName || authUser?.account || "User"
        }`}
        className={`${size} rounded-full object-cover border-2 border-base-300 transition-all duration-200`}
        onError={handleAvatarError}
        loading="lazy"
      />
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
      )}
    </div>
  );

  // Loading skeleton
  const NavbarSkeleton = () => (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-base-300 rounded-full animate-pulse"></div>
      <div className="w-20 h-4 bg-base-300 rounded animate-pulse hidden md:block"></div>
    </div>
  );

  // Theme state
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "night"
  );

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "night" ? "light" : "night";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Notification realtime mock
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCount((prev) => (prev + 1) % 100);
    }, 7000); // Tăng mỗi 7 giây
    return () => clearInterval(interval);
  }, []);

  return (
    <nav
      className="w-full h-16 bg-base-100/95 backdrop-blur-sm border-b border-base-300 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-50 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left side - Logo */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors duration-200"
          aria-label="Chat App - Về trang chủ"
        >
          <span className="i-lucide-message-circle w-6 h-6 text-primary" />
          <span className="hidden sm:inline">Chat App</span>
        </Link>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-base-200 transition"
          aria-label="Chuyển đổi giao diện sáng/tối"
        >
          {theme === "night" ? (
            <span className="i-lucide-sun w-5 h-5 text-yellow-400" />
          ) : (
            <span className="i-lucide-moon w-5 h-5 text-gray-700" />
          )}
        </button>

        {loading ? (
          <NavbarSkeleton />
        ) : authUser ? (
          <>
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative flex items-center justify-center hover:bg-base-200 p-2 rounded-full transition-all duration-200 hover:scale-105"
              aria-label={`Thông báo${
                notificationCount > 0 ? ` (${notificationCount} tin mới)` : ""
              }`}
            >
              <span className="i-lucide-bell w-5 h-5 text-base-content/70" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center font-medium animate-pulse">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>

            {/* User dropdown */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-base-200 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm"
                aria-label="Menu người dùng"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <UserAvatar showOnlineStatus />
                <span className="font-medium text-sm hidden md:inline max-w-32 truncate">
                  {authUser.fullName || authUser.account}
                </span>
                <span
                  className={`i-lucide-chevron-down w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-full mt-2 w-56 bg-base-100 border border-base-300 rounded-lg shadow-lg py-2 z-50 animate-fadeIn"
                  role="menu"
                  aria-label="User menu"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-base-300">
                    <div className="flex items-center gap-3">
                      <UserAvatar size="w-10 h-10" showOnlineStatus />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {authUser.fullName || authUser.account}
                        </div>
                        <div className="text-xs text-base-content/60 truncate">
                          {authUser.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-200 transition-colors duration-200"
                      role="menuitem"
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-base-300 my-2"></div>

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error/10 text-error hover:text-error transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    role="menuitem"
                  >
                    {isLoggingOut ? (
                      <span className="i-lucide-loader-2 w-4 h-4 animate-spin" />
                    ) : (
                      <span className="i-lucide-log-out w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Login/Register buttons for guests */
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Add custom CSS for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
`;
document.head.appendChild(style);

export default Navbar;
