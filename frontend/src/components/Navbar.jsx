import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  ChevronLeft,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { useLayout } from "./Layout";

const Navbar = () => {
  const { authUser, logout, loading } = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapse } = useLayout();

  // States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [theme, setTheme] = useState("dark");

  // Refs
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Memoize fallback avatar generation
  const getFallbackAvatar = useCallback((user) => {
    const name = user?.fullName || user?.account || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&color=ffffff&size=40&format=svg`;
  }, []);

  // Handle avatar error with useCallback
  const handleAvatarError = useCallback(
    (e) => {
      if (!avatarError) {
        setAvatarError(true);
        e.target.src = getFallbackAvatar(authUser);
      }
    },
    [avatarError, authUser, getFallbackAvatar]
  );

  // Handle logout with better error handling
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);

      if (logout) {
        await logout();
      }

      setIsDropdownOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Could add toast notification here
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  // Toggle theme with useCallback
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [theme]);

  // Toggle dropdown with useCallback
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

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

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Mock notification updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCount((prev) => (prev + 1) % 100);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Memoize dropdown items
  const dropdownItems = useMemo(
    () => [
      {
        label: "Hồ sơ của tôi",
        to: "/profile",
        icon: <User className="w-4 h-4" />,
      },
      {
        label: "Cài đặt",
        to: "/settings",
        icon: <Settings className="w-4 h-4" />,
      },
      {
        label: "Trợ giúp",
        to: "/help",
        icon: <HelpCircle className="w-4 h-4" />,
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
        className={`${size} rounded-full object-cover border-2 border-gray-300 transition-all duration-200`}
        onError={handleAvatarError}
        loading="lazy"
      />
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );

  // Loading skeleton
  const NavbarSkeleton = () => (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse hidden md:block"></div>
    </div>
  );

  return (
    <nav
      className={`w-full h-16 border-b flex items-center px-4 sm:px-6 justify-between sticky top-0 z-50 shadow-sm transition-colors duration-200 ${
        theme === "dark"
          ? "bg-gray-900/95 border-gray-700 text-white backdrop-blur-sm"
          : "bg-white/95 border-gray-200 text-gray-900 backdrop-blur-sm"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left side - Logo & Sidebar toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sidebar collapse button (desktop only) */}
        <button
          onClick={toggleSidebarCollapse}
          className={`hidden lg:inline-flex items-center justify-center p-2 rounded-full transition mr-1 ${
            theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
          }`}
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform duration-200 ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
          />
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl hover:text-blue-600 transition-colors duration-200"
          aria-label="Chat App - Về trang chủ"
        >
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <span className="hidden sm:inline">Chat App</span>
        </Link>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition ${
            theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
          }`}
          aria-label="Chuyển đổi giao diện sáng/tối"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {loading ? (
          <NavbarSkeleton />
        ) : authUser ? (
          <>
            {/* Notifications */}
            <Link
              to="/notifications"
              className={`relative flex items-center justify-center p-2 rounded-full transition-all duration-200 hover:scale-105 ${
                theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              aria-label={`Thông báo${
                notificationCount > 0 ? ` (${notificationCount} tin mới)` : ""
              }`}
            >
              <Bell
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center font-medium animate-pulse">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>

            {/* User dropdown */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm ${
                  theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
                aria-label="Menu người dùng"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <UserAvatar showOnlineStatus />
                <span className="font-medium text-sm hidden md:inline max-w-32 truncate">
                  {authUser.fullName || authUser.account}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className={`absolute right-0 top-full mt-2 w-56 border rounded-lg shadow-lg py-2 z-50 animate-fadeIn ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                  role="menu"
                  aria-label="User menu"
                >
                  {/* User info header */}
                  <div
                    className={`px-4 py-3 border-b ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar size="w-10 h-10" showOnlineStatus />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {authUser.fullName || authUser.account}
                        </div>
                        <div
                          className={`text-xs truncate ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
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
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-200 ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      }`}
                      role="menuitem"
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div
                    className={`border-t my-2 ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  ></div>

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    role="menuitem"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
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
            <Link
              to="/login"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                theme === "dark"
                  ? "text-gray-300 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
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
      `}</style>
    </nav>
  );
};

export default Navbar;
