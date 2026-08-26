import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";
import { Logs } from "./Logs.js";
import cors from "cors";
import { finalLog, logging } from "./middlewares/logs/logging.js";
import { connectDB } from "./db/connectDB.js";
import { updateMemory } from "./services/memory.service.js";
import {
  userAuthentication,
  UserLogin,
} from "./middlewares/auth/authUserLogin.js";
import { chatAuthentication } from "./middlewares/auth/chatVerification.js";
import {
  newSession,
  sessionAuthentication,
} from "./middlewares/auth/sessionVerification.js";
import { authSignup, SignUp } from "./middlewares/auth/authUserSignup.js";
import { getChat, updateChatHandler } from "./services/chat.history.service.js";
import { broadCastMessage } from "./services/websocket.service.js";
import authRoutes from "./routes/auth.routes.js";
connectDB();
dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void => {
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      Logs("Invalid JSON payload received", "error", {
        method: req.method,
        path: req.path,
        headers: req.headers,
        errorMessage: err.message,
      });
      res.status(400).json({
        success: false,
        message: "Invalid JSON payload",
        data: null,
      });
      return;
    }
    next(err);
  },
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. HEALTH CHECK ---
app.get("/api/health", async (req, res) => {
  Logs("Health checking endpoint accessed", "info");
  res.status(200).json({
    success: true,
    message: "Health check successful",
    data: {
      lastAIMsg: "Hi there! What can I do for you?",
      lastCMD: "",
      terminal: "",
      terminalError: "",
    },
  });
});

app.use("/api/chat", logging, finalLog, chatRoutes);
app.post("/api/memory", async (req, res) => {
  const { category, value, alias } = req.body;
  return res.json({ response: await updateMemory(alias, value, category) });
});
app.use("/api/auth", authRoutes);

app.post("/api/testWS", (req, res) => {
  const { msg } = req.body;
  broadCastMessage({
    data: {
      responsemsg: msg,
    },
  });
  res.status(200).json({
    success: true,
    message: "Message Added",
    data: msg,
  });
});
export default app;
