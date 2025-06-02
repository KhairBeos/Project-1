import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import SideBar from "./SideBar";
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

const Layout = () => {
  const { authUser, loading } = useAuthUser();
  const location = useLocation();

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsSidebarOpen(false); // Close mobile sidebar on desktop
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
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Toggle sidebar functions
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  // Layout context value
  const layoutContextValue = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    sidebarCollapsed,
    toggleSidebarCollapse,
  };

  // Loading screen
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-base-content/60">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="flex flex-col min-h-screen bg-base-200">
        {/* Navbar */}
        <Navbar />

        <div className="flex flex-1 relative">
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
              onClick={closeSidebar}
              aria-label="Đóng menu"
            />
          )}

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <SideBar collapsed={sidebarCollapsed} />
          </aside>

          {/* Mobile Sidebar */}
          <aside
            className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transition-transform duration-300 lg:hidden ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <SideBar mobile onClose={closeSidebar} />
          </aside>

          {/* Main Content */}
          <main
            className={`flex-1 bg-base-100 transition-all duration-300 ${
              sidebarCollapsed ? "lg:ml-16" : "lg:ml-0"
            }`}
          >
            {/* Mobile Menu Button */}
            <div className="lg:hidden p-4 border-b border-base-300">
              <button
                onClick={toggleSidebar}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-base-200 transition-colors duration-200"
                aria-label="Mở menu"
              >
                <span className="i-lucide-menu w-5 h-5" />
                <span className="text-sm font-medium">Menu</span>
              </button>
            </div>

            {/* Page Content */}
            <div className="h-full overflow-auto">
              <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Breadcrumb */}
                <Breadcrumb />

                {/* Main Content Area */}
                <div className="bg-base-100 rounded-lg shadow-sm min-h-[calc(100vh-12rem)]">
                  <Outlet />
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
    </LayoutContext.Provider>
  );
};

// Breadcrumb Component
const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Breadcrumb mapping
  const breadcrumbMap = {
    "": "Trang chủ",
    chat: "Chat",
    friends: "Bạn bè",
    groups: "Nhóm",
    notifications: "Thông báo",
    profile: "Hồ sơ",
    settings: "Cài đặt",
  };

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <a
            href="/"
            className="inline-flex items-center text-sm font-medium text-base-content/60 hover:text-primary"
          >
            <span className="i-lucide-home w-4 h-4 me-2" />
            Trang chủ
          </a>
        </li>
        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <li key={pathname}>
              <div className="flex items-center">
                <span className="i-lucide-chevron-right w-4 h-4 text-base-content/40 mx-1" />
                {isLast ? (
                  <span className="text-sm font-medium text-primary">
                    {breadcrumbMap[pathname] || pathname}
                  </span>
                ) : (
                  <a
                    href={routeTo}
                    className="text-sm font-medium text-base-content/60 hover:text-primary"
                  >
                    {breadcrumbMap[pathname] || pathname}
                  </a>
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
  <footer className="bg-base-200 border-t border-base-300 py-6 mt-auto">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="i-lucide-message-circle w-5 h-5 text-primary" />
          <span className="font-semibold">Chat App</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-base-content/60">
          <a href="/privacy" className="hover:text-primary transition-colors">
            Quyền riêng tư
          </a>
          <a href="/terms" className="hover:text-primary transition-colors">
            Điều khoản
          </a>
          <a href="/support" className="hover:text-primary transition-colors">
            Hỗ trợ
          </a>
        </div>

        <div className="text-sm text-base-content/60">
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

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary text-primary-content rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
      aria-label="Cuộn lên đầu trang"
    >
      <span className="i-lucide-chevron-up w-6 h-6" />
    </button>
  );
};

export default Layout;
