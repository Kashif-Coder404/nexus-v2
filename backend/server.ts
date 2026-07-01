import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import { AskAI } from "./askAI.js";

dotenv.config();

const execPromise = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.json());

// JSON Parsing Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    console.error("❌ [JSON PARSING ERROR] Invalid JSON payload received:");
    console.error("Method:", req.method);
    console.error("Path:", req.path);
    console.error("Headers:", req.headers);
    console.error("Error Message:", err.message);
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }
  next(err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend assets
app.use(express.static(path.join(__dirname, "../frontend")));

// --- 1. HEALTH CHECK ---
app.get("/api/health", (req, res) => {
  console.log("Health Checking!");
  res.json({ status: "OK", message: "Nexus v2 monolith is online!" });
});

// --- 2. HTTP CHAT & EXECUTION LOOP ---
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const wss: WebSocketServer = req.app.get("wss");

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    // TODO: Step 1. Call AI to get first command & response message
    const { cmd, msg, terminalOutput } = await AskAI(message);

    // TODO: Step 2. Start a loop (e.g. while retry < 6)
    // TODO: Step 3. Execute command using execPromise(cmd)
    // TODO: Step 4. Send live command execution stdout/stderr to WebSocket
    // TODO: Step 5. Feed stdout back to the AI and check if there's a next command

    // Broadcast status to web sockets as a test:
    broadcast(wss, {
      event: "system_status",
      msg: `Received: "${message}". Processing...`,
    });

    res.json({
      lastAIMsg: msg,
      lastCMD: cmd,
      terminal: terminalOutput || "Success",
      terminalError: "",
    });
  } catch (error: any) {
    console.error("Error in chat execution:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- 3. SERVER BOOT ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.set("wss", wss);

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected to WebSocket.");
  ws.on("close", () => console.log("Client disconnected from WebSocket."));
});

// --- HELPER FUNCTION: BROADCAST TO WEBSOCKETS ---
function broadcast(wssServer: WebSocketServer, data: object) {
  wssServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(PORT, () => {
  console.log(`🚀 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
});
