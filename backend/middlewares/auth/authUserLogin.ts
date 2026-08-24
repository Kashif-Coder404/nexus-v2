import { NextFunction } from "express";
import { UserModel } from "../../db/schema/user-schema.js";

const userAuthentication = async (req: any, res: any, next: NextFunction) => {
  try {
    const userId =
      req.headers["x-user-id"] || req.headers.userid || req.body?.userId;
    const { email, password } = req.body || {};

    let user: any = null;

    // 1. If userId is provided (Protected routes: new-chat, chat, etc.)
    if (userId) {
      user = await UserModel.findById(userId);
    }
    // 2. If credentials are provided (Login route)
    else if (email && password) {
      user = await UserModel.findOne({ email, password });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid credentials or User not found",
        data: null,
      });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during authentication",
      data: null,
    });
  }
};

const UserLogin = async (req: any, res: any) => {
  return res.status(200).json({
    success: true,
    message: "Login Successful",
    data: {
      user: {
        id: req.user?._id || req.userId,
        name: req.user?.name,
        email: req.user?.email,
        role: req.user?.role,
      },
    },
  });
};
export { userAuthentication, UserLogin };
