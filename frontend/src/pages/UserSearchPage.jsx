import { useState } from "react";
import { searchAll, sendFriendRequest, requestJoinGroup } from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";
import useAuthUser from "../hooks/useAuthUser.js";
import { useNavigate } from "react-router-dom";

// Trang tìm kiếm người dùng
const UserSearchPage = () => {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [groupResults, setGroupResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [requestedGroups, setRequestedGroups] = useState([]); // lưu groupId đã gửi yêu cầu
  const { authUser } = useAuthUser();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Giả định authUser.friends là mảng id bạn bè, authUser.groups là mảng id group
  const isFriend = (userId) => authUser?.friends?.includes(userId);
  const isMe = (userId) => userId === authUser?._id;
  const isGroupMember = (groupId) => authUser?.groups?.includes(groupId);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setUserResults([]);
    setGroupResults([]);
    try {
      const { users = [], groups = [] } = await searchAll(query.trim());
      setUserResults(users);
      setGroupResults(groups);
      if (users.length === 0 && groups.length === 0)
        setError("Không tìm thấy kết quả phù hợp.");
    } catch (err) {
      setError("Lỗi khi tìm kiếm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setSendingId(userId);
    try {
      await sendFriendRequest(userId);
      addToast({ message: "Đã gửi lời mời kết bạn!", type: "success" });
    } catch (err) {
      addToast({
        message:
          "Không thể gửi lời mời. Có thể đã gửi trước đó hoặc đã là bạn bè.",
        type: "error",
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setJoiningGroupId(groupId);
    try {
      await requestJoinGroup(groupId);
      setRequestedGroups((prev) => [...prev, groupId]);
      addToast({ message: "Đã gửi yêu cầu xin vào nhóm!", type: "success" });
    } catch (err) {
      addToast({
        message: "Không thể gửi yêu cầu xin vào nhóm.",
        type: "error",
      });
    } finally {
      setJoiningGroupId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">
        Tìm kiếm người dùng & nhóm
      </h1>
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          placeholder="Nhập tên, email, tài khoản hoặc tên nhóm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
          disabled={loading}
        >
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>
      </form>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
          {error}
        </div>
      )}
      {/* Kết quả người dùng */}
      {userResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Người dùng
          </h2>
          <div className="space-y-4">
            {userResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <img
                  src={user.profilePic || "/vite.svg"}
                  alt={user.fullName || user.account}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {user.fullName || user.account}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">
                    {user.nationality}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="px-4 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors mr-2"
                >
                  Xem hồ sơ
                </button>
                <button
                  onClick={() => handleSendRequest(user._id)}
                  disabled={
                    isMe(user._id) ||
                    isFriend(user._id) ||
                    sendingId === user._id
                  }
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMe(user._id)
                    ? "Đây là bạn"
                    : isFriend(user._id)
                    ? "Đã là bạn bè"
                    : sendingId === user._id
                    ? "Đang gửi..."
                    : "Kết bạn"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Kết quả nhóm */}
      {groupResults.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Nhóm</h2>
          <div className="space-y-4">
            {groupResults.map((group) => (
              <div
                key={group._id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <img
                  src={group.avatar || "/vite.svg"}
                  alt={group.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {group.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {group.description}
                  </div>
                  <div className="text-xs text-gray-400">
                    {group.members?.length || 0} thành viên
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/groups/${group._id}`)}
                  className="px-4 py-2 text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors mr-2"
                >
                  Xem nhóm
                </button>
                <button
                  onClick={() => handleJoinGroup(group._id)}
                  disabled={
                    isGroupMember(group._id) ||
                    joiningGroupId === group._id ||
                    requestedGroups.includes(group._id)
                  }
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGroupMember(group._id)
                    ? "Đã là thành viên"
                    : requestedGroups.includes(group._id)
                    ? "Đã gửi yêu cầu"
                    : joiningGroupId === group._id
                    ? "Đang gửi..."
                    : "Xin tham gia nhóm"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearchPage;
