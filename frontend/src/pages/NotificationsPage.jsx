import { useEffect} from "react";
import {
  Bell,
  CheckCheck,
  Users,
  UserPlus,
  MessageCircle,
  Heart,
  Gift,
  Trash2,
  Eye,
} from "lucide-react";
import useNotifications from "../hooks/useNotifications.js";
import useSocket from "../hooks/useSocket.js";
import { useToast } from "../components/Toast.jsx";
import PageLoader from "../components/PageLoader.jsx";
import ErrorPage from "../components/ErrorPage.jsx";

const NotificationsPage = () => {
  const {
    notifications,
    loading,
    error,
    markAllRead,
    markRead,
    deleteNotification,
    setNotifications,
  } = useNotifications();

  const socket = useSocket();
  const { addToast } = useToast();

  useEffect(() => {
    const handleNewNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      addToast({ message: newNotification.content, type: "notification" });
    };
    socket.on("notification", handleNewNotification);
    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket, setNotifications, addToast]);

  // Hiển thị toast khi có lỗi API
  useEffect(() => {
    if (error) {
      addToast({ message: error, type: "error" });
    }
  }, [error, addToast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type) => {
    const iconProps = "w-5 h-5";
    switch (type) {
      case "friend_request":
        return <UserPlus className={`${iconProps} text-blue-600`} />;
      case "group_invite":
        return <Users className={`${iconProps} text-green-600`} />;
      case "message":
        return <MessageCircle className={`${iconProps} text-purple-600`} />;
      case "like":
        return <Heart className={`${iconProps} text-red-500`} />;
      case "gift":
        return <Gift className={`${iconProps} text-yellow-600`} />;
      default:
        return <Bell className={`${iconProps} text-indigo-600`} />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  };

  if (loading) return <PageLoader />;

  if (error) {
    // Hiển thị cả ErrorPage và Toast báo lỗi
    return (
      <>
        <ErrorPage message={error} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-8 px-4">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Thông báo
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý tất cả thông báo của bạn
                </p>
              </div>
              {unreadCount > 0 && (
                <div className="ml-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full px-3 py-1 shadow-lg">
                  {unreadCount > 99 ? "99+" : unreadCount} mới
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <CheckCheck className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>
        {/* Notifications List */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Chưa có thông báo nào
              </h3>
              <p className="text-gray-500">
                Các thông báo mới sẽ xuất hiện tại đây
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`p-6 transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-indigo-50/50 ${
                    !notification.read
                      ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-l-purple-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        !notification.read
                          ? "bg-gradient-to-br from-purple-100 to-indigo-100 shadow-md"
                          : "bg-gray-100"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium leading-relaxed ${
                          !notification.read ? "text-gray-800" : "text-gray-600"
                        }`}
                      >
                        {notification.content}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </span>
                        {!notification.read && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                            Mới
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markRead(notification._id)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          title="Đánh dấu đã đọc"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Statistics Card */}
        {notifications.length > 0 && (
          <div className="mt-6 bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {notifications.length}
                </div>
                <div className="text-sm text-gray-600">Tổng thông báo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {unreadCount}
                </div>
                <div className="text-sm text-gray-600">Chưa đọc</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.length - unreadCount}
                </div>
                <div className="text-sm text-gray-600">Đã đọc</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
