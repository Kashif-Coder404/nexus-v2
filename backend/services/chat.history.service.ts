import { ChatModel } from "../db/schema/chat-schema.js";

export const getChatHistory = async (lastMsgCount: number = 10) => {
  try {
    return await ChatModel.find().sort({ createdAt: -1 }).limit(lastMsgCount);
  } catch (error) {
    console.error("Error getting chat history:", error);
    return [];
  }
};
export const setChatHistory = async (chatMessage: any[]) => {
  try {
    return await ChatModel.insertMany(chatMessage);
  } catch (error) {
    console.error("Error setting chat history:", error);
    return false;
  }
};
export const deleteChatHistory = async () => {
  try {
    return await ChatModel.deleteMany({});
  } catch (error) {
    console.error("Error deleting chat history:", error);
    return false;
  }
};