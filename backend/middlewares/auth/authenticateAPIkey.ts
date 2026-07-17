import { RequestHandler } from "express";
import dotenv from "dotenv";
dotenv.config();

const authAPI: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authorization header is required",
      data: null,
    });
    return;
  }

  const authenticateKey = process.env.API_FOR_AUTHENTICATION;
  if (!authenticateKey) {
    res.status(500).json({
      success: false,
      message: "API key is not configured on the server",
      data: null,
    });
    return;
  }

  // Support both "Bearer <key>" and raw "<key>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;
  if (token !== authenticateKey) {
    res.status(401).json({
      success: false,
      message: "Invalid API key",
      data: null,
    });
    return;
  }

  next();
};

export default authAPI;
