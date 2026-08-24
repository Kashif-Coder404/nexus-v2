import { NextFunction } from "express";
import { SessionModel } from "../../db/schema/session-schema.js";

const sessionAuthentication = async (
  req: any,
  res: any,
  next: NextFunction,
) => {
  const sessionId: any = req.headers["x-session-id"] || req.body.sessionId;
  const session = await SessionModel.findOne({  
    _id: sessionId,
    userId: req.userId,
  });
  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Session is not Found!",
      data: null,
    });
  }
  req.sessionId = session._id;
  next();
};
const newSession = async (req: any, res: any, next: NextFunction) => {
  const session: any = await SessionModel.create({
    userId: req.userId,
  });
  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Session is not Created!",
      data: null,
    });
  }
  req.sessionId = session._id;
  next();
};
export { sessionAuthentication, newSession };
