import { useEffect, useState } from "react";
import {
  getFriendRequests,
  getOutgoingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getGroupInvitations,
  acceptGroupInvitation,
  rejectGroupInvitation,
} from "../lib/api.js";
import { useToast } from "../components/Toast.jsx";
import useSocket from "../hooks/useSocket.js";

const FriendRequestsPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [groupInvites, setGroupInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("incoming");
  const [processingIds, setProcessingIds] = useState(new Set());
  const [groupInviteLoading, setGroupInviteLoading] = useState(true);
  const [groupInviteError, setGroupInviteError] = useState("");
  const [processingGroupIds, setProcessingGroupIds] = useState(new Set());
  const { addToast } = useToast();
  const socket = useSocket();

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFriendRequests();
      setIncoming(res.incomingRequests || []);
      const out = await getOutgoingFriendRequests();
      setOutgoing(out || []);
    } catch (err) {
      setError("Không thể tải danh sách lời mời.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupInvites = async () => {
    setGroupInviteLoading(true);
    setGroupInviteError("");
    try {
      const res = await getGroupInvitations();
      setGroupInvites(res.invites || []);
    } catch {
      setGroupInviteError("Không thể tải lời mời nhóm.");
    } finally {
      setGroupInviteLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchGroupInvites();
  }, []);

  // Realtime: lắng nghe các event socket liên quan friend request & group invite
  useEffect(() => {
    if (!socket) return;
    // Friend request events
    const handleFriendRequest = () => fetchRequests();
    socket.on("friend_request", handleFriendRequest);
    socket.on("friend_request_accepted", handleFriendRequest);
    socket.on("friend_request_cancelled", handleFriendRequest);
    socket.on("friend_request_rejected", handleFriendRequest);
    // Group invite events
    const handleGroupInvite = () => fetchGroupInvites();
    socket.on("group_invite", handleGroupInvite);
    socket.on("group_invite_accepted", handleGroupInvite);
    socket.on("group_invite_rejected", handleGroupInvite);
    // Cleanup
    return () => {
      socket.off("friend_request", handleFriendRequest);
      socket.off("friend_request_accepted", handleFriendRequest);
      socket.off("friend_request_cancelled", handleFriendRequest);
      socket.off("friend_request_rejected", handleFriendRequest);
      socket.off("group_invite", handleGroupInvite);
      socket.off("group_invite_accepted", handleGroupInvite);
      socket.off("group_invite_rejected", handleGroupInvite);
    };
  }, [socket]);

  const handleAction = async (id, action) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await action(id);
      fetchRequests();
      addToast({ message: "Thao tác thành công!", type: "success" });
    } catch {
      setError(`Thao tác thất bại.`);
      addToast({ message: "Thao tác thất bại.", type: "error" });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleGroupInviteAction = async (inviteId, action) => {
    setProcessingGroupIds((prev) => new Set(prev).add(inviteId));
    try {
      await action(inviteId);
      fetchGroupInvites();
      addToast({ message: "Thao tác thành công!", type: "success" });
    } catch {
      setGroupInviteError("Thao tác thất bại.");
      addToast({ message: "Thao tác thất bại.", type: "error" });
    } finally {
      setProcessingGroupIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(inviteId);
        return newSet;
      });
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl animate-pulse"
        >
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-20"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-300 rounded-lg"></div>
            <div className="w-16 h-8 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ type }) => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{type === "incoming" ? "📫" : "📤"}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        {type === "incoming" ? "Chưa có lời mời nào" : "Chưa gửi lời mời nào"}
      </h3>
      <p className="text-gray-500">
        {type === "incoming"
          ? "Khi có người gửi lời mời kết bạn, bạn sẽ thấy ở đây"
          : "Những lời mời bạn gửi sẽ hiển thị tại đây"}
      </p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto mt-10">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-2xl p-8 mb-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Lời mời kết bạn</h2>
        <p className="opacity-90">Quản lý các lời mời kết bạn của bạn</p>
        <div className="flex gap-2 mt-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
            {incoming.length} lời mời đến
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
            {outgoing.length} đã gửi
          </div>
        </div>
      </div>

      {/* Main content card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Tabs với animation */}
        <div className="flex bg-gray-50 relative">
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
              tab === "incoming"
                ? "text-purple-600 bg-white shadow-sm"
                : "text-gray-600 hover:text-purple-500"
            }`}
            onClick={() => setTab("incoming")}
          >
            Lời mời đến
            {incoming.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {incoming.length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
              tab === "outgoing"
                ? "text-purple-600 bg-white shadow-sm"
                : "text-gray-600 hover:text-purple-500"
            }`}
            onClick={() => setTab("outgoing")}
          >
            Lời mời đã gửi
            {outgoing.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {outgoing.length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
              tab === "group"
                ? "text-indigo-600 bg-white shadow-sm"
                : "text-gray-600 hover:text-indigo-500"
            }`}
            onClick={() => setTab("group")}
          >
            Lời mời nhóm
            {groupInvites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {groupInvites.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Content với transition */}
          <div className="transition-all duration-300 ease-in-out">
            {loading ? (
              <LoadingSkeleton />
            ) : tab === "incoming" ? (
              incoming.length === 0 ? (
                <EmptyState type="incoming" />
              ) : (
                <div className="space-y-4">
                  {incoming.map((req, index) => (
                    <div
                      key={req._id}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border border-transparent hover:border-purple-200 hover:shadow-md"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative">
                        <img
                          src={
                            req.sender?.profilePic || "/api/placeholder/48/48"
                          }
                          alt="avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {req.sender?.fullName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <span>🌍</span>
                          {req.sender?.nationality}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleAction(req._id, acceptFriendRequest)
                          }
                          disabled={processingIds.has(req._id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                        >
                          {processingIds.has(req._id) ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <span>✓</span>
                          )}
                          Chấp nhận
                        </button>
                        <button
                          onClick={() =>
                            handleAction(req._id, rejectFriendRequest)
                          }
                          disabled={processingIds.has(req._id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                        >
                          {processingIds.has(req._id) ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <span>✕</span>
                          )}
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : outgoing.length === 0 ? (
              <EmptyState type="outgoing" />
            ) : (
              <div className="space-y-4">
                {outgoing.map((req, index) => (
                  <div
                    key={req._id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-transparent hover:border-blue-200 hover:shadow-md"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative">
                      <img
                        src={
                          req.recipient?.profilePic || "/api/placeholder/48/48"
                        }
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {req.recipient?.fullName}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <span>🌍</span>
                        {req.recipient?.nationality}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction(req._id, cancelFriendRequest)}
                      disabled={processingIds.has(req._id)}
                      className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {processingIds.has(req._id) ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span>↩️</span>
                      )}
                      Hủy lời mời
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab nhóm */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-8">
        <div className="flex bg-gray-50 relative">
          <button
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 relative ${
              tab === "group"
                ? "text-indigo-600 bg-white shadow-sm"
                : "text-gray-600 hover:text-indigo-500"
            }`}
            onClick={() => setTab("group")}
          >
            Lời mời nhóm
            {groupInvites.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {groupInvites.length}
              </span>
            )}
          </button>
        </div>
        <div className="p-6">
          {tab === "group" &&
            (groupInviteLoading ? (
              <div className="text-center py-8 text-gray-400">Đang tải...</div>
            ) : groupInvites.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Chưa có lời mời nhóm nào
                </h3>
                <p className="text-gray-500">
                  Khi có ai đó mời bạn vào nhóm, lời mời sẽ hiển thị ở đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupInvites.map((invite, index) => (
                  <div
                    key={invite._id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl hover:from-indigo-100 hover:to-blue-100 transition-all duration-300 border border-transparent hover:border-indigo-200 hover:shadow-md"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative">
                      <img
                        src={invite.group?.avatar || "/vite.svg"}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {invite.group?.name || "Group"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        Được mời bởi{" "}
                        <span className="font-medium">
                          {invite.invitedBy?.fullName || "Ai đó"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleGroupInviteAction(
                            invite._id,
                            acceptGroupInvitation
                          )
                        }
                        disabled={processingGroupIds.has(invite._id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {processingGroupIds.has(invite._id) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <span>✓</span>
                        )}
                        Tham gia
                      </button>
                      <button
                        onClick={() =>
                          handleGroupInviteAction(
                            invite._id,
                            rejectGroupInvitation
                          )
                        }
                        disabled={processingGroupIds.has(invite._id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {processingGroupIds.has(invite._id) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <span>✕</span>
                        )}
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsPage;
