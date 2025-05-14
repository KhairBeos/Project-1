import { StreamChat } from "stream-chat";
import "dotenv/config";

// Lấy API key và secret từ biến môi trường
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  throw new Error("Missing Stream API key or secret in .env file");
}

// Khởi tạo client phía server
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

/**
 * Tạo hoặc cập nhật user trên Stream Chat.
 * @param {Object} userData - { id: string, name?: string, image?: string }
 */
export const upsertStreamUser = async (userData) => {
  try {
    if (!userData?.id) {
      throw new Error("User ID is required when upserting a Stream user");
    }

    await streamClient.upsertUser(userData);
    return userData;
  } catch (error) {
    console.error("Error creating/updating Stream user:", error.message);
    throw error;
  }
};

/**
 * Tạo JWT token để client kết nối với Stream.
 * @param {string} userId
 */
export const generateStreamToken = (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate Stream token");
  }

  return streamClient.createToken(userId);
};
