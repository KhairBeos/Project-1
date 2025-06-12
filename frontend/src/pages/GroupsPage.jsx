import { useEffect, useState, useCallback, useMemo } from "react";
import { getMyGroups, leaveGroup, createGroup } from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";
import {
  Users,
  Plus,
  Search,
  Filter,
  LogOut,
  MessageCircle,
} from "lucide-react";
import useSocket from "../hooks/useSocket.js";

const getGroupStatus = (group) => {
  // Đơn giản: nếu có thành viên online thì online, nếu có hoạt động gần đây thì recent, còn lại offline
  const now = new Date();
  let online = 0,
    recent = 0;
  (group.members || []).forEach((m) => {
    if (!m.lastActive) return;
    const diff = (now - new Date(m.lastActive)) / 60000;
    if (diff < 5) online++;
    else if (diff < 60) recent++;
  });
  if (online > 0)
    return { status: "online", text: `${online} online`, color: "green" };
  if (recent > 0)
    return {
      status: "recent",
      text: `${recent} vừa hoạt động`,
      color: "yellow",
    };
  return { status: "offline", text: "Offline", color: "gray" };
};

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();
  const socket = useSocket();

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await getMyGroups();
        setGroups(res.groups || []);
      } catch (err) {
        addToast({ message: "Không thể tải danh sách nhóm.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [addToast]);

  // Realtime: lắng nghe event socket liên quan group
  useEffect(() => {
    if (!socket) return;
    const handleUpdateGroups = () => {
      getMyGroups().then((res) => setGroups(res.groups || []));
    };
    socket.on("group_invite", handleUpdateGroups);
    socket.on("group_invite_accepted", handleUpdateGroups);
    socket.on("group_member_left", handleUpdateGroups);
    socket.on("group_removed", handleUpdateGroups);
    // Cleanup
    return () => {
      socket.off("group_invite", handleUpdateGroups);
      socket.off("group_invite_accepted", handleUpdateGroups);
      socket.off("group_member_left", handleUpdateGroups);
      socket.off("group_removed", handleUpdateGroups);
    };
  }, [socket]);

  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groups.filter((g) => {
      const name = (g.name || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return !searchTerm || name.includes(search);
    });
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "recent":
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        case "members":
          return (b.members?.length || 0) - (a.members?.length || 0);
        default:
          return 0;
      }
    });
    return filtered;
  }, [groups, searchTerm, sortBy]);

  const handleLeaveGroup = useCallback(
    async (groupId) => {
      try {
        await leaveGroup(groupId);
        setGroups((prev) => prev.filter((g) => g._id !== groupId));
        addToast({ message: "Đã rời nhóm thành công.", type: "success" });
        setShowConfirmDialog(null);
      } catch (err) {
        addToast({ message: "Rời nhóm thất bại.", type: "error" });
      }
    },
    [addToast]
  );

  const handleGoToChat = useCallback((groupId) => {
    window.history.pushState(null, "", `/chat?group=${groupId}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const handleCreateGroup = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleSubmitCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      addToast({ message: "Vui lòng nhập tên nhóm.", type: "error" });
      return;
    }
    setCreating(true);
    try {
      const res = await createGroup({ name: newGroupName });
      addToast({ message: "Tạo nhóm thành công!", type: "success" });
      setShowCreateModal(false);
      setNewGroupName("");
      // Chuyển sang chat nhóm vừa tạo
      window.history.pushState(null, "", `/chat?group=${res.group._id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err) {
      addToast({ message: "Tạo nhóm thất bại.", type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleImageError = useCallback((e) => {
    e.target.src = "/vite.svg";
  }, []);

  // Status Badge
  const StatusBadge = ({ status }) => {
    const colors = {
      green: "bg-green-400",
      yellow: "bg-yellow-400",
      gray: "bg-gray-400",
    };
    return (
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${colors[status.color]} ${
            status.status === "online" ? "animate-pulse" : ""
          }`}
        ></div>
        <span className="text-xs text-gray-500">{status.text}</span>
      </div>
    );
  };

  // Confirm Dialog
  const ConfirmDialog = ({ group, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Xác nhận rời nhóm
        </h3>
        <p className="text-gray-600 mb-6">
          Bạn có chắc chắn muốn rời khỏi nhóm <strong>{group.name}</strong>?
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(group._id)}
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

  if (groups.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-10 px-4">
        <div className="text-center py-20">
          <div className="text-8xl mb-6">👥</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">
            Chưa có nhóm nào
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Hãy tạo nhóm mới để bắt đầu trò chuyện cùng bạn bè!
          </p>
          <button
            onClick={handleCreateGroup}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Tạo nhóm mới
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
              Danh sách nhóm chat
            </h2>
          </div>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo nhóm mới</span>
          </button>
        </div>
        <p className="text-gray-600">
          {filteredAndSortedGroups.length !== groups.length
            ? `Hiển thị ${filteredAndSortedGroups.length} trong tổng số ${groups.length} nhóm`
            : `Tổng cộng ${groups.length} nhóm`}
        </p>
      </div>
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhóm theo tên..."
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
            <option value="recent">Hoạt động gần đây</option>
            <option value="members">Số thành viên</option>
          </select>
        </div>
      </div>
      {/* Groups List */}
      <div className="space-y-4">
        {filteredAndSortedGroups.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Thử từ khóa khác"
                : "Không có nhóm nào trong danh mục này"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedGroups.map((group) => {
            const status = getGroupStatus(group);
            return (
              <div
                key={group._id}
                className="flex items-center gap-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all duration-200"
              >
                <div className="relative">
                  <img
                    src={group.avatar || "/vite.svg"}
                    alt={group.name + " avatar"}
                    onError={handleImageError}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  {status.status === "online" && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-lg truncate mb-1">
                    {group.name}
                  </div>
                  <div className="text-gray-500 truncate mb-2">
                    {group.members?.length || 0} thành viên
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleGoToChat(group._id)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
                    aria-label={`Vào chat nhóm ${group.name}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Vào chat</span>
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(group)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
                    aria-label={`Rời nhóm ${group.name}`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Rời nhóm</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          group={showConfirmDialog}
          onConfirm={handleLeaveGroup}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}
      {/* Modal tạo nhóm mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmitCreateGroup}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tạo nhóm mới
            </h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all mb-4"
              placeholder="Nhập tên nhóm..."
              disabled={creating}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={creating}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-60"
                disabled={creating}
              >
                {creating ? "Đang tạo..." : "Tạo nhóm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
