import { useEffect, useState } from "react";
import {
  getBlockedUsers,
  unblockUser,
  getBlockedGroups,
  unblockGroup,
} from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";
import PageLoader from "../components/PageLoader.jsx";

// Trang quản lý người dùng & group bị block
const BlockedUsersPage = () => {
  const [blocked, setBlocked] = useState([]); // user
  const [blockedGroups, setBlockedGroups] = useState([]); // group
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unblockingId, setUnblockingId] = useState(null);
  const [unblockingGroupId, setUnblockingGroupId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchBlocked = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getBlockedUsers();
        setBlocked(res.users || []);
        const resGroup = await getBlockedGroups();
        setBlockedGroups(resGroup.groups || []);
      } catch (err) {
        setError("Không thể tải danh sách bị chặn.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlocked();
  }, []);

  const handleUnblock = async (userId) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u._id !== userId));
      addToast({ message: "Đã bỏ chặn người dùng!", type: "success" });
    } catch (err) {
      addToast({ message: "Bỏ chặn thất bại.", type: "error" });
    } finally {
      setUnblockingId(null);
    }
  };

  const handleUnblockGroup = async (groupId) => {
    setUnblockingGroupId(groupId);
    try {
      await unblockGroup(groupId);
      setBlockedGroups((prev) => prev.filter((g) => g._id !== groupId));
      addToast({ message: "Đã bỏ chặn nhóm!", type: "success" });
    } catch (err) {
      addToast({ message: "Bỏ chặn nhóm thất bại.", type: "error" });
    } finally {
      setUnblockingGroupId(null);
    }
  };

  if (loading) return <PageLoader />;
  if (error)
    return (
      <div className="max-w-xl mx-auto mt-10 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
          {error}
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
        Danh sách bị chặn
      </h1>
      {/* Blocked Users */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">
        Người dùng bị chặn
      </h2>
      {blocked.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Bạn chưa chặn ai.</div>
      ) : (
        <div className="space-y-4 mb-8">
          {blocked.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <img
                src={user.profilePic || "/vite.svg"}
                alt={user.fullName || user.account}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">
                  {user.fullName || user.account}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
              <button
                onClick={() => handleUnblock(user._id)}
                disabled={unblockingId === user._id}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unblockingId === user._id ? "Đang bỏ chặn..." : "Bỏ chặn"}
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Blocked Groups */}
      <h2 className="text-xl font-semibold text-gray-700 mb-4 mt-8">
        Nhóm bị chặn
      </h2>
      {blockedGroups.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Bạn chưa chặn nhóm nào.
        </div>
      ) : (
        <div className="space-y-4">
          {blockedGroups.map((group) => (
            <div
              key={group._id}
              className="flex items-center gap-4 p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <img
                src={group.avatar || "/vite.svg"}
                alt={group.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">
                  {group.name}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {group.description}
                </div>
              </div>
              <button
                onClick={() => handleUnblockGroup(group._id)}
                disabled={unblockingGroupId === group._id}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unblockingGroupId === group._id
                  ? "Đang bỏ chặn..."
                  : "Bỏ chặn"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUsersPage;
