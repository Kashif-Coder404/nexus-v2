import { responseEncoding } from "axios";
import { ChatMessageType } from "../AI/Types.js";
import { ChatModel } from "../db/schema/chat-schema.js";
import { SessionModel } from "../db/schema/session-schema.js";
const getChat = async (
  userId: string,
  session: string,
  lastMsgCount: number = 10,
): Promise<{ success: boolean; chat: ChatMessageType[] | null }> => {
  try {
    const chatHistory: any = await ChatModel.findOne(
      { userId: userId, sessionId: session },
      { chatMessage: { $slice: -lastMsgCount } },
    );
    if (!chatHistory) {
      return { success: false, chat: null };
    }
    const chat = chatHistory?.chatMessage.map((msg: any) => {
      return {
        role: msg.role,
        content: msg.content,
      };
    });
    return {
      success: true,
      chat,
    };
  } catch (error: any) {
    console.error("[CHAT HISTORY SERVICE] Error getting history:", error);
    return { success: false, chat: null };
  }
};
const getChatHandler = async (req: any, res: any) => {
  try {
    const { lastMsgCount = 10 } = req.query;
    const result: any = await getChat(req.userId, req.sessionId, lastMsgCount);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Chat is not Found!",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Chat History",
      data: { chat: result.chat },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
const setChat = async (
  userId: any,
  sessionId: any,
  data: ChatMessageType[] | ChatMessageType,
) => {
  try {
    const itemsToPush = Array.isArray(data) ? { $each: data } : data;
    const updateChat = await ChatModel.findOneAndUpdate(
      {
        sessionId: sessionId,
        userId: userId,
      },
      {
        $push: {
          chatMessage: itemsToPush,
        },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after", upsert: true },
    );
    if (!updateChat) {
      return { success: false, doc: null };
    }
    return { success: true, doc: updateChat };
  } catch (error: any) {
    return { success: false, doc: error.message };
  }
};
const updateChatHandler = async (req: any, res: any) => {
  try {
    const { role = "user", content } = req.body;
    if (!content) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please Provide Content",
        data: null,
      });
    }
    const result = await setChat(req.userId, req.sessionId, {
      role: role,
      content,
    });
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Chat is not Found!",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Message Added",
      data: result.doc,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
const deleteChat = async (userId: string, sessionId: string) => {
  try {
    const deletedChat: any = await ChatModel.findOneAndDelete({
      sessionId,
      userId,
    });
    if (!deletedChat) {
      return {
        success: false,
        message: "Unauthorized: Chat is not Found!",
        doc: null,
      };
    }
    return {
      success: true,
      message: "Chat Deleted",
      doc: deletedChat,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      doc: null,
    };
  }
};
const deleteSession = async (userId: string, sessionId: string) => {
  try {
    const result = await SessionModel.deleteOne({
      _id: sessionId,
      userId,
    });
    if (!result) {
      return {
        success: false,
        message: "Unauthorized: session not found",
        doc: null,
      };
    }
    return { success: true, message: "session Deleted", doc: result };
  } catch (error: any) {
    return { success: false, message: error.message, doc: null };
  }
};
const delete_Chat_Session_Handler = async (req: any, res: any) => {
  try {
    const chat_delete = await deleteChat(req.userId, req.sessionId);
    if (!chat_delete.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Chat is not Found!",
        data: null,
      });
    }
    const session_delete = await deleteSession(req.userId, req.sessionId);
    if (!session_delete.success) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Session is not Found!",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Chat Session Deleted",
      data: chat_delete.doc, //Can be remove !
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
(async () => {
  // let tempAiResponse: any = {
  //   role: "user",
  //   content: "hello i am kashif!",
  // };
  // let results2: any = await setChat(
  //   "6a8bdcf4abce18495b3ba269",
  //   "6a8bdcfeabce18495b3ba26a",
  //   tempAiResponse,
  // );
  // console.log(results2.doc.chatMessage);
  // const result: any = await getChat(
  //   "6a8bdcf4abce18495b3ba269",
  //   "6a8bdcfeabce18495b3ba26a",
  // );
  // console.log(result);
  // let results3: any = await deleteChat(
  //   "6a8bdcf4abce18495b3ba269",
  //   "6a8bdcfeabce18495b3ba26a",
  // );
  // console.log(results3);
})();
export {
  getChatHandler,
  updateChatHandler,
  delete_Chat_Session_Handler,
  getChat,
  setChat,
};
