import { useMemo, useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  Home,
  MessageCircle,
  Users,
  UsersRound,
  Bell,
  User,
  ChevronLeft,
} from "lucide-react";

const SideBar = ({ collapsed = false, onCollapse = () => {} }) => {
  const { authUser, loading } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const [avatarError, setAvatarError] = useState(false);

  // Memoize menu items with actual Lucide React icons
  const menu = useMemo(
    () => [
      {
        label: "Trang chủ",
        to: "/",
        icon: <Home className="w-5 h-5" />,
      },
      {
        label: "Chat",
        to: "/chat",
        icon: <MessageCircle className="w-5 h-5" />,
        badge: 3,
      },
      {
        label: "Bạn bè",
        to: "/friends",
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: "Nhóm",
        to: "/groups",
        icon: <UsersRound className="w-5 h-5" />,
      },
      {
        label: "Thông báo",
        to: "/notifications",
        icon: <Bell className="w-5 h-5" />,
        badge: 5,
      },
      {
        label: "Hồ sơ",
        to: "/profile",
        icon: <User className="w-5 h-5" />,
      },
    ],
    []
  );

  // Memoize fallback avatar generation
  const getFallbackAvatar = useCallback((user) => {
    const name = user?.fullName || user?.account || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&size=40&format=svg`;
  }, []);

  // Handle avatar load error with useCallback
  const handleAvatarError = useCallback(
    (e) => {
      if (!avatarError) {
        setAvatarError(true);
        e.target.src = getFallbackAvatar(authUser);
      }
    },
    [avatarError, authUser, getFallbackAvatar]
  );

  // Handle collapse toggle
  const handleCollapseToggle = useCallback(() => {
    onCollapse();
  }, [onCollapse]);

  // Loading skeleton component
  const UserInfoSkeleton = () => (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col h-full shadow-lg transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo & App name */}
        <div className="p-5 border-b border-gray-200">
          <Link
            to="/"
            className={`flex items-center font-bold text-lg text-gray-800 hover:text-blue-600 transition-colors duration-200 ${
              collapsed ? "justify-center" : "gap-2.5"
            }`}
            aria-label="Chat App - Về trang chủ"
          >
            <MessageCircle className="w-7 h-7 text-blue-600 flex-shrink-0" />
            {!collapsed && <span>Chat App</span>}
          </Link>
        </div>

        {/* User info with loading state */}
        {loading ? (
          <UserInfoSkeleton />
        ) : authUser ? (
          <div
            className={`flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={
                  avatarError
                    ? getFallbackAvatar(authUser)
                    : authUser.avatar || getFallbackAvatar(authUser)
                }
                alt={`Ảnh đại diện của ${
                  authUser.fullName || authUser.account
                }`}
                className="w-10 h-10 rounded-full border-2 border-gray-300 object-cover"
                onError={handleAvatarError}
                loading="lazy"
              />
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-gray-900">
                  {authUser.fullName || authUser.account}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {authUser.email}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 border-b border-gray-200">
            <Link
              to="/login"
              className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 block text-center ${
                collapsed
                  ? "w-10 h-10 flex items-center justify-center"
                  : "w-full"
              }`}
            >
              {collapsed ? <User className="w-4 h-4" /> : "Đăng nhập"}
            </Link>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto" role="menu">
          {menu.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 px-4 py-3 my-1 mx-2 rounded-lg transition-all duration-200 font-medium hover:bg-gray-100 group ${
                currentPath === item.to
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600 shadow-sm"
                  : "text-gray-700 hover:text-gray-900"
              } ${collapsed ? "justify-center" : ""}`}
              role="menuitem"
              aria-current={currentPath === item.to ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span
                className={`transition-transform duration-200 flex-shrink-0 ${
                  currentPath === item.to
                    ? "scale-110"
                    : "group-hover:scale-110"
                }`}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>

                  {/* Badge for notifications */}
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center animate-pulse">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}

              {/* Badge for collapsed state */}
              {collapsed && item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}

              {/* Active indicator */}
              {currentPath === item.to && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* Collapse button */}
        <div className="px-4 pb-2">
          <button
            className={`w-full flex items-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 ${
              collapsed ? "justify-center" : "justify-center"
            }`}
            onClick={handleCollapseToggle}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-200 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
            {!collapsed && <span>Thu gọn</span>}
          </button>
        </div>

        {/* Footer */}
        {!collapsed && (
          <footer className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
            <div className="mb-2">
              &copy; {new Date().getFullYear()} Chat App
            </div>
            <div className="flex justify-center gap-4">
              <a
                href="/privacy"
                className="hover:text-gray-600 transition-colors"
              >
                Quyền riêng tư
              </a>
              <a
                href="/terms"
                className="hover:text-gray-600 transition-colors"
              >
                Điều khoản
              </a>
            </div>
          </footer>
        )}
      </aside>

      {/* Demo content area */}
      <div className="flex-1 p-8 bg-gray-50">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Improved React Sidebar Component
          </h1>
          <p className="text-gray-600 mb-4">
            Click the collapse button to see the sidebar transform into a
            compact mode. The component maintains all functionality while
            adapting to different screen sizes.
          </p>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h2 className="font-semibold mb-2">Key Improvements:</h2>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Proper Lucide React icons instead of CSS icons</li>
              <li>
                • Memoized callbacks with useCallback for better performance
              </li>
              <li>• Improved collapsed state handling</li>
              <li>• Better accessibility with proper ARIA attributes</li>
              <li>• Enhanced visual design with modern styling</li>
              <li>• Optimized badge positioning for collapsed state</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
