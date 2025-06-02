import { Link, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";

const SideBar = () => {
  const { authUser, loading } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const [avatarError, setAvatarError] = useState(false);

  // State: sidebar collapsed
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });

  // Toggle collapse
  const handleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", !prev);
      return !prev;
    });
  };

  // Memoize menu items để tránh re-render không cần thiết
  const menu = useMemo(
    () => [
      {
        label: "Trang chủ",
        to: "/",
        icon: <span className="i-lucide-home w-5 h-5" />,
      },
      {
        label: "Chat",
        to: "/chat",
        icon: <span className="i-lucide-message-circle w-5 h-5" />,
        badge: 3, // Số tin nhắn chưa đọc
      },
      {
        label: "Bạn bè",
        to: "/friends",
        icon: <span className="i-lucide-users w-5 h-5" />,
      },
      {
        label: "Nhóm",
        to: "/groups",
        icon: <span className="i-lucide-users-round w-5 h-5" />,
      },
      {
        label: "Thông báo",
        to: "/notifications",
        icon: <span className="i-lucide-bell w-5 h-5" />,
        badge: 5, // Số thông báo chưa đọc
      },
      {
        label: "Hồ sơ",
        to: "/profile",
        icon: <span className="i-lucide-user w-5 h-5" />,
      },
    ],
    []
  );

  // Generate fallback avatar URL
  const getFallbackAvatar = (user) => {
    const name = user?.fullName || user?.account || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random`;
  };

  // Handle avatar load error
  const handleAvatarError = (e) => {
    if (!avatarError) {
      setAvatarError(true);
      e.target.src = getFallbackAvatar(authUser);
    }
  };

  // Loading skeleton component
  const UserInfoSkeleton = () => (
    <div className="flex items-center gap-3 p-4 border-b border-base-300">
      <div className="w-10 h-10 bg-base-300 rounded-full animate-pulse"></div>
      <div className="flex-1">
        <div className="h-4 bg-base-300 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-base-300 rounded w-2/3 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <aside
      className={`w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0 shadow-sm transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo & App name */}
      <div className="p-5 border-b border-base-300">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold text-lg hover:text-primary transition-colors duration-200"
          aria-label="Chat App - Về trang chủ"
        >
          <span className="i-lucide-message-circle w-7 h-7 text-primary" />
          Chat App
        </Link>
      </div>

      {/* User info with loading state */}
      {loading ? (
        <UserInfoSkeleton />
      ) : authUser ? (
        <div className="flex items-center gap-3 p-4 border-b border-base-300 bg-base-100/50">
          <div className="relative">
            <img
              src={
                avatarError
                  ? getFallbackAvatar(authUser)
                  : authUser.avatar || getFallbackAvatar(authUser)
              }
              alt={`Ảnh đại diện của ${authUser.fullName || authUser.account}`}
              className="w-10 h-10 rounded-full border-2 border-base-300 object-cover"
              onError={handleAvatarError}
              loading="lazy"
            />
            {/* Online status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-base-200"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">
              {authUser.fullName || authUser.account}
            </div>
            <div className="text-xs text-base-content/60 truncate">
              {authUser.email}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-base-300">
          <Link to="/login" className="btn btn-primary btn-sm w-full">
            Đăng nhập
          </Link>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto" role="menu">
        {menu.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`relative flex items-center gap-3 px-6 py-3 my-1 mx-2 rounded-lg transition-all duration-200 font-medium hover:bg-base-300/80 hover:scale-[1.02] hover:shadow-sm group ${
              currentPath === item.to
                ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm"
                : "text-base-content/80 hover:text-base-content"
            }`}
            role="menuitem"
            aria-current={currentPath === item.to ? "page" : undefined}
          >
            <span
              className={`transition-transform duration-200 ${
                currentPath === item.to ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>

            {/* Badge for notifications */}
            {item.badge && item.badge > 0 && (
              <span className="bg-error text-error-content text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center animate-pulse">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}

            {/* Active indicator */}
            {currentPath === item.to && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>
            )}
          </Link>
        ))}
      </nav>

      {/* Collapse button for smaller screens & desktop */}
      <div className="px-4 pb-2">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-base-content/60 hover:text-base-content transition-colors duration-200"
          onClick={handleCollapse}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <span
            className={`i-lucide-chevron-left w-4 h-4 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
          {collapsed ? "Mở rộng" : "Thu gọn"}
        </button>
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-base-300 text-xs text-base-content/40 text-center">
        <div className="mb-2">&copy; {new Date().getFullYear()} Chat App</div>
        <div className="flex justify-center gap-4">
          <a
            href="/privacy"
            className="hover:text-base-content/60 transition-colors"
          >
            Quyền riêng tư
          </a>
          <a
            href="/terms"
            className="hover:text-base-content/60 transition-colors"
          >
            Điều khoản
          </a>
        </div>
      </footer>
    </aside>
  );
};

export default SideBar;
