import {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";

// Context for layout state management
const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

// Custom hook for theme management
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      );
    }
    return "light";
  });

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return { theme, toggleTheme };
};

// Custom hook for avatar management
const useAvatar = (user) => {
  const [avatarError, setAvatarError] = useState(false);

  const getFallbackAvatar = useCallback((user) => {
    const name = user?.fullName || user?.account || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=random&color=ffffff`;
  }, []);

  const handleAvatarError = useCallback(
    (e) => {
      if (!avatarError && user) {
        setAvatarError(true);
        e.target.src = getFallbackAvatar(user);
      }
    },
    [avatarError, user, getFallbackAvatar]
  );

  const avatarSrc = avatarError
    ? getFallbackAvatar(user)
    : user?.avatar || getFallbackAvatar(user);

  return { avatarSrc, handleAvatarError };
};

// Custom hook for click outside
const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

// User Avatar Component
const UserAvatar = ({
  user,
  size = "w-8 h-8",
  showOnlineStatus = false,
  className = "",
}) => {
  const { avatarSrc, handleAvatarError } = useAvatar(user);

  return (
    <div className={`relative ${className}`}>
      <img
        src={avatarSrc}
        alt={`Avatar of ${user?.fullName || user?.account || "User"}`}
        className={`${size} rounded-full object-cover border-2 border-gray-300 transition-all duration-200`}
        onError={handleAvatarError}
        loading="lazy"
      />
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
};

// Notification Badge Component
const NotificationBadge = ({ count, className = "" }) => {
  if (count <= 0) return null;

  return (
    <span
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center font-medium ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

// Optimized Navbar Component
const Navbar = () => {
  const { authUser, logout, loading } = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapse, toggleSidebar } =
    useLayout();
  const { theme, toggleTheme } = useTheme();

  // States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Refs
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout?.();
      setIsDropdownOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate]);

  // Dropdown menu items
  const dropdownItems = useMemo(
    () => [
      { label: "Profile", to: "/profile", icon: "👤" },
      { label: "Settings", to: "/settings", icon: "⚙️" },
      { label: "Help", to: "/help", icon: "❓" },
    ],
    []
  );

  const LoadingSkeleton = () => (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
      <div className="w-20 h-4 bg-gray-300 rounded animate-pulse hidden md:block"></div>
    </div>
  );

  return (
    <nav className="w-full h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-50 shadow-sm">
      {/* Left side - Logo & Sidebar toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <span className="text-xl">☰</span>
        </button>

        {/* Desktop sidebar collapse button */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors mr-1"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            className={`text-lg transition-transform duration-200 ${
              sidebarCollapsed ? "rotate-180" : ""
            }`}
          >
            ◀
          </span>
        </button>

        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl hover:text-blue-600 transition-colors duration-200"
        >
          <span className="text-2xl text-blue-600">💬</span>
          <span className="hidden sm:inline">Chat App</span>
        </Link>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Toggle theme"
        >
          <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>

        {loading ? (
          <LoadingSkeleton />
        ) : authUser ? (
          <>
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative flex items-center justify-center hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
              aria-label={`Notifications${
                notificationCount > 0 ? ` (${notificationCount} new)` : ""
              }`}
            >
              <span className="text-lg">🔔</span>
              <NotificationBadge count={notificationCount} />
            </Link>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200"
                aria-label="User menu"
                aria-expanded={isDropdownOpen}
              >
                <UserAvatar user={authUser} showOnlineStatus />
                <span className="font-medium text-sm hidden md:inline max-w-32 truncate">
                  {authUser.fullName || authUser.account}
                </span>
                <span
                  className={`text-sm transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={authUser}
                        size="w-10 h-10"
                        showOnlineStatus
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {authUser.fullName || authUser.account}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
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
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <span className="text-lg">
                      {isLoggingOut ? "⏳" : "🚪"}
                    </span>
                    <span className="text-sm">
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Menu Item Component
const MenuItem = ({ item, currentPath, collapsed, onClick }) => {
  const isActive = currentPath === item.to;

  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-6 py-3 my-1 mx-2 rounded-lg transition-all duration-200 font-medium hover:bg-gray-100 group ${
        isActive
          ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
          : "text-gray-700 hover:text-gray-900"
      } ${collapsed ? "justify-center px-3" : ""}`}
    >
      <span className="text-lg">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          <NotificationBadge count={item.badge} />
        </>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
      )}
    </Link>
  );
};

// Optimized Sidebar Component
const SideBar = ({ collapsed = false, mobile = false, onClose }) => {
  const { authUser, loading } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  const menu = useMemo(
    () => [
      { label: "Home", to: "/", icon: "🏠" },
      { label: "Chat", to: "/chat", icon: "💬", badge: 3 },
      { label: "Friends", to: "/friends", icon: "👥" },
      { label: "Groups", to: "/groups", icon: "👨‍👩‍👧‍👦" },
      { label: "Notifications", to: "/notifications", icon: "🔔", badge: 5 },
      { label: "Profile", to: "/profile", icon: "👤" },
    ],
    []
  );

  const sidebarClasses = mobile
    ? "fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 w-64 bg-white border-r border-gray-200 lg:hidden shadow-lg"
    : `${
        collapsed ? "w-16" : "w-64"
      } bg-white border-r border-gray-200 hidden lg:flex flex-col h-screen sticky top-0 shadow-sm transition-all duration-300`;

  const LoadingSkeleton = () => (
    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
      <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3 animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <aside className={sidebarClasses}>
      {/* Logo & App name (hidden when collapsed) */}
      {!collapsed && !mobile && (
        <div className="p-5 border-b border-gray-200">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-lg hover:text-blue-600 transition-colors duration-200"
          >
            <span className="text-2xl text-blue-600">💬</span>
            Chat App
          </Link>
        </div>
      )}

      {/* User info */}
      {!collapsed && (
        <>
          {loading ? (
            <LoadingSkeleton />
          ) : authUser ? (
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50/50">
              <UserAvatar user={authUser} size="w-10 h-10" showOnlineStatus />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {authUser.fullName || authUser.account}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {authUser.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-200">
              <Link
                to="/login"
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center block"
              >
                Login
              </Link>
            </div>
          )}
        </>
      )}

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menu.map((item) => (
          <MenuItem
            key={item.to}
            item={item}
            currentPath={currentPath}
            collapsed={collapsed}
            onClick={mobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <footer className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          <div className="mb-2">&copy; {new Date().getFullYear()} Chat App</div>
          <div className="flex justify-center gap-4">
            <a
              href="/privacy"
              className="hover:text-gray-600 transition-colors"
            >
              Privacy
            </a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">
              Terms
            </a>
          </div>
        </footer>
      )}
    </aside>
  );
};

// Breadcrumb Component
const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const breadcrumbMap = {
    "": "Home",
    chat: "Chat",
    friends: "Friends",
    groups: "Groups",
    notifications: "Notifications",
    profile: "Profile",
    settings: "Settings",
  };

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
          >
            <span className="mr-2">🏠</span>
            Home
          </Link>
        </li>
        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={pathname}>
              <div className="flex items-center">
                <span className="mx-1 text-gray-400">▶</span>
                {isLast ? (
                  <span className="text-sm font-medium text-blue-600">
                    {breadcrumbMap[pathname] || pathname}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {breadcrumbMap[pathname] || pathname}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Footer Component
const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-auto">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-blue-600">💬</span>
          <span className="font-semibold">Chat App</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500">
          <a href="/privacy" className="hover:text-blue-600 transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-blue-600 transition-colors">
            Terms
          </a>
          <a href="/support" className="hover:text-blue-600 transition-colors">
            Support
          </a>
        </div>

        <div className="text-sm text-gray-500">
          © {new Date().getFullYear()} Chat App. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

// Scroll to Top Button
const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    const handleScroll = () => {
      requestAnimationFrame(toggleVisibility);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
      aria-label="Scroll to top"
    >
      <span className="text-lg">▲</span>
    </button>
  );
};

// Main Layout Component
const Layout = () => {
  const { authUser, loading } = useAuthUser();
  const location = useLocation();

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true";
    }
    return false;
  });

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Handle initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
    }
  }, [sidebarCollapsed]);

  // Toggle functions
  const toggleSidebar = useCallback(
    () => setIsSidebarOpen(!isSidebarOpen),
    [isSidebarOpen]
  );
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebarCollapse = useCallback(
    () => setSidebarCollapsed(!sidebarCollapsed),
    [sidebarCollapsed]
  );

  // Layout context value
  const layoutContextValue = useMemo(
    () => ({
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      sidebarCollapsed,
      toggleSidebarCollapse,
    }),
    [
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      sidebarCollapsed,
      toggleSidebarCollapse,
    ]
  );

  // Loading screen
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Navbar */}
        <Navbar />

        <div className="flex flex-1 relative">
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
              onClick={closeSidebar}
              aria-label="Close menu"
            />
          )}

          {/* Desktop Sidebar */}
          <SideBar collapsed={sidebarCollapsed} />

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
            <div
              className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 lg:hidden"
              style={{
                transform: isSidebarOpen
                  ? "translateX(0)"
                  : "translateX(-100%)",
              }}
            >
              <SideBar mobile onClose={closeSidebar} />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 bg-white transition-all duration-300">
            <div className="h-full overflow-auto">
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Breadcrumb */}
                <Breadcrumb />

                {/* Main Content Area */}
                <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-12rem)] p-6">
                  <div className="text-center py-20">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                      Welcome to Chat App
                    </h1>
                    <p className="text-gray-600 mb-8">
                      A modern chat application built with React
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                      <Link
                        to="/chat"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Chatting
                      </Link>
                      <Link
                        to="/friends"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Find Friends
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />

        {/* Scroll to Top Button */}
        <ScrollToTopButton />
      </div>

      <style>{`
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
    </LayoutContext.Provider>
  );
};

export default Layout;
