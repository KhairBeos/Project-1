import { useEffect, useState, useCallback } from "react";
import { getMyGroups } from "../lib/api.js";
import { useNavigate } from "react-router-dom";
import PageLoader from "../components/PageLoader.jsx";
import ErrorPage from "../components/ErrorPage.jsx";

// Hàm định dạng thời gian đẹp hơn
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

// Trang lịch sử chat (danh sách các cuộc trò chuyện)
const ChatHistoryPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMyGroups();
        setGroups(res.groups || []);
      } catch (err) {
        setError("Không thể tải danh sách cuộc trò chuyện.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleChatClick = useCallback((groupId) => {
    navigate(`/chat/${groupId}`);
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    navigate('/chat/new');
  }, [navigate]);

  // Lọc cuộc trò chuyện theo từ khóa tìm kiếm
  const filteredGroups = groups.filter(group => 
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;
  if (error) return <ErrorPage message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header đẹp */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            💬 Lịch Sử Trò Chuyện
          </h1>
          <p className="text-gray-600">Tất cả các cuộc trò chuyện của bạn</p>
        </div>

        {/* Thanh tìm kiếm đẹp */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Nút tạo chat mới */}
        <div className="mb-6 text-center">
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Bắt đầu trò chuyện mới
          </button>
        </div>

        {/* Danh sách cuộc trò chuyện */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "Không tìm thấy cuộc trò chuyện" : "Chưa có cuộc trò chuyện nào"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Thử từ khóa khác để tìm kiếm" : "Hãy bắt đầu cuộc trò chuyện đầu tiên của bạn"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleNewChat}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-full border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tạo cuộc trò chuyện mới
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGroups.map((group, index) => (
              <div
                key={group._id}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-purple-200 cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => handleChatClick(group._id)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 p-6">
                  {/* Avatar đẹp */}
                  <div className="relative">
                    <img
                      src={group.avatar || "/vite.svg"}
                      alt="avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 group-hover:border-purple-300 transition-all duration-200"
                    />
                    {/* Điểm online (nếu có) */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>

                  {/* Nội dung chính */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors duration-200">
                        {group.name || "Chat 1-1"}
                      </h3>
                      <div className="flex items-center gap-2">
                        {/* Badge tin nhắn chưa đọc (nếu có) */}
                        {group.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                            {group.unreadCount > 99 ? '99+' : group.unreadCount}
                          </div>
                        )}
                        <span className="text-xs text-gray-400 font-medium">
                          {formatTimeAgo(group.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {group.lastMessage?.content || "Chưa có tin nhắn"}
                      </p>
                      
                      {/* Icon mũi tên */}
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Thống kê */}
        {groups.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Tổng cộng: <span className="font-semibold text-purple-600">{groups.length}</span> cuộc trò chuyện
              {searchTerm && filteredGroups.length !== groups.length && (
                <span> • Đang hiển thị: <span className="font-semibold text-purple-600">{filteredGroups.length}</span></span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryPage;