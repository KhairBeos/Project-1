import { axiosInstance } from "./axios.js";

// Đăng ký tài khoản
export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

// Lấy thông tin người dùng đã đăng nhập
export const getAuthUser = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

// Cập nhật thông tin cá nhân
export const updateProfile = async (profileData) => {
  const response = await axiosInstance.post(
    "/users/update-profile",
    profileData
  );
  return response.data;
};

// Nhập thông tin người dùng
export const onboard = async (onboardData) => {
  const response = await axiosInstance.post("/auth/onboarding", onboardData);
  return response.data;
};

// Gửi mã xác minh email
export const verifyEmail = async (code) => {
  const response = await axiosInstance.post("/auth/verify-email", { code });
  return response.data;
};

// Gửi lại email xác thực
export const resendVerifyEmail = async (email) => {
  const response = await axiosInstance.post("/users/resend-verify", { email });
  return response.data;
};

// Đăng xuất
export const logout = async () => {
  await axiosInstance.post("/auth/logout");
};

// Đăng nhập
export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

// Gửi mã xác minh email
export const sendResetPasswordEmail = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email });
  return response.data;
};

// Xác minh mã reset password
export const resetPassword = async (token, password) => {
  const response = await axiosInstance.post("/auth/reset-password", {
    token,
    password,
  });
  return response.data;
};

// Gửi mã xác minh 2FA
export const verify2FALogin = async ({ account, token }) => {
  const response = await axiosInstance.post("/twofa/verify-login", {
    account,
    token,
  });
  return response.data;
};

// Gửi mã xác minh 2FA cho đăng nhập
export const sendForgotPasswordCode = async (account) => {
  const response = await axiosInstance.post("/auth/forgot-password", {
    account,
  });
  return response.data;
};

// Xác minh mã quên mật khẩu
export const verifyForgotPasswordCode = async ({ email, code }) => {
  const response = await axiosInstance.post("/auth/forgot-password/verify", {
    email,
    code,
  });
  return response.data;
};

// Đặt lại mật khẩu với mã xác minh
export const resetPasswordWithCode = async ({ email, newPassword }) => {
  const response = await axiosInstance.post("/auth/forgot-password/reset", {
    email,
    newPassword,
  });
  return response.data;
};

// Đổi mật khẩu
export const changePassword = async ({ oldPassword, newPassword }) => {
  const response = await axiosInstance.post("/users/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
};

// Bật 2FA
export const enable2FA = async () => {
  const response = await axiosInstance.post("/users/enable-2fa");
  return response.data;
};

// Tắt 2FA
export const disable2FA = async () => {
  const response = await axiosInstance.post("/users/disable-2fa");
  return response.data;
};

// Lấy danh sách lời mời đến
export const getFriendRequests = async () => {
  const res = await axiosInstance.get("/users/friend-requests");
  return res.data;
};
// Lấy danh sách lời mời đã gửi
export const getOutgoingFriendRequests = async () => {
  const res = await axiosInstance.get("/users/outgoing-friend-requests");
  return res.data;
};
// Chấp nhận lời mời
export const acceptFriendRequest = async (id) => {
  return axiosInstance.put(`/users/friend-request/${id}/accept`);
};
// Từ chối lời mời
export const rejectFriendRequest = async (id) => {
  return axiosInstance.delete(`/users/friend-request/${id}/reject`);
};
// Hủy lời mời đã gửi
export const cancelFriendRequest = async (id) => {
  return axiosInstance.delete(`/users/friend-request/${id}/cancel`);
};

// Lấy danh sách group/chat của user
export const getMyGroups = async () => {
  const res = await axiosInstance.get("/groups/my");
  return res.data;
};

// Mời thành viên vào group bằng username hoặc email
export const inviteToGroup = async ({ groupId, user }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/invite`, {
    identifier: user,
  });
  return res.data;
};

// Rời khỏi group (user tự rời)
export const leaveGroup = async (groupId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/leave`);
  return res.data;
};

// Đổi nickname của mình trong group
export const setGroupNickname = async ({ groupId, nickname }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/nickname`, {
    nickname,
  });
  return res.data;
};
// Ghim tin nhắn trong group
export const pinGroupMessage = async ({ groupId, messageId }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/pin`, { messageId });
  return res.data;
};
// Bỏ ghim tin nhắn trong group (admin/owner)
export const unpinGroupMessage = async ({ groupId, messageId }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/unpin`, {
    messageId,
  });
  return res.data;
};
// Tắt thông báo group
export const muteGroup = async (groupId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/mute`);
  return res.data;
};
// Bật lại thông báo group
export const unmuteGroup = async (groupId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/unmute`);
  return res.data;
};
// Admin/owner mute thành viên
export const muteGroupMember = async ({ groupId, memberId }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/mute-member`, {
    memberId,
  });
  return res.data;
};
// Admin/owner unmute thành viên
export const unmuteGroupMember = async ({ groupId, memberId }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/unmute-member`, {
    memberId,
  });
  return res.data;
};
// Chỉ admin/owner được nhắn tin (cài đặt group)
export const setOnlyAdminCanSend = async ({ groupId, onlyAdminCanSend }) => {
  const res = await axiosInstance.post(
    `/groups/${groupId}/only-admin-can-send`,
    { onlyAdminCanSend }
  );
  return res.data;
};
// Admin/owner chặn thành viên khỏi group
export const blockGroupMember = async ({ groupId, userId }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/block-member`, {
    userId,
  });
  return res.data;
};
// Admin/owner bỏ chặn thành viên
export const unblockGroupMember = async ({ groupId, userId }) => {
  const res = await axiosInstance.post(`/groups/${groupId}/unblock-member`, {
    userId,
  });
  return res.data;
};
// User tự chặn group (thêm group vào danh sách bị block)
export const blockGroup = async (groupId) => {
  const res = await axiosInstance.post(`/groups/${groupId}/block`);
  return res.data;
};
// User bỏ chặn group (gửi groupId trong body, đồng bộ backend)
export const unblockGroup = async (groupId) => {
  const res = await axiosInstance.post("/groups/unblock", { groupId });
  return res.data;
};

// Ghim tin nhắn trong chat 1-1
export const pinDirectMessage = async ({ targetUserId, messageId }) => {
  const res = await axiosInstance.post("/chat/pin-direct", {
    targetUserId,
    messageId,
  });
  return res.data;
};
// Bỏ ghim tin nhắn trong chat 1-1
export const unpinDirectMessage = async ({ targetUserId }) => {
  const res = await axiosInstance.post("/chat/unpin-direct", { targetUserId });
  return res.data;
};

// Lấy lịch sử tin nhắn (group hoặc 1-1)
export const getMessages = async (params) => {
  const res = await axiosInstance.get("/chat/history", { params });
  return res.data;
};

// Tìm kiếm tin nhắn (group hoặc 1-1)
export const searchMessages = async ({
  query,
  userId,
  groupId,
  limit = 50,
}) => {
  const params = groupId
    ? { group: groupId, query, limit }
    : { user: userId, query, limit };
  const res = await axiosInstance.get("/chat/search", { params });
  return res.data.messages || res.data;
};
// Thêm reaction vào tin nhắn
export const addMessageReaction = async ({ messageId, emoji }) => {
  const res = await axiosInstance.post(`/chat/${messageId}/reaction`, {
    emoji,
  });
  return res.data;
};

// Tìm kiếm người dùng
export const searchUsers = async (q) => {
  const res = await axiosInstance.get("/users/search", { params: { q } });
  return res.data;
};

// Tìm kiếm user và group
export const searchAll = async (q) => {
  const res = await axiosInstance.get("/search/all", { params: { q } });
  return res.data; // { users: [...], groups: [...] }
};

// User gửi yêu cầu xin vào nhóm
export const requestJoinGroup = async (groupId) => {
  return await axiosInstance.post(`/groups/${groupId}/join-request`);
};

// Đánh dấu đã xem tin nhắn (API + socket realtime)
export async function markSeenMessage({
  messageId,
  socket,
  userId,
  groupId,
  roomId,
}) {
  // Gọi API lưu trạng thái đã xem
  await fetch(`/api/chat/seen/${messageId}`, {
    method: "POST",
    credentials: "include",
  });
  // Emit socket để realtime cho đối phương hoặc group
  if (socket) {
    socket.emit("seen_message", {
      messageId,
      userId,
      receiver: groupId ? undefined : userId, // direct chat
      group: groupId, // group chat
      roomId: roomId || groupId || userId,
    });
  }
}

// Lấy danh sách người dùng bị block
export const getBlockedUsers = async () => {
  const res = await axiosInstance.get("/users/blocked-users");
  return res.data;
};
// Bỏ chặn người dùng
export const unblockUser = async (userId) => {
  const res = await axiosInstance.post("/users/unblock", { targetId: userId });
  return res.data;
};

// Lấy danh sách group bị block
export const getBlockedGroups = async () => {
  const res = await axiosInstance.get("/groups/blocked-groups");
  return res.data;
};

// Tạo group mới
export const createGroup = async ({ name }) => {
  const res = await axiosInstance.post("/groups/create", { name });
  return res.data;
};

// Tạo hoặc lấy group chat 1-1 (direct chat)
export const createOrGetDirectChat = async (userId) => {
  const res = await axiosInstance.post("/groups/direct", { userId });
  return res.data;
};

// Upload file (group or direct chat)
export const uploadFile = async (formData) => {
  // formData should be a FormData instance with file and other fields (groupId, receiver, roomId, etc)
  const response = await axiosInstance.post("/chat/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Lấy danh sách bạn bè
export const getFriends = async () => {
  const res = await axiosInstance.get("/users/friends");
  return res.data;
};

// Xóa bạn bè
export const removeFriend = async (friendId) => {
  const res = await axiosInstance.delete(`/users/friends/${friendId}`);
  return res.data;
};

// Lấy danh sách lời mời nhóm đến cho user
export const getGroupInvitations = async () => {
  const res = await axiosInstance.get("/groups/invitations/me");
  return res.data;
};

// Chấp nhận lời mời nhóm
export const acceptGroupInvitation = async (inviteId) => {
  const res = await axiosInstance.post(`/groups/invitation/${inviteId}/accept`);
  return res.data;
};

// Từ chối lời mời nhóm
export const rejectGroupInvitation = async (inviteId) => {
  const res = await axiosInstance.post(`/groups/invitation/${inviteId}/reject`);
  return res.data;
};

// Gửi lời mời kết bạn
export const sendFriendRequest = async (userId) => {
  // userId: id của người nhận lời mời
  const res = await axiosInstance.post(`/users/friend-request/${userId}`);
  return res.data;
};

export default {
  signup,
  getAuthUser,
  updateProfile,
  onboard,
  verifyEmail,
  resendVerifyEmail,
  logout,
  login,
  sendResetPasswordEmail,
  resetPassword,
  verify2FALogin,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  resetPasswordWithCode,
  changePassword,
  enable2FA,
  disable2FA,
  getFriendRequests,
  getOutgoingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getMyGroups,
  inviteToGroup,
  leaveGroup,
  setGroupNickname,
  pinGroupMessage,
  unpinGroupMessage,
  muteGroup,
  unmuteGroup,
  muteGroupMember,
  unmuteGroupMember,
  setOnlyAdminCanSend,
  blockGroupMember,
  unblockGroupMember,
  blockGroup,
  unblockGroup,
  pinDirectMessage,
  unpinDirectMessage,
  getMessages,
  searchMessages,
  addMessageReaction,
  searchUsers,
  searchAll,
  requestJoinGroup,
  markSeenMessage,
  getBlockedUsers,
  unblockUser,
  getBlockedGroups,
  createGroup,
  createOrGetDirectChat,
  uploadFile,
  getFriends,
  removeFriend,
  getGroupInvitations,
  acceptGroupInvitation,
  rejectGroupInvitation,
  sendFriendRequest,
};
