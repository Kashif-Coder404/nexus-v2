import { ChatMessageType } from "../AI/Types.js";
import { GEMINI_API2, initializeKeys, MONGO_URI } from "../EnvVariables.js";
import { connectDB } from "../db/connectDB.js";
import { ChatModel } from "../db/schema/chat-schema.js";
export const getChatHistory = async (
  userId: string,
  session: string,
  lastMsgCount: number = 10,
) => {
  try {
    type Chat = {
      _id: object;
      chatMessage: [
        {
          role: "user" | "assistant";
          content: string;
          _id: object;
        },
      ];
    };
    const chatHistory: any = await ChatModel.findOne(
      { userId: userId, sessionId: session },
      { chatMessage: { $slice: -lastMsgCount } },
    );

    return chatHistory?.chatMessage.map((msg: any) => {
      return {
        role: msg.role,
        content: msg.content,
      };
    });
    // if (!chatHistory) return [];
    // return chatHistory?.chatMessage.map((chatMsg: ChatMessageType) => {
    //   return {
    //     role: chatMsg.role,
    //     content: chatMsg.content,
    //   };
    // });
  } catch (error) {
    console.error("[CHAT HISTORY SERVICE] Error getting history:", error);
    return [];
  }
};
export const setChatHistory = async (
  session: string,
  chatMessage: ChatMessageType[],
) => {
  try {
    return await ChatModel.insertOne({
      sessionId: session,
      chatMessage: chatMessage,
    });
  } catch (error) {
    console.error("[CHAT HISTORY SERVICE] Error setting history:", error);
    return false;
  }
};
export const deleteChatHistory = async (session: string) => {
  try {
    return await ChatModel.deleteMany({ sessionId: session });
  } catch (error) {
    console.error("[CHAT HISTORY SERVICE] Error deleting history:", error);
    return false;
  }
};
export const updateChatHistory = async (
  session: string,
  chatMessage: any[],
) => {
  try {
    return await ChatModel.updateOne(
      { sessionId: session },
      { $set: { chatMessage: chatMessage } },
    );
  } catch (error) {
    console.error("[CHAT HISTORY SERVICE] Error updating history:", error);
    return false;
  }
};
