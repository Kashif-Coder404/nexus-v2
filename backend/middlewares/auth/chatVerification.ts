import { NextFunction } from "express";
import { ChatModel, IChat } from "../../db/schema/chat-schema.js";

const chatAuthentication = async (req: any, res: any, next: NextFunction) => {
  const sessionId =
    req.headers["x-session-id"] || req.headers.sessionId || req.body.sessionId;
  if (!req.userId || !sessionId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User Id or Session Id is not Given!",
      data: null,
    });
  }
  req.sessionId = sessionId;
  const chat: IChat | any = await ChatModel.findOne({
    sessionId: req.sessionId,
    userId: req.userId,
  });
  if (!chat) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Chat is not Found!",
      data: null,
    });
  }
  req.chat = chat;
  next();
};
const chat = async (req: any, res: any) => {
  try {
    const { role = "user", content } = req.body;
    if (!content) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please Provide Content",
        data: null,
      });
    }
    const updatedChat: any = await ChatModel.findOneAndUpdate(
      {
        sessionId: req.sessionId,
        userId: req.userId,
      },
      {
        $push: {
          chatMessage: {
            role,
            content,
          },
        },
        updatedAt: new Date(),
      },
      { new: true, upsert: true },
    );
    if (!updatedChat) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Chat is not Found!",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Message Added",
      data: updatedChat,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};
export { chatAuthentication, chat };
