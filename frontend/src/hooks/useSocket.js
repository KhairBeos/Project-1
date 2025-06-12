import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

// Remove process.env usage for frontend compatibility
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:9999";
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);

        // Auto reconnect unless manually disconnected
        if (reason !== "io client disconnect") {
          handleReconnect();
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError("Không thể kết nối đến server");
        setIsConnected(false);
        handleReconnect();
      });

      socketRef.current.on("error", (error) => {
        console.error("Socket error:", error);
        setError("Lỗi kết nối socket");
      });
    } catch (err) {
      console.error("Failed to create socket connection:", err);
      setError("Không thể tạo kết nối");
    }
  }, []);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= RECONNECT_ATTEMPTS) {
      setError("Không thể kết nối lại. Vui lòng tải lại trang.");
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts); // Exponential backoff

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnecting... Attempt ${reconnectAttempts + 1}`);
      setReconnectAttempts((prev) => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempts, connect]);

  // Join a room
  const joinRoom = useCallback((roomId) => {
    if (!socketRef.current?.connected || !roomId) return;

    socketRef.current.emit("join_room", roomId);
    console.log(`Joined room: ${roomId}`);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId) => {
    if (!socketRef.current?.connected || !roomId) return;

    socketRef.current.emit("leave_room", roomId);
    console.log(`Left room: ${roomId}`);
  }, []);

  // Send message
  const sendMessage = useCallback((messageData) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error("Socket not connected"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Message timeout"));
      }, 10000);

      socketRef.current.emit("send_message", messageData, (response) => {
        clearTimeout(timeout);

        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Failed to send message"));
        }
      });
    });
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((roomId, isTyping) => {
    if (!socketRef.current?.connected || !roomId) return;

    socketRef.current.emit("typing", {
      roomId,
      isTyping,
    });
  }, []);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnectAttempts,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
  };
};

export default useSocket;
