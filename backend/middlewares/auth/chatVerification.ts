import { NextFunction } from "express";
import { ChatModel, IChat } from "../../db/schema/chat-schema.js";

const chatAuthentication = async (req: any, res: any, next: NextFunction) => {
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

export { chatAuthentication };
