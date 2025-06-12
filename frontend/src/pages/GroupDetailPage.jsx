import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getMyGroups,
  inviteToGroup,
  setGroupNickname,
  muteGroup,
  unmuteGroup,
  blockGroup,
  unblockGroup,
  muteGroupMember,
  unmuteGroupMember,
  setOnlyAdminCanSend,
  blockGroupMember,
  unblockGroupMember,
} from "../lib/api";
import { useToast } from "../components/Toast.jsx";
import useAuthUser from "../hooks/useAuthUser.js";

// Trang chi tiết group chat
const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { authUser } = useAuthUser();
  const { addToast } = useToast();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState("");
  const [onlyAdminCanSend, setOnlyAdminCanSendState] = useState(false);

  // Lấy lại group info từ danh sách group của user
  const fetchGroup = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyGroups();
      const found = (res.groups || []).find((g) => g._id === groupId);
      if (!found)
        throw new Error("Không tìm thấy group hoặc bạn không phải thành viên.");
      setGroup(found);
      setNickname(
        found.members.find((m) => m.userId === authUser?._id)?.nickname || ""
      );
      setOnlyAdminCanSendState(found.settings?.onlyAdminCanSend || false);
    } catch (err) {
      setError(err?.message || "Lỗi tải thông tin nhóm");
    } finally {
      setLoading(false);
    }
  }, [groupId, authUser?._id]);

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line
  }, [groupId, authUser?._id]);

  // Mời thành viên
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await inviteToGroup({ groupId, user: inviteInput });
      addToast({ message: "Đã gửi lời mời!", type: "success" });
      setInviteInput("");
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || "Mời thất bại.",
        type: "error",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  // Đổi nickname
  const handleChangeNickname = async (e) => {
    e.preventDefault();
    setNicknameLoading(true);
    try {
      await setGroupNickname({ groupId, nickname });
      addToast({ message: "Đã đổi biệt danh!", type: "success" });
      fetchGroup();
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || "Đổi biệt danh thất bại.",
        type: "error",
      });
    } finally {
      setNicknameLoading(false);
    }
  };

  // Mute/unmute group
  const handleMute = async () => {
    setMuteLoading(true);
    try {
      if (group.isMuted) {
        await unmuteGroup(groupId);
        addToast({ message: "Đã bật lại thông báo nhóm!", type: "success" });
      } else {
        await muteGroup(groupId);
        addToast({ message: "Đã tắt thông báo nhóm!", type: "success" });
      }
      fetchGroup();
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || "Thao tác thất bại.",
        type: "error",
      });
    } finally {
      setMuteLoading(false);
    }
  };

  // Block/unblock group
  const handleBlock = async () => {
    setBlockLoading(true);
    try {
      if (group.isBlocked) {
        await unblockGroup(groupId);
        addToast({ message: "Đã bỏ chặn nhóm!", type: "success" });
      } else {
        await blockGroup(groupId);
        addToast({ message: "Đã chặn nhóm!", type: "success" });
      }
      fetchGroup();
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || "Thao tác thất bại.",
        type: "error",
      });
    } finally {
      setBlockLoading(false);
    }
  };

  // Chỉ admin/owner được nhắn tin
  const handleOnlyAdminCanSend = async (checked) => {
    setAdminActionLoading("onlyAdminCanSend");
    try {
      await setOnlyAdminCanSend({ groupId, onlyAdminCanSend: checked });
      addToast({ message: "Đã cập nhật quyền nhắn tin!", type: "success" });
      setOnlyAdminCanSendState(checked);
      fetchGroup();
    } catch (err) {
      addToast({
        message: err?.response?.data?.message || "Thao tác thất bại.",
        type: "error",
      });
    } finally {
      setAdminActionLoading("");
    }
  };

  // Admin actions: mute, block, remove, promote/demote member
  const isAdmin =
    group &&
    group.members.find(
      (m) => m.userId === authUser?._id && ["admin", "owner"].includes(m.role)
    );
  const isOwner =
    group &&
    group.members.find((m) => m.userId === authUser?._id && m.role === "owner");

  // UI
  if (loading)
    return (
      <div className="py-20 text-center text-lg">
        Đang tải thông tin nhóm...
      </div>
    );
  if (error)
    return <div className="py-20 text-center text-red-500">{error}</div>;
  if (!group) return null;

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="flex items-center gap-6 mb-8">
        <img
          src={group.avatar || "/vite.svg"}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border-2 border-purple-200"
        />
        <div>
          <div className="text-2xl font-bold text-purple-700 mb-1">
            {group.name}
          </div>
          <div className="text-gray-500 mb-2">{group.description}</div>
          <div className="flex gap-3 text-xs">
            <span>{group.members.length} thành viên</span>
            <span>• ID: {group._id}</span>
            {group.type === "public" && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Công khai
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Mời thành viên */}
      <form onSubmit={handleInvite} className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
          placeholder="Nhập username hoặc email để mời..."
          value={inviteInput}
          onChange={(e) => setInviteInput(e.target.value)}
          disabled={inviteLoading}
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          disabled={inviteLoading}
        >
          {inviteLoading ? "Đang mời..." : "Mời"}
        </button>
      </form>
      {/* Đổi nickname */}
      <form onSubmit={handleChangeNickname} className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
          placeholder="Biệt danh của bạn trong nhóm"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={nicknameLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          disabled={nicknameLoading}
        >
          {nicknameLoading ? "Đang lưu..." : "Lưu"}
        </button>
      </form>
      {/* Mute/Block group */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleMute}
          className="px-4 py-2 bg-gray-100 rounded-lg border font-medium hover:bg-gray-200 disabled:opacity-50"
          disabled={muteLoading}
        >
          {group.isMuted ? "Bật thông báo" : "Tắt thông báo"}
        </button>
        <button
          onClick={handleBlock}
          className="px-4 py-2 bg-gray-100 rounded-lg border font-medium hover:bg-gray-200 disabled:opacity-50"
          disabled={blockLoading}
        >
          {group.isBlocked ? "Bỏ chặn nhóm" : "Chặn nhóm"}
        </button>
      </div>
      {/* Chỉ admin/owner được nhắn tin */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-8">
          <input
            type="checkbox"
            checked={onlyAdminCanSend}
            onChange={(e) => handleOnlyAdminCanSend(e.target.checked)}
            disabled={adminActionLoading === "onlyAdminCanSend"}
            id="onlyAdminCanSend"
          />
          <label htmlFor="onlyAdminCanSend" className="text-sm text-gray-700">
            Chỉ admin/owner được nhắn tin
          </label>
        </div>
      )}
      {/* Danh sách thành viên */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="font-semibold text-lg mb-4 text-purple-700">
          Thành viên nhóm
        </div>
        <div className="space-y-3">
          {group.members.map((m) => {
            const isMe = m.userId === authUser?._id;
            return (
              <div
                key={m.userId}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
              >
                <img
                  src={m.profilePic || "/vite.svg"}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {m.fullName || m.nickname || m.userId}
                  </div>
                  <div className="text-xs text-gray-500">
                    {m.role === "owner"
                      ? "Owner"
                      : m.role === "admin"
                      ? "Admin"
                      : "Member"}
                  </div>
                  {isMe && <div className="text-xs text-purple-500">(Bạn)</div>}
                </div>
                {/* Admin actions */}
                {isAdmin && !isMe && (
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                      disabled={adminActionLoading === `mute-${m.userId}`}
                      onClick={async () => {
                        setAdminActionLoading(`mute-${m.userId}`);
                        try {
                          if (m.isMuted) {
                            await unmuteGroupMember({
                              groupId,
                              memberId: m.userId,
                            });
                            addToast({
                              message: `Đã bỏ mute ${m.fullName || m.userId}`,
                            });
                          } else {
                            await muteGroupMember({
                              groupId,
                              memberId: m.userId,
                            });
                            addToast({
                              message: `Đã mute ${m.fullName || m.userId}`,
                            });
                          }
                          fetchGroup();
                        } catch (err) {
                          addToast({
                            message:
                              err?.response?.data?.message ||
                              "Thao tác thất bại.",
                            type: "error",
                          });
                        } finally {
                          setAdminActionLoading("");
                        }
                      }}
                    >
                      {m.isMuted ? "Bỏ mute" : "Mute"}
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                      disabled={adminActionLoading === `block-${m.userId}`}
                      onClick={async () => {
                        setAdminActionLoading(`block-${m.userId}`);
                        try {
                          if (m.isBlocked) {
                            await unblockGroupMember({
                              groupId,
                              userId: m.userId,
                            });
                            addToast({
                              message: `Đã bỏ chặn ${m.fullName || m.userId}`,
                            });
                          } else {
                            await blockGroupMember({
                              groupId,
                              userId: m.userId,
                            });
                            addToast({
                              message: `Đã chặn ${m.fullName || m.userId}`,
                            });
                          }
                          fetchGroup();
                        } catch (err) {
                          addToast({
                            message:
                              err?.response?.data?.message ||
                              "Thao tác thất bại.",
                            type: "error",
                          });
                        } finally {
                          setAdminActionLoading("");
                        }
                      }}
                    >
                      {m.isBlocked ? "Bỏ chặn" : "Chặn"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;
