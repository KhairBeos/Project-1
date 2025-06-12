import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const Toast = ({ message, type = "info", duration = 3000, onClose, showCloseButton = true }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Icon cho từng loại toast
  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 mr-3 flex-shrink-0" };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  useEffect(() => {
    // Fade in ngay khi component mount
    setIsVisible(true);

    // Tự động fade out sau duration (nếu có duration)
    let timer;
    if (duration > 0) {
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [duration]);

  // Handle close với animation
  const handleClose = () => {
    setIsVisible(false);
    // Gọi onClose sau khi animation fade out hoàn thành
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // 300ms là thời gian transition
  };

  // Màu sắc phù hợp với theme purple/indigo
  const toastStyles = {
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
    error: "bg-gradient-to-r from-red-500 to-pink-600 text-white",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
    info: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
    default: "bg-white/90 backdrop-blur-lg border border-purple-200 text-gray-800 shadow-xl",
  };

  return (
    <div
      role="alert" // Accessibility cho screen reader
      aria-live="polite" // Screen reader sẽ đọc khi toast xuất hiện
      className={`
        fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg 
        transition-all duration-300 ease-in-out transform
        flex items-center justify-between max-w-md
        ${toastStyles[type] || toastStyles.default}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <div className="flex items-center flex-1">
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
      </div>
      
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="ml-3 text-white/80 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Toast Manager để quản lý multiple toasts và tránh spam
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const [lastToast, setLastToast] = useState(null);

  // Thêm toast với debounce để tránh spam
  const addToast = (toastData) => {
    const toastKey = `${toastData.type}-${toastData.message}`;
    
    // Chỉ thêm nếu toast khác với toast trước đó
    if (lastToast !== toastKey) {
      const newToast = {
        id: Date.now() + Math.random(),
        ...toastData,
      };
      
      setToasts(prev => [...prev, newToast]);
      setLastToast(toastKey);
      
      // Reset lastToast sau một khoảng thời gian để cho phép toast tương tự xuất hiện lại
      setTimeout(() => setLastToast(null), 1000);
    }
  };

  // Remove toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Toast Container component
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * -80}px)`, // Stack toasts
            zIndex: 50 - index, // Ensure proper layering
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            showCloseButton={toast.showCloseButton}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );

  return { addToast, ToastContainer };
};

export default Toast;