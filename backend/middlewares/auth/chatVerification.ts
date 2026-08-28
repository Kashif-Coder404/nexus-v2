import { NextFunction } from "express";
import { ChatModel, IChat } from "../../db/schema/chat-schema.js";

const chatAuthentication = async (req: any, res: any, next: NextFunction) => {
  const chat: IChat | any = await ChatModel.findOne({
    sessionId: req.sessionId,
    userId: req.userId,
  });
  req.chat = chat || null;
  next();
};

export { chatAuthentication };
