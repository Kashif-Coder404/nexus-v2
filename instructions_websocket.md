# WebSocket Authentication & Modular Setup Instructions

Hi,

As the Senior Architect on this project, I want you to implement the authenticated WebSocket features on both the backend and web frontend. To keep the code clean, we will implement the WebSocket logic in a dedicated service file, keeping `server.ts` clean.

Please follow these step-by-step instructions.

---

## 📋 Developer Action Items

### Task 1: Install Backend Dependencies
Open your terminal, navigate to the `backend/` directory, and install `ws` (WebSockets library) and its TypeScript definitions:

```bash
npm install ws
npm install -D @types/ws
```

---

### Task 2: Create the WebSocket Service File
Create a new file at [backend/services/ws.service.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/ws.service.ts).

**Implementation Details**:
* Handles setting up the `WebSocketServer` instance.
* Extracts the token from query parameters (`req.url`) during connection: `ws://localhost:3100?token=MyCurrentAPI`.
* Compares it against `process.env.API_FOR_AUTHENTICATION`. If missing or invalid, immediately rejects and closes the connection with code `4001` (Unauthorized).
* Exports a `broadcast(data: object)` helper to send JSON strings to all open client sockets.

**Code Template**:
```typescript
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import url from "url";
import dotenv from "dotenv";

dotenv.config();

let wss: WebSocketServer | null = null;

/**
 * Initializes the WebSocket Server and attaches it to the HTTP Server
 */
export function initWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
    // 1. Extract token from connection query params (e.g. ws://localhost:3100?token=MyCurrentAPI)
    const parameters = url.parse(req.url || "", true).query;
    const token = parameters.token;
    const secretKey = process.env.API_FOR_AUTHENTICATION;

    // 2. Validate token
    if (!token || token !== secretKey) {
      ws.send(JSON.stringify({ success: false, message: "Unauthorized WebSocket connection" }));
      ws.close(4001, "Unauthorized");
      return;
    }

    console.log("🔌 Client authenticated and connected to WebSocket.");

    ws.on("close", () => {
      console.log("🔌 Client disconnected from WebSocket.");
    });
  });

  return wss;
}

/**
 * Broadcasts JSON payload to all connected and authenticated WebSocket clients
 */
export function broadcast(data: object) {
  if (!wss) {
    console.warn("⚠️ WebSocket Server has not been initialized yet.");
    return;
  }

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
```

---

### Task 3: Initialize WebSockets in `server.ts`
Modify [backend/server.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/server.ts).

**Implementation Details**:
* Convert the Express `app.listen(...)` call to use a native HTTP server wrapper: `const server = http.createServer(app)`.
* Import and run `initWebSocket(server)` to attach WebSockets.
* Start the server on `server.listen(PORT)`.

**Code Template**:
```typescript
import http from "http";
import app from "./app.js";
import { initWebSocket } from "./services/ws.service.js"; // Import socket initializer
import dotenv from "dotenv";

dotenv.config();

const PORT: number = 3100;

// Wrap express app in an HTTP server
const server = http.createServer(app);

// Initialize WebSockets
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server attached and listening on ws://localhost:${PORT}`);
});
```

---

### Task 4: Broadcast Stream Messages from Controller
Open [backend/controllers/chat.controller.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/controllers/chat.controller.ts).

**Implementation Details**:
* Import `broadcast` from `../services/ws.service.js`.
* Broadcast a live progress update message at the beginning of the `sendMessage` function to test the WebSocket integration:

**Code Snippet**:
```typescript
import { broadcast } from "../services/ws.service.js";

export const sendMessage = async (req: any, res: any) => {
  const { message, session } = req.body;
  
  // ... input validation ...

  try {
    // 1. Broadcast an update to the frontend via WebSockets
    broadcast({
      event: "system_status",
      msg: `Received: "${message}". Processing command execution...`,
    });

    await Logs("Processing new chat message request", "info", { message });
    // ... rest of the code ...
```

---

### Task 5: Connect Frontend to WebSockets
Open [frontend/src/components/Chat.tsx](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/components/Chat.tsx).

**Implementation Details**:
* Create a React `useEffect` hook to connect to the WebSocket server on component mount.
* Read the API key from your environment: `import.meta.env.VITE_NEXUS_API_KEY`.
* Connect with the token: `new WebSocket("ws://localhost:3100?token=" + apiKey)`.
* Listen to `onmessage` events. When a `system_status` event is received, append it directly into your `chatHistory` state.
* Make sure to return a cleanup function from the hook: `ws.close()`.

**Code Template**:
```typescript
  useEffect(() => {
    const apiKey = import.meta.env.VITE_NEXUS_API_KEY || "";
    // Connect to WebSocket with token
    const ws = new WebSocket(`ws://localhost:3100?token=${apiKey}`);

    ws.onopen = () => {
      console.log("🔌 Web frontend connected to WebSocket server.");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket event received: ", data);

        if (data.event === "system_status") {
          // Add status stream message into the chat UI log
          setChatHistory((prev: any) => [
            ...prev,
            {
              id: Date.now(),
              role: "nexus",
              content: {
                msg: data.msg,
                cmd: "",
                terminal: "",
                terminalError: "",
              },
            },
          ]);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("🔌 Web frontend disconnected from WebSocket server.");
    };

    return () => {
      ws.close();
    };
  }, []);
```

---

## 🧪 Verification Tasks

1. **Start the backend server**: Run `npm run dev:server` in the `backend/` directory.
2. **Start the frontend app**: Run `npm run dev` in the `frontend/` directory.
3. **Open the browser console**: Check if the log `🔌 Web frontend connected to WebSocket server` is printed.
4. **Send a chat message**: Check if the live WebSocket message `"Received: <message>. Processing command execution..."` appears on the screen before the final AI reply.
