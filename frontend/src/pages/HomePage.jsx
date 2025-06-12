import { useEffect, useState } from "react";
import {
  MessageCircle,
  Shield,
  Users,
  Video,
  ArrowRight,
  Check,
  Star,
  Play,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast.jsx";

const HomePage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    // Auto-navigation logic
    if (authUser?.twoFactorEnabled && !authUser?.isTwoFAVerified) {
      navigate("/2fa");
    } else if (authUser?.isOnboarded) {
      navigate("/chat");
    }
  }, [authUser]);

  // Auto-rotate featured content
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: MessageCircle,
      title: "Chat thông minh",
      description:
        "Tin nhắn thời gian thực với AI assistant, tự động dịch ngôn ngữ",
      color: "purple",
      details: [
        "Tin nhắn thời gian thực",
        "AI chatbot hỗ trợ",
        "Dịch tự động",
        "Tìm kiếm nhanh",
      ],
    },
    {
      icon: Shield,
      title: "Bảo mật tối ưu",
      description:
        "Mã hóa end-to-end, xác thực 2FA qua email và authenticator app",
      color: "indigo",
      details: [
        "Mã hóa end-to-end",
        "2FA đa phương thức",
        "Quản lý phiên",
        "Kiểm soát quyền riêng tư",
      ],
    },
    {
      icon: Users,
      title: "Nhóm & Cộng đồng",
      description: "Tạo nhóm không giới hạn, quản trị viên, kênh chủ đề",
      color: "blue",
      details: [
        "Nhóm không giới hạn",
        "Phân quyền chi tiết",
        "Kênh chủ đề",
        "Sự kiện nhóm",
      ],
    },
    {
      icon: Video,
      title: "Video Call HD",
      description:
        "Gọi video chất lượng cao, chia sẻ màn hình, ghi âm cuộc gọi",
      color: "green",
      details: [
        "Video HD 1080p",
        "Chia sẻ màn hình",
        "Ghi âm cuộc gọi",
        "Hiệu ứng background",
      ],
    },
  ];

  const stats = [
    { number: "10M+", label: "Người dùng" },
    { number: "99.9%", label: "Uptime" },
    { number: "256-bit", label: "Mã hóa" },
    { number: "24/7", label: "Hỗ trợ" },
  ];

  const testimonials = [
    {
      name: "Nguyễn Văn A",
      role: "CEO, Tech Startup",
      content: "Ứng dụng chat tốt nhất tôi từng sử dụng. Bảo mật tuyệt vời!",
      rating: 5,
    },
    {
      name: "Trần Thị B",
      role: "Product Manager",
      content: "Giao diện đẹp, tính năng đầy đủ. Team chúng tôi rất hài lòng.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div
        className={`transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-4 py-2 mb-6 shadow-lg backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                🎉 Mới: Video call nhóm lên đến 50 người
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
              Chat App
              <br />
              <span className="text-3xl md:text-4xl">
                Kết nối không giới hạn
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Trải nghiệm chat thời gian thực với bảo mật hàng đầu, video call
              HD và giao diện hiện đại.
              <span className="font-semibold text-purple-700 block mt-2">
                ✨ Tính năng AI assistant và dịch tự động
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 hover:-translate-y-2"
              >
                Bắt đầu miễn phí
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  addToast({
                    message: "Tính năng demo sẽ sớm ra mắt!",
                    type: "info",
                  });
                  navigate("/login");
                }}
                className="inline-flex items-center gap-2 bg-white/80 text-purple-700 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-2xl backdrop-blur-sm border border-purple-200 hover:bg-white transform hover:scale-105 transition-all duration-500 hover:-translate-y-2"
              >
                <Play className="w-5 h-5" />
                Xem demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-purple-700 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Khám phá những tính năng mạnh mẽ giúp bạn kết nối và làm việc hiệu
              quả hơn
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === activeFeature;

              return (
                <div
                  key={index}
                  className={`
                    relative bg-white rounded-3xl p-8 shadow-lg border transition-all duration-500 cursor-pointer
                    ${
                      isActive
                        ? "scale-105 shadow-2xl border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50"
                        : "hover:shadow-xl border-gray-100 hover:scale-102"
                    }
                  `}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div
                    className={`
                    inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 shadow-lg
                    ${
                      feature.color === "purple"
                        ? "bg-gradient-to-br from-purple-500 to-purple-600"
                        : feature.color === "indigo"
                        ? "bg-gradient-to-br from-indigo-500 to-indigo-600"
                        : feature.color === "blue"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-green-500 to-green-600"
                    }
                  `}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            feature.color === "purple"
                              ? "bg-purple-500"
                              : feature.color === "indigo"
                              ? "bg-indigo-500"
                              : feature.color === "blue"
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Khách hàng nói gì
            </h2>
            <p className="text-gray-600">
              Hàng nghìn người dùng đã tin tưởng và sử ddụng Chat App
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng hàng triệu người dùng đang sử dụng Chat App để
            kết nối và làm việc hiệu quả hơn
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="bg-white text-purple-700 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-500 hover:-translate-y-2"
            >
              Tạo tài khoản miễn phí
            </button>
            <button
              // Không có route /contact, chỉ để giao diện, không onClick
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-purple-700 transform hover:scale-105 transition-all duration-500 hover:-translate-y-2"
            >
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-800">Chat App</span>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Kết nối • Bảo mật • Hiện đại
          </div>

          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Chat App. All rights reserved.
            Made with ❤️ in Vietnam
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
