import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";
import { Logs } from "./Logs.js";
import cors from "cors";
import { finalLog, logging } from "./middlewares/logs/logging.js";
import authAPI from "./middlewares/auth/authenticateAPIkey.js";
import { connectDB } from "./db/connectDB.js";
import { updateMemory } from "./services/memory.service.js";
import { getHistory } from "./AI/LocalChatHistory.js";
import {
  userAuthentication,
  UserLogin,
} from "./middlewares/auth/authUserLogin.js";
import {
  chat,
  chatAuthentication,
} from "./middlewares/auth/chatVerification.js";
import {
  newSession,
  sessionAuthentication,
} from "./middlewares/auth/sessionVerification.js";
import { authSignup, SignUp } from "./middlewares/auth/authUserSignup.js";
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

app.use("/api/chat", logging, authAPI, finalLog, chatRoutes);
app.post("/api/memory", async (req, res) => {
  const { category, value, alias } = req.body;
  return res.json({ response: await updateMemory(alias, value, category) });
});
//ADD Chat history end point
app.post(
  "/api/chat",
  userAuthentication,
  sessionAuthentication,
  chatAuthentication,
  chat,
);
app.post("/api/login", userAuthentication, UserLogin);
app.post("/api/signup", authSignup, SignUp);
app.post(
  "/api/new-chat",
  userAuthentication,
  newSession,
  chat,
);
app.post("/api/summarize_image", async (req, res) => {
  const { buffer } = req.body;
  if (!buffer)
    return res.status(400).json({ success: false, msg: "Buffer is required" });
});

export default app;
