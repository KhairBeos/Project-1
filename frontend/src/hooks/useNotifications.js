import { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios.js";

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axiosInstance.get("/api/notifications");
        setNotifications(response.data);
      } catch (error) {
        setError("Không thể tải thông báo.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await axiosInstance.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      setError("Không thể đánh dấu tất cả thông báo đã đọc.");
    }
  };

  const markRead = async (id) => {
    try {
      await axiosInstance.patch(`/api/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      setError("Không thể đánh dấu thông báo đã đọc.");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      setError("Không thể xóa thông báo.");
    }
  };

  return {
    notifications,
    loading,
    error,
    markAllRead,
    markRead,
    deleteNotification,
  };
};

export default useNotifications;
