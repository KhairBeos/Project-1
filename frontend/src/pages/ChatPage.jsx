import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMessages,
  pinGroupMessage,
  unpinGroupMessage,
  inviteToGroup,
  searchMessages,
  addMessageReaction,
  markSeenMessage, // Thêm hàm markSeenMessage
  uploadFile,
} from "../lib/api.js";
import PageLoader from "../components/PageLoader.jsx";
import ErrorPage from "../components/ErrorPage.jsx";
import { useSocket } from "../hooks/useSocket.js";
import useAuthUser from "../hooks/useAuthUser.js";
import { FixedSizeList as List } from "react-window";
import React from "react";
import { Video, Settings } from "lucide-react";

// Constants
const MAX_MESSAGE_LENGTH = 1000;
const MESSAGES_PER_PAGE = 50;
const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

// Utility functions
const validateMessage = (message) => {
  return (
    message?.trim().length > 0 && message.trim().length <= MAX_MESSAGE_LENGTH
  );
};

const formatTime = (timestamp) => {
  return timestamp
    ? new Date(timestamp).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
};

// MessageItem component tối ưu, dùng React.memo
const MessageItem = React.memo(
  ({
    msg,
    formatTime,
    showAvatar,
    isLast,
    onPin,
    pinnedMessage,
    pinLoading,
    onReaction,
    messageReactions,
    isAdmin,
  }) => {
    const [showReactions, setShowReactions] = React.useState(false);
    return (
      <div
        className={`flex gap-3 items-end ${
          msg.isOwn ? "flex-row-reverse" : ""
        }`}
      >
        {showAvatar && (
          <img
            src={msg.sender?.profilePic || "/vite.svg"}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
          />
        )}
        {!showAvatar && <div className="w-8"></div>}
        <div
          className={`$${
            msg.isOwn ? "items-end" : "items-start"
          } flex flex-col relative`}
        >
          {showAvatar && !msg.isOwn && (
            <div className="text-sm font-medium text-gray-600 mb-1">
              {msg.sender?.fullName || "User"}
            </div>
          )}
          <div
            className={`
              rounded-2xl px-4 py-2 shadow-sm max-w-md break-words relative group
              ${
                msg.isOwn
                  ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                  : "bg-white text-gray-800 border"
              }
              ${msg.status === "failed" ? "border-red-300 bg-red-50" : ""}
              ${
                pinnedMessage && pinnedMessage._id === msg._id
                  ? "ring-2 ring-yellow-400"
                  : ""
              }
            `}
            onDoubleClick={() => setShowReactions(!showReactions)}
          >
            {/* File content */}
            {msg.fileUrl && (
              <div className="mb-2">
                {msg.fileType?.startsWith("image/") ? (
                  <img
                    src={msg.fileUrl}
                    alt="Shared image"
                    className="max-w-full h-auto rounded-lg cursor-pointer"
                    onClick={() => window.open(msg.fileUrl, "_blank")}
                  />
                ) : (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <span>📎</span>
                    <span className="truncate">{msg.fileName || "File"}</span>
                  </a>
                )}
              </div>
            )}
            {/* Text content */}
            {(msg.content || msg.message) && (
              <div>{msg.content || msg.message}</div>
            )}
            {/* Pin button (admin only) */}
            {isAdmin && msg._id && (
              <button
                onClick={() => onPin(msg)}
                disabled={
                  pinLoading || (pinnedMessage && pinnedMessage._id === msg._id)
                }
                className={`absolute top-1 right-1 text-yellow-500 hover:text-yellow-700 text-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                  pinnedMessage && pinnedMessage._id === msg._id
                    ? "opacity-60"
                    : ""
                }`}
                title="Ghim tin nhắn này"
              >
                📌
              </button>
            )}
            {/* Pinned indicator */}
            {pinnedMessage && pinnedMessage._id === msg._id && (
              <span className="absolute -top-2 left-2 text-xs text-yellow-600 font-bold">
                Đã ghim
              </span>
            )}
            {/* Message status */}
            {msg.isOwn && (
              <div className="absolute -bottom-1 -right-1">
                {msg.status === "sending" && (
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
                {msg.status === "sent" && (
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                )}
                {msg.status === "delivered" && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
                {msg.status === "failed" && (
                  <div
                    className="w-3 h-3 bg-red-500 rounded-full cursor-pointer"
                    title="Nhấn để gửi lại"
                  ></div>
                )}
              </div>
            )}
            {/* Reaction selector */}
            {showReactions && (
              <div className="absolute -bottom-8 left-0 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                {COMMON_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction && onReaction(msg._id, emoji);
                      setShowReactions(false);
                    }}
                    className="text-lg hover:bg-gray-100 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Message reactions */}
          {messageReactions &&
            messageReactions[msg._id] &&
            Object.keys(messageReactions[msg._id]).length > 0 && (
              <div className="flex gap-1 mt-1">
                {Object.entries(messageReactions[msg._id]).map(
                  ([emoji, count]) => (
                    <span
                      key={emoji}
                      className="text-xs bg-gray-100 rounded-full px-2 py-1 cursor-pointer hover:bg-gray-200"
                      onClick={() => onReaction && onReaction(msg._id, emoji)}
                    >
                      {emoji} {count}
                    </span>
                  )
                )}
              </div>
            )}
          {isLast && (
            <div
              className={`text-xs text-gray-400 mt-1 ${
                msg.isOwn ? "text-right" : ""
              }`}
            >
              {formatTime(msg.createdAt)}
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Group messages cho UI đẹp
const groupMessages = (messages) => {
  return messages.reduce((groups, msg, index) => {
    const prevMsg = messages[index - 1];
    const shouldGroup =
      prevMsg &&
      prevMsg.sender?._id === msg.sender?._id &&
      new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 60000; // 1 phút
    if (shouldGroup) {
      groups[groups.length - 1].push(msg);
    } else {
      groups.push([msg]);
    }
    return groups;
  }, []);
};

// File Upload Component
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];
const FileUpload = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef(null);
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("File quá lớn. Kích thước tối đa là 10MB.");
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert("Loại file không được hỗ trợ.");
      return;
    }
    onFileSelect(file);
    event.target.value = "";
  };
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        title="Đính kèm file"
      >
        📎
      </button>
    </>
  );
};

const ChatPage = () => {
  const { groupId } = useParams();
  const { authUser: currentUser } = useAuthUser();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // State for invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Custom hook for socket management
  const {
    socket,
    isConnected,
    error: socketError,
    sendMessage,
    joinRoom,
    leaveRoom,
  } = useSocket();

  // Load draft from localStorage
  useEffect(() => {
    if (groupId) {
      const draft = localStorage.getItem(`draft_${groupId}`);
      if (draft) setInput(draft);
    }
  }, [groupId]);

  // Save draft to localStorage
  useEffect(() => {
    if (groupId) {
      if (input.trim()) {
        localStorage.setItem(`draft_${groupId}`, input);
      } else {
        localStorage.removeItem(`draft_${groupId}`);
      }
    }
  }, [input, groupId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setInput("");
        setSelectedFile(null);
      }
      if (e.ctrlKey && e.key === "Enter") {
        handleSend(e);
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        // Focus search
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Group messages cho UI đẹp
  const groupedMessages = React.useMemo(
    () => groupMessages(messages),
    [messages]
  );

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Handle new message from socket
  const handleNewMessage = useCallback(
    (data) => {
      if (
        data.roomId === groupId ||
        (data.sender === currentUser?._id && data.receiver === groupId) ||
        (data.sender === groupId && data.receiver === currentUser?._id)
      ) {
        setMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg._id === data._id || (msg.tempId && msg.tempId === data.tempId)
          );
          if (exists) return prev;

          return [
            ...prev,
            {
              ...data,
              isOwn: data.sender === currentUser?._id,
            },
          ];
        });

        setTimeout(scrollToBottom, 100);
      }
    },
    [groupId, currentUser?._id, scrollToBottom]
  );

  // Handle typing events
  const handleTyping = useCallback(
    (data) => {
      if (data.userId === currentUser?._id && data.roomId === groupId) {
        setIsTyping(data.isTyping);

        if (data.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    },
    [currentUser?._id, groupId]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file) => {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("groupId", groupId);
        formData.append("roomId", groupId);
        const response = await uploadFile(formData);
        const fileMessage = {
          _id: response.messageId,
          content: "",
          fileUrl: response.fileUrl,
          fileName: file.name,
          fileType: file.type,
          sender: currentUser,
          receiver: groupId,
          createdAt: new Date().toISOString(),
          isOwn: true,
          status: "sent",
        };
        setMessages((prev) => [...prev, fileMessage]);
        setTimeout(scrollToBottom, 100);
        // Emit socket event để realtime cho các thành viên khác
        socket?.emit("send_message", {
          group: groupId,
          roomId: groupId,
          ...fileMessage,
        });
      } catch (error) {
        console.error("File upload failed:", error);
        setError("Tải file thất bại. Vui lòng thử lại.");
      } finally {
        setUploadingFile(false);
        setSelectedFile(null);
      }
    },
    [groupId, currentUser, scrollToBottom, socket]
  );

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchMessages({
        query: searchTerm,
        userId: groupId,
        limit: 50,
      });

      setSearchResults(
        results.map((msg) => ({
          ...msg,
          isOwn: msg.sender?._id === currentUser?._id,
        }))
      );
    } catch (error) {
      console.error("Search failed:", error);
      setError("Tìm kiếm thất bại.");
    }
  }, [searchTerm, groupId, currentUser?._id]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !groupId) return;

    socket.on("receive_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("message_delivered", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId ? { ...msg, status: "delivered" } : msg
        )
      );
    });
    socket.on("message_reaction", (data) => {
      setMessageReactions((prev) => ({
        ...prev,
        [data.messageId]: {
          ...prev[data.messageId],
          [data.emoji]: (prev[data.messageId]?.[data.emoji] || 0) + 1,
        },
      }));
    });

    // Lắng nghe thành viên rời nhóm
    socket.on("group_member_left", (data) => {
      if (data.groupId === groupId) {
        // Hiển thị thông báo hoặc cập nhật UI tùy ý
        setError(`${data.userName || "Một thành viên"} đã rời nhóm này.`);
        // Có thể fetch lại danh sách thành viên nếu muốn
      }
    });

    return () => {
      socket.off("receive_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("message_delivered");
      socket.off("message_reaction");
      socket.off("group_member_left");
    };
  }, [socket, groupId, handleNewMessage, handleTyping]);

  // Join room when component mounts
  useEffect(() => {
    if (socket && groupId) {
      joinRoom(groupId);
      return () => leaveRoom(groupId);
    }
  }, [socket, groupId, joinRoom, leaveRoom]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!groupId) return;

      setLoading(true);
      setError("");

      try {
        const res = await getMessages({
          user: groupId,
          page: 1,
          limit: MESSAGES_PER_PAGE,
        });

        const messagesWithOwnership = (res.messages || []).map((msg) => ({
          ...msg,
          isOwn: msg.sender?._id === currentUser?._id,
        }));

        setMessages(messagesWithOwnership);
        setHasMore(res.hasMore || false);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Không thể tải tin nhắn. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [groupId, currentUser?._id, scrollToBottom]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const res = await getMessages({
        user: groupId,
        page: page + 1,
        limit: MESSAGES_PER_PAGE,
      });

      const newMessages = (res.messages || []).map((msg) => ({
        ...msg,
        isOwn: msg.sender?._id === currentUser?._id,
      }));

      setMessages((prev) => [...newMessages, ...prev]);
      setPage((prev) => prev + 1);
      setHasMore(res.hasMore || false);
    } catch (err) {
      console.error("Error loading more messages:", err);
    }
  }, [hasMore, loading, groupId, page, currentUser?._id]);

  // Handle send message with retry logic
  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();

      const messageText = input.trim();
      if (
        (!validateMessage(messageText) && !selectedFile) ||
        sending ||
        !isConnected
      )
        return;

      // Handle file upload if file is selected
      if (selectedFile) {
        await handleFileUpload(selectedFile);
        return;
      }

      setSending(true);
      const tempId = Date.now().toString();

      // Optimistic update
      const optimisticMessage = {
        _id: tempId,
        tempId,
        content: messageText,
        sender: currentUser,
        receiver: groupId,
        createdAt: new Date().toISOString(),
        isOwn: true,
        status: "sending",
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setInput("");
      setTimeout(scrollToBottom, 100);

      try {
        await sendMessage({
          receiver: groupId,
          message: messageText,
          roomId: groupId,
          tempId,
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "sent" } : msg
          )
        );
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "failed" } : msg
          )
        );
        setError("Gửi tin nhắn thất bại. Vui lòng thử lại.");
      } finally {
        setSending(false);
      }
    },
    [
      input,
      selectedFile,
      sending,
      isConnected,
      currentUser,
      groupId,
      sendMessage,
      handleFileUpload,
      scrollToBottom,
    ]
  );

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);

      if (socket && groupId) {
        socket.emit("typing", {
          roomId: groupId,
          userId: currentUser?._id,
          isTyping: true,
        });

        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          socket.emit("typing", {
            roomId: groupId,
            userId: currentUser?._id,
            isTyping: false,
          });
        }, 1000);
      }
    },
    [socket, groupId, currentUser?._id]
  );

  // Fetch pinned message for this chat
  useEffect(() => {
    async function fetchPinned() {
      if (!currentUser?._id || !groupId) return;
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        const pinned = (data.user?.pinnedGroupMessages || []).find(
          (item) => item.group === groupId || item.group?._id === groupId
        );
        if (pinned) {
          let msg = messages.find((m) => m._id === pinned.message);
          if (!msg) {
            const resMsg = await fetch(`/api/messages/${pinned.message}`);
            msg = await resMsg.json();
            msg = msg.message || msg;
          }
          setPinnedMessage(msg);
        } else {
          setPinnedMessage(null);
        }
      } catch {
        setPinnedMessage(null);
      }
    }
    fetchPinned();
  }, [currentUser?._id, groupId, messages]);

  // Pin message handler
  const handlePin = async (msg) => {
    setPinLoading(true);
    try {
      await pinGroupMessage({ targetGroupId: groupId, messageId: msg._id });
      setPinnedMessage(msg);
    } catch (e) {
      setError("Không thể ghim tin nhắn.");
    } finally {
      setPinLoading(false);
    }
  };

  // Unpin handler
  const handleUnpin = async () => {
    setPinLoading(true);
    try {
      await unpinGroupMessage({ targetGroupId: groupId });
      setPinnedMessage(null);
    } catch (e) {
      setError("Không thể bỏ ghim tin nhắn.");
    } finally {
      setPinLoading(false);
    }
  };

  // Reaction handler
  const handleReaction = useCallback(
    async (messageId, emoji) => {
      try {
        await addMessageReaction({ messageId, emoji });
        setMessageReactions((prev) => ({
          ...prev,
          [messageId]: {
            ...(prev[messageId] || {}),
            [emoji]: (prev[messageId]?.[emoji] || 0) + 1,
          },
        }));
        // Emit to socket for realtime update
        socket?.emit("react_message", {
          messageId,
          emoji,
          userId: currentUser?._id,
          group: groupId,
          roomId: groupId,
        });
      } catch (e) {
        setError("Không thể gửi reaction. Vui lòng thử lại.");
      }
    },
    [addMessageReaction, socket, groupId, currentUser?._id]
  );

  // Gọi markSeenMessage khi user xem tin nhắn mới nhất (không phải của mình)
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.isOwn && lastMsg._id) {
      markSeenMessage({
        messageId: lastMsg._id,
        socket,
        userId: currentUser?._id,
        groupId,
        roomId: groupId,
      });
    }
  }, [messages, socket, currentUser?._id, groupId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Lấy quyền admin của user trong group
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    async function fetchGroupInfo() {
      if (!groupId) return;
      try {
        const res = await fetch(`/api/groups/${groupId}`);
        const data = await res.json();
        if (data.group && data.group.admins) {
          setIsAdmin(data.group.admins.includes(currentUser?._id));
        }
      } catch {
        setIsAdmin(false);
      }
    }
    fetchGroupInfo();
  }, [groupId, currentUser?._id]);

  // Thêm hàm gọi nhóm
  const handleStartGroupCall = () => {
    if (groupId) {
      window.open(`/call?type=group&id=${groupId}`, "_blank");
    }
  };

  if (loading) return <PageLoader />;
  if (error && !messages.length) return <ErrorPage message={error} />;
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-lg mt-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white rounded-t-2xl">
        <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {/* ...Tên nhóm, avatar... */}
          <span>Group Chat</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Nút gọi nhóm */}
          <button
            onClick={handleStartGroupCall}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all"
            title="Gọi nhóm video/audio"
          >
            <Video className="w-6 h-6" />
          </button>
          {/* Nút setting/chi tiết nhóm */}
          <button
            onClick={() => navigate(`/groups/${groupId}/detail`)}
            className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all"
            title="Chi tiết nhóm"
          >
            <Settings className="w-6 h-6" />
          </button>
          {/* Input tìm kiếm tin nhắn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-1"
            style={{ minWidth: 200 }}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tin nhắn..."
              className="px-2 py-1 border rounded text-sm focus:outline-none focus:border-blue-400"
              style={{ width: 140 }}
            />
            <button
              type="submit"
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              disabled={!searchTerm.trim()}
            >
              Tìm
            </button>
          </form>
          {isAdmin && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Mời thành viên
            </button>
          )}
        </div>
      </div>
      {/* Modal mời thành viên */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-bold mb-2">Mời thành viên vào nhóm</h2>
            <input
              type="text"
              placeholder="Email hoặc username"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-2"
            />
            {inviteError && (
              <div className="text-red-500 text-sm mb-2">{inviteError}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setInviteLoading(true);
                  setInviteError("");
                  try {
                    await inviteToGroup({ groupId, user: inviteInput });
                    setInviteModalOpen(false);
                    setInviteInput("");
                    // Có thể hiển thị toast/thông báo thành công ở đây
                  } catch (e) {
                    setInviteError("Mời thất bại. Kiểm tra lại thông tin.");
                  } finally {
                    setInviteLoading(false);
                  }
                }}
                disabled={inviteLoading || !inviteInput.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {inviteLoading ? "Đang mời..." : "Mời"}
              </button>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Banner */}
      {/* ...existing code... */}
      {/* Pinned Message */}
      {/* ...existing code... */}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <div className="text-4xl mb-4">💬</div>
            <div className="text-lg font-medium">Chưa có tin nhắn nào</div>
            <div className="text-sm">Hãy bắt đầu cuộc trò chuyện!</div>
          </div>
        ) : (
          <List
            height={500}
            itemCount={groupedMessages.length}
            itemSize={groupedMessages.length > 20 ? 80 : 100}
            width={"100%"}
            itemData={{
              groupedMessages,
              isAdmin,
              pinnedMessage,
              onPin: handlePin,
              pinLoading,
              formatTime,
              onReaction: handleReaction,
              messageReactions,
            }}
            style={{ overflowX: "hidden" }}
          >
            {({ index, style, data }) => {
              const group = data.groupedMessages[index];
              return (
                <div style={style}>
                  {group.map((msg, idx) => (
                    <MessageItem
                      key={msg._id || msg.tempId || idx}
                      msg={msg}
                      formatTime={data.formatTime}
                      showAvatar={idx === 0}
                      isLast={idx === group.length - 1}
                      onPin={data.onPin}
                      pinnedMessage={data.pinnedMessage}
                      pinLoading={data.pinLoading}
                      onReaction={data.onReaction}
                      messageReactions={data.messageReactions}
                      isAdmin={data.isAdmin}
                    />
                  ))}
                </div>
              );
            }}
          </List>
        )}
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 items-end">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <div className="text-xs">...</div>
            </div>
            <div className="bg-gray-200 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className="px-6 py-4 border-t bg-white rounded-b-2xl">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-4"
          autoComplete="off"
        >
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Nhập tin nhắn..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              ref={inputRef}
            />
          </div>
          <FileUpload onFileSelect={setSelectedFile} disabled={uploadingFile} />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all ${
              sending ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {sending ? "Đang gửi..." : "Gửi"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
