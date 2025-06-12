import { useState, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User } from "lucide-react";

// Lấy thông tin call type và id từ URL (ví dụ: /call?type=group&id=...)
function getCallParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    type: params.get("type") || "direct", // "group" hoặc "direct"
    id: params.get("id"), // groupId hoặc userId
  };
}

const CallPage = () => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [participants, setParticipants] = useState([]); // [{id, name, ...}]
  const [callType, setCallType] = useState("direct");
  const [callId, setCallId] = useState("");

  useEffect(() => {
    const { type, id } = getCallParams();
    setCallType(type);
    setCallId(id);
    // TODO: Kết nối signaling (Stream/socket), lấy danh sách participants
    // setParticipants([...])
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center w-full max-w-2xl">
        <div className="mb-6 flex flex-col items-center w-full">
          {/* Hiển thị video grid cho group, 2 video cho direct */}
          <div
            className={`grid ${
              callType === "group"
                ? "grid-cols-2 md:grid-cols-3 gap-4"
                : "grid-cols-2 gap-8"
            } w-full justify-center mb-4`}
          >
            {/* Local video */}
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mx-auto">
              {/* TODO: Render local video stream */}
              <User className="w-20 h-20 text-gray-400" />
            </div>
            {/* Remote video(s) */}
            {callType === "group" ? (
              participants.map((p) => (
                <div
                  key={p.id}
                  className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mx-auto"
                >
                  {/* TODO: Render remote video stream */}
                  <User className="w-20 h-20 text-gray-400" />
                </div>
              ))
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mx-auto">
                {/* TODO: Render remote video stream */}
                <User className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-purple-700 mb-1">
            {callType === "group" ? "Đang gọi nhóm..." : "Đang gọi..."}
          </h2>
          <p className="text-gray-500">Đang kết nối cuộc gọi của bạn</p>
        </div>
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={() => setMicOn((v) => !v)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-md transition-all duration-200 ${
              micOn
                ? "bg-purple-500 hover:bg-purple-600"
                : "bg-gray-400 hover:bg-gray-500"
            }`}
            aria-label={micOn ? "Tắt mic" : "Bật mic"}
          >
            {micOn ? (
              <Mic className="w-7 h-7" />
            ) : (
              <MicOff className="w-7 h-7" />
            )}
          </button>
          <button
            onClick={() => setCamOn((v) => !v)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-md transition-all duration-200 ${
              camOn
                ? "bg-purple-500 hover:bg-purple-600"
                : "bg-gray-400 hover:bg-gray-500"
            }`}
            aria-label={camOn ? "Tắt camera" : "Bật camera"}
          >
            {camOn ? (
              <Video className="w-7 h-7" />
            ) : (
              <VideoOff className="w-7 h-7" />
            )}
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-200"
            aria-label="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
