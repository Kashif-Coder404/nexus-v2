import { NextFunction } from "express";
import { UserModel } from "../../db/schema/user-schema.js";
import { generateToken } from "../../services/jwt.service.js";
import { verifyToken } from "../../services/jwt.service.js";

const userAuthentication = async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: JWT Token is not provided!",
        data: null,
      });
    }
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;
    const decodedToken: any = verifyToken(token);
    if (!decodedToken.success) {
      return res.status(401).json({
        success: false,
        message: decodedToken.error,
        data: null,
      });
    }
    const userId = decodedToken.token.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
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

const UserLoginHandler = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const findResults: any = await UserLogin(email, password);
    return res.status(findResults.success ? 200 : 401).json(findResults);
  } catch (error: any) {
    if (error instanceof TypeError) {
      return res.status(401).json({
        success: false,
        message: "Invalid Payload!",
        data: null,
      });
    }
    return res.status(500).json({
      success: false,
      message: error || "Internal server error during login",
      data: null,
    });
  }
};
const UserLogin = async (email: string, password: string) => {
  if (!email && !password) {
    return {
      success: false,
      message: "Unauthorized: Provide the email and password!",
      data: null,
    };
  }
  const user = await UserModel.findOne({ email, password });
  if (!user) {
    return {
      success: false,
      message: "Unauthorized: Invalid credentials or try signup",
      data: null,
    };
  }
  const jwtToken: string | null = generateToken({
    userId: user._id.toString(),
  });
  if (!jwtToken) {
    return {
      success: false,
      message: "Failed to Generate JWT Token!",
      data: null,
    };
  }
  return {
    success: true,
    message: "Login Successful",
    data: {
      user: user,
      token: jwtToken,
    },
  };
};
export { userAuthentication, UserLogin, UserLoginHandler };
