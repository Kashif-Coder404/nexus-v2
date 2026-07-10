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

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
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

// Serve frontend assets
app.use(express.static(path.join(__dirname, "../frontend")));

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

export default app;
