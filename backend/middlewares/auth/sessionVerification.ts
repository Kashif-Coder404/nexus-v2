import { NextFunction } from "express";
import { SessionModel } from "../../db/schema/session-schema.js";

const sessionAuthentication = async (
  req: any,
  res: any,
  next: NextFunction,
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User authentication required!",
        data: null,
      });
    }

    const sessionId: any = req.headers["x-session-id"] || req.body.sessionId;

    //Create new Session if no SessionID Given (Default)
    if (!sessionId) {
      const session = await newSession(req.userId);
      if (!session.success) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Session cannot be created!",
          data: null,
        });
      }
      req.sessionId = session.sessionId;
      return next();
    }
    //Return If Session ID Is Not Valid
    const session = await SessionModel.findOne({
      _id: sessionId,
      userId: req.userId,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Chat Session Not Found with current User",
        data: null,
      });
    }

    req.sessionId = session._id;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid Session ID format!",
      data: null,
    });
  }
};
const newSession = async (userId: string) => {
  const session: any = await SessionModel.create({
    userId,
  });
  if (!session) {
    return {
      success: false,
      message: "Unauthorized: Session is not Created!",
      data: null,
      sessionId: null,
    };
  }
  return {
    success: true,
    message: "Session Created Successfully",
    data: session,
    sessionId: session._id,
  };
};
export { sessionAuthentication, newSession };
