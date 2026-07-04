import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";
import { extractJSON } from "./AI/askAI.js";
import { Logs } from "./Logs.js";
import cors from "cors";
import { apiCall } from "./AI/AICall.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3100;
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// JSON Parsing Error Handler
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
      res.status(400).json({ error: "Invalid JSON payload" });
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
  res.status(200).send({
    role: "Nexus",
    content: {
      msg: "Hi there! What can I do for you?",
      cmd: "",
      terminal: "",
      terminalError: "",
    },
  });
});

app.use("/api/chat", chatRoutes);

// --- 3. SERVER BOOT ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.set("wss", wss);

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected to WebSocket.");
  ws.on("close", () => console.log("Client disconnected from WebSocket."));
});

// --- HELPER FUNCTION: BROADCAST TO WEBSOCKETS ---

server.listen(PORT, () => {
  console.log(`🚀 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
});
