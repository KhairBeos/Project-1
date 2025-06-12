import { useEffect, useState, useCallback, useMemo } from "react";
import { getFriends, removeFriend, createOrGetDirectChat } from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";
import {
  MessageCircle,
  UserMinus,
  Search,
  Users,
  Filter,
  UserPlus,
  Wifi,
  WifiOff,
  Clock,
  Circle,
} from "lucide-react";
import useSocket from "../hooks/useSocket.js";

// Utility function để tính trạng thái hoạt động
const getActivityStatus = (lastActive) => {
  if (!lastActive)
    return { status: "offline", text: "Không xác định", color: "gray" };

  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffInMinutes = Math.floor((now - lastActiveDate) / (1000 * 60));

  if (diffInMinutes < 5)
    return { status: "online", text: "Đang hoạt động", color: "green" };
  if (diffInMinutes < 30)
    return {
      status: "recent",
      text: `${diffInMinutes} phút trước`,
      color: "yellow",
    };
  if (diffInMinutes < 60)
    return { status: "recent", text: "Vừa hoạt động", color: "yellow" };
  if (diffInMinutes < 1440) {
    // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return { status: "away", text: `${hours} giờ trước`, color: "orange" };
  }
  const days = Math.floor(diffInMinutes / 1440);
  return { status: "offline", text: `${days} ngày trước`, color: "gray" };
};

// Trang quản lý bạn bè nâng cao
const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [statusFilter, setStatusFilter] = useState("all"); // all, online, offline, recent
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const { addToast } = useToast();
  const socket = useSocket();

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await getFriends();
        setFriends(res.friends || []);
      } catch (error) {
        console.error("Lỗi tải danh sách bạn bè:", error);
        addToast({ message: "Không thể tải danh sách bạn bè.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [addToast]);

  // Realtime: lắng nghe event socket khi có thay đổi danh sách bạn bè
  useEffect(() => {
    if (!socket) return;
    const handleUpdateFriends = () => {
      // Gọi lại API để cập nhật danh sách bạn bè
      getFriends().then((res) => setFriends(res.friends || []));
    };
    socket.on("friend_request_accepted", handleUpdateFriends);
    socket.on("friend_removed", handleUpdateFriends);
    // Cleanup
    return () => {
      socket.off("friend_request_accepted", handleUpdateFriends);
      socket.off("friend_removed", handleUpdateFriends);
    };
  }, [socket]);

  // Tính toán thống kê bạn bè
  const friendsStats = useMemo(() => {
    const stats = {
      total: friends.length,
      online: 0,
      recent: 0,
      away: 0,
      offline: 0,
    };

    friends.forEach((friend) => {
      const activity = getActivityStatus(friend.lastActive);
      switch (activity.status) {
        case "online":
          stats.online++;
          break;
        case "recent":
          stats.recent++;
          break;
        case "away":
          stats.away++;
          break;
        default:
          stats.offline++;
      }
    });

    return stats;
  }, [friends]);

  // Tìm kiếm, lọc và sắp xếp bạn bè
  const filteredAndSortedFriends = useMemo(() => {
    let filtered = friends.filter((friend) => {
      // Tìm kiếm
      const name = (friend.fullName || friend.account || "").toLowerCase();
      const email = (friend.email || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm || name.includes(search) || email.includes(search);

      // Lọc theo trạng thái
      if (statusFilter === "all") return matchesSearch;

      const activity = getActivityStatus(friend.lastActive);
      const matchesStatus =
        (statusFilter === "online" && activity.status === "online") ||
        (statusFilter === "recent" &&
          (activity.status === "recent" || activity.status === "away")) ||
        (statusFilter === "offline" && activity.status === "offline");

      return matchesSearch && matchesStatus;
    });

    // Sắp xếp
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.fullName || a.account || "").localeCompare(
            b.fullName || b.account || ""
          );
        case "email":
          return (a.email || "").localeCompare(b.email || "");
        case "activity":
          const aActivity = getActivityStatus(a.lastActive);
          const bActivity = getActivityStatus(b.lastActive);
          const statusOrder = { online: 0, recent: 1, away: 2, offline: 3 };
          return statusOrder[aActivity.status] - statusOrder[bActivity.status];
        case "recent":
          return new Date(b.lastActive || 0) - new Date(a.lastActive || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [friends, searchTerm, sortBy, statusFilter]);

  const handleRemove = useCallback(
    async (friendId) => {
      try {
        await removeFriend(friendId);
        setFriends((prev) => prev.filter((f) => f._id !== friendId));
        addToast({ message: "Đã hủy kết bạn thành công.", type: "success" });
        setShowConfirmDialog(null);
      } catch (error) {
        console.error("Lỗi hủy kết bạn:", error);
        addToast({
          message: "Hủy kết bạn thất bại. Vui lòng thử lại.",
          type: "error",
        });
      }
    },
    [addToast]
  );

  const handleStartChat = useCallback(
    async (friendId) => {
      try {
        // Gọi API /groups/direct để đảm bảo có group 1-1
        await createOrGetDirectChat({ userB: friendId });
        // Sau đó chuyển hướng sang trang chat 1-1 (giữ nguyên logic cũ)
        window.history.pushState(null, "", `/chat?user=${friendId}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (err) {
        addToast({ message: "Không thể mở chat 1-1.", type: "error" });
      }
    },
    [addToast]
  );

  const handleFindFriends = useCallback(() => {
    window.history.pushState(null, "", "/find-friends");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const handleImageError = useCallback((e) => {
    e.target.src = "/vite.svg";
  }, []);

  // Status Badge Component
  const StatusBadge = ({ status, text, showText = true }) => {
    const colors = {
      green: "bg-green-400",
      yellow: "bg-yellow-400",
      orange: "bg-orange-400",
      gray: "bg-gray-400",
    };

    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${colors[status.color]} ${
            status.status === "online" ? "animate-pulse" : ""
          }`}
        ></div>
        {showText && (
          <span className="text-xs text-gray-500">{status.text}</span>
        )}
      </div>
    );
  };

  // Stats Card Component
  const StatsCard = ({
    icon: Icon,
    label,
    count,
    color,
    isActive,
    onClick,
  }) => (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
        isActive
          ? `border-${color}-300 bg-${color}-50`
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-5 h-5 ${
            isActive ? `text-${color}-600` : "text-gray-500"
          }`}
        />
        <div className="text-left">
          <div className="text-sm text-gray-600">{label}</div>
          <div
            className={`text-lg font-semibold ${
              isActive ? `text-${color}-700` : "text-gray-800"
            }`}
          >
            {count}
          </div>
        </div>
      </div>
    </button>
  );

  // Confirmation Dialog Component
  const ConfirmDialog = ({ friend, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Xác nhận hủy kết bạn
        </h3>
        <p className="text-gray-600 mb-6">
          Bạn có chắc chắn muốn hủy kết bạn với{" "}
          <strong>{friend.fullName || friend.account}</strong>? Hành động này
          không thể hoàn tác.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(friend._id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <div className="mb-8">
          <div className="h-8 bg-gray-300 rounded w-64 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-96 mb-6 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-300 rounded-xl animate-pulse"
              ></div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl animate-pulse"
            >
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded w-40 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-24 h-10 bg-gray-300 rounded-lg"></div>
                <div className="w-24 h-10 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <div className="text-center py-20">
          <div className="text-8xl mb-6">🤝</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">
            Chưa có bạn bè nào
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Hãy tìm kiếm và kết bạn với mọi người để bắt đầu trò chuyện thú vị!
          </p>
          <button
            onClick={handleFindFriends}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
          >
            <UserPlus className="w-5 h-5" />
            Tìm bạn bè
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-purple-700">
              Danh sách bạn bè
            </h2>
            {friendsStats.online > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <Circle className="w-2 h-2 fill-current animate-pulse" />
                {friendsStats.online} đang online
              </div>
            )}
          </div>
          <button
            onClick={handleFindFriends}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tìm bạn bè</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={Users}
            label="Tất cả"
            count={friendsStats.total}
            color="purple"
            isActive={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatsCard
            icon={Wifi}
            label="Đang online"
            count={friendsStats.online}
            color="green"
            isActive={statusFilter === "online"}
            onClick={() => setStatusFilter("online")}
          />
          <StatsCard
            icon={Clock}
            label="Vừa hoạt động"
            count={friendsStats.recent + friendsStats.away}
            color="yellow"
            isActive={statusFilter === "recent"}
            onClick={() => setStatusFilter("recent")}
          />
          <StatsCard
            icon={WifiOff}
            label="Offline"
            count={friendsStats.offline}
            color="gray"
            isActive={statusFilter === "offline"}
            onClick={() => setStatusFilter("offline")}
          />
        </div>

        <p className="text-gray-600">
          {filteredAndSortedFriends.length !== friends.length
            ? `Hiển thị ${filteredAndSortedFriends.length} trong tổng số ${friends.length} bạn bè`
            : `Tổng cộng ${friends.length} bạn bè`}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white appearance-none cursor-pointer"
          >
            <option value="name">Sắp xếp theo tên</option>
            <option value="email">Sắp xếp theo email</option>
            <option value="activity">Sắp xếp theo hoạt động</option>
            <option value="recent">Hoạt động gần đây</option>
          </select>
        </div>
      </div>

      {/* Friends List */}
      <div className="space-y-4">
        {filteredAndSortedFriends.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Thử tìm kiếm với từ khóa khác"
                : "Không có bạn bè nào trong danh mục này"}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedFriends.map((friend) => {
            const activityStatus = getActivityStatus(friend.lastActive);
            return (
              <div
                key={friend._id}
                className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all duration-200"
              >
                <div className="relative">
                  <img
                    src={friend.profilePic || "/vite.svg"}
                    alt={`${friend.fullName || friend.account} avatar`}
                    onError={handleImageError}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  {activityStatus.status === "online" && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-lg truncate mb-1">
                    {friend.fullName || friend.account}
                  </div>
                  <div className="text-gray-500 truncate mb-2">
                    {friend.email}
                  </div>
                  <StatusBadge status={activityStatus} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleStartChat(friend._id)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
                    aria-label={`Nhắn tin với ${
                      friend.fullName || friend.account
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Nhắn tin</span>
                  </button>

                  <button
                    onClick={() => setShowConfirmDialog(friend)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
                    aria-label={`Hủy kết bạn với ${
                      friend.fullName || friend.account
                    }`}
                  >
                    <UserMinus className="w-4 h-4" />
                    <span className="hidden sm:inline">Hủy kết bạn</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          friend={showConfirmDialog}
          onConfirm={handleRemove}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}
    </div>
  );
};

export default FriendsPage;
