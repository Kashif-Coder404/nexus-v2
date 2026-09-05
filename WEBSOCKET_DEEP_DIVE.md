# Nexus WebSocket Architecture & Code Deep Dive 🚀

This document is a comprehensive, line-by-line engineering breakdown of how the Cloud Backend (`backend/services/websocket.service.ts`) and Local Companion Backend (`Local-BE/services/ws.service.ts`) communicate securely to control your local Windows PC across the internet.

---

## 📑 Table of Contents
1. [High-Level Architectural Overview](#1-high-level-architectural-overview)
2. [Deep Dive: Cloud Backend (`websocket.service.ts`)](#2-deep-dive-cloud-backend-websocketservicets)
   - [A. Custom Types & State Tracking](#a-custom-types--state-tracking)
   - [B. Authentication & Token Verification (`connectDevice`)](#b-authentication--token-verification-connectdevice)
   - [C. Connection Lifecycle & Message Routing (`initWebsocket`)](#c-connection-lifecycle--message-routing-initwebsocket)
   - [D. Remote Command Invocation (`sendCmdRequest` - The Promise Map)](#d-remote-command-invocation-sendcmdrequest---the-promise-map)
   - [E. Pairing Handshake (`startParingHandler`)](#e-pairing-handshake-startparinghandler)
   - [F. Device Revocation (`revokeDevice`)](#f-device-revocation-revokedevice)
3. [Deep Dive: Local Companion Backend (`ws.service.ts`)](#3-deep-dive-local-companion-backend-wsservicets)
   - [A. Paths, Storage & Token Persistence](#a-paths-storage--token-persistence)
   - [B. Pairing Code Generation & Anti-Spam Lock](#b-pairing-code-generation--anti-spam-lock)
   - [C. Establishing Connection (`ServerWSConnection`)](#c-establishing-connection-serverwsconnection)
   - [D. Message Dispatcher (`RunCMD`, `PairingSuccess`, `PairingFailed`)](#d-message-dispatcher-runcmd-pairingsuccess-pairingfailed)
   - [E. Resilience & Auto-Reconnection Loop](#e-resilience--auto-reconnection-loop)
4. [Message Types & Payload Reference Table](#4-message-types--payload-reference-table)

---

## 1. High-Level Architectural Overview

Web applications run in sandboxed cloud environments (Render, AWS, etc.). They have no native ability to reach through firewalls and open programs or search files on a user's Windows PC.

Nexus solves this by establishing a **persistent reverse WebSocket bridge**:

```
[ Browser UI ]
      │
   (HTTP)
      ▼
[ Cloud Backend (Render) ] ◄══════ (Persistent WSS Tunnel) ══════► [ Local-BE (Your Windows PC) ]
  - websocket.service.ts                                             - ws.service.ts
  - Maps command IDs to Promises                                     - Executes CMD / PowerShell
  - Verifies JWTs via MongoDB                                        - Searches drives C:/, D:/
```

Because **your local PC initiates the connection outward to the cloud**, your home router, NAT, and Windows Defender Firewall allow it without needing port forwarding or public IP addresses.

---

## 2. Deep Dive: Cloud Backend (`websocket.service.ts`)

### A. Custom Types & State Tracking

```typescript
// Lines 9–16
export interface CustomWebSocket extends WebSocket {
  userId?: string;
  deviceId?: string;
  isAuthenticated?: boolean;
  pairingCode?: string;
}

const pendingRequests = new Map();
```

#### What this does & Why it's written this way:
1. **`CustomWebSocket` interface**:
   - The standard `WebSocket` class from the `ws` library only knows how to send and receive raw bytes/strings.
   - By extending `WebSocket`, TypeScript allows us to attach metadata directly to the connection object (`ws.userId`, `ws.deviceId`, `ws.isAuthenticated`, `ws.pairingCode`).
   - **Why?** Attaching state directly to the socket object eliminates the need to maintain complex lookup maps between sockets and users. When a socket disconnects, its state is cleaned up automatically.
2. **`pendingRequests = new Map()`**:
   - Stores commands that were sent down to a user's PC and are currently waiting for execution to finish.
   - **Structure**:
     - **Key**: `requestId` (`UUID` string, e.g. `"b83f47-..."`)
     - **Value**: `{ resolve, reject, timer }`
   - This is the foundation of the **Async RPC (Remote Procedure Call)** pattern.

```typescript
// Lines 20–24
function sendJson(ws: WebSocket, payload: Record<string, any>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
```
- **Why this defensive helper exists**: Calling `ws.send()` on a socket that is currently connecting (`CONNECTING`) or in the middle of closing (`CLOSING` / `CLOSED`) throws an unhandled exception in Node.js. Checking `ws.readyState === WebSocket.OPEN` guarantees the server won't crash if network packets are sent during a disconnect.

---

### B. Authentication & Token Verification (`connectDevice`)

```typescript
// Lines 32–87
const connectDevice = async (ws: CustomWebSocket, token: string): Promise<void> => {
  const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
  const decodedToken = verifyToken(actualToken) as JwtPayload;
  ...
```

#### Step-by-Step Logic:
1. **Token Sanitization**: Checks if the token has the HTTP `"Bearer "` prefix and strips it.
2. **JWT Verification (`verifyToken`)**: Cryptographically verifies the signature using the backend's secret key. If tampered or expired, it immediately sends:
   ```json
   { "type": "PairingFailed", "message": "Invalid token or Expired", "data": null }
   ```
3. **Double Verification Against MongoDB**:
   ```typescript
   if (decodedDeviceId) {
     const user = await UserModel.findOne({
       _id: decodedUserId,
       "devices._id": decodedDeviceId,
       "devices.deviceToken": actualToken,
     });
   ```
   - **Why check the database if the JWT is already valid?**
     A JWT is stateless — once signed, it remains valid until its expiration date (30 days). If a user clicks "Unpair Device" in the web UI, the JWT would technically still pass cryptographic verification!
     By checking `UserModel.findOne(...)` against MongoDB, if the device was revoked, the database query returns `null`, and the server immediately rejects the connection.
4. **Tagging the Socket**:
   ```typescript
   ws.isAuthenticated = true;
   ws.userId = decodedUserId;
   ws.deviceId = decodedDeviceId || "web_client";
   ```
   - If a connection has no `deviceId`, it's tagged as `"web_client"` (a web browser). If it has a `deviceId`, it's recognized as a paired Windows PC.

---

### C. Connection Lifecycle & Message Routing (`initWebsocket`)

```typescript
// Lines 89–105
const initWebsocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: CustomWebSocket, req: any) => {
    const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
    const queryToken = url.searchParams.get("token");
    const authHeader = req.headers["authorization"] || req.headers["Authorization"] || queryToken;
    if (authHeader) {
      await connectDevice(ws, authHeader);
    }
```

#### Why check both `headers` AND `queryToken`?
- Standard Node.js clients (`Local-BE`) can send custom HTTP headers like `Authorization: Bearer <token>` when establishing a WebSocket.
- **Web browsers (`new WebSocket(url)`) in JavaScript CANNOT send custom headers!**
- By checking `url.searchParams.get("token")`, browser clients can authenticate via `wss://.../?token=xyz`.

#### Message Handling Loop:
```typescript
// Lines 106–126
ws.on("message", async (event: any) => {
  const data = event.toString();
  const parsedData = JSON.parse(data);

  if (parsedData.type === "PairingInit") {
    ws.pairingCode = parsedData.code;
  } else if (parsedData.type === "cmd_response") {
    if (ws.isAuthenticated) {
      const { requestId, cmdResponse } = parsedData;
      const requestHandler = pendingRequests.get(requestId);
      if (requestHandler) {
        if (requestHandler.timer) {
          clearTimeout(requestHandler.timer);
        }
        requestHandler.resolve(cmdResponse);
        pendingRequests.delete(requestId);
      }
    }
  }
```

- **`PairingInit`**: The local PC is declaring: *"I am waiting to pair. My temporary code is `NX-XXXX`"*. The cloud attaches this code to the socket instance.
- **`cmd_response`**: When your local PC finishes running a command, it sends back the `requestId`.
  1. Finds `{ resolve, reject, timer }` from `pendingRequests.get(requestId)`.
  2. Cancels the timeout timer via `clearTimeout(requestHandler.timer)` so it doesn't fail later.
  3. Calls `requestHandler.resolve(cmdResponse)` — **this immediately unfreezes the waiting `await sendCmdRequest(...)` call!**
  4. Deletes the entry from the Map to prevent memory leaks.

---

### D. Remote Command Invocation (`sendCmdRequest` - The Promise Map)

```typescript
// Lines 213–278
const sendCmdRequest = async (
  userId: string,
  cmd: any,
  timeoutMs: number = 30000,
): Promise<CommandParserResponseType> => {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const parsedCmd = typeof cmd === "string" ? JSON.parse(cmd) : cmd;
    const dataStr = JSON.stringify({
      type: "RunCMD",
      cmd: parsedCmd,
      requestId,
    });
```

#### Why we wrap this in a `new Promise`:
In normal web apps, you `await` functions. But WebSockets are event-driven (`send` and `onmessage`). Wrapping this in `new Promise((resolve, reject) => ...)` lets the rest of the backend (like `Parsers.ts`) simply write:
```typescript
const searchResults = await sendCmdRequest(userId, returningCmd);
```
It looks and behaves like a synchronous function call!

#### Finding the Correct Local Device:
```typescript
let clientFound = false;
(wss.clients as Set<CustomWebSocket>).forEach((client) => {
  const isSameUser = client.userId?.toString() === userId?.toString();
  if (client.deviceId === "web_client") {
    return; // SKIP web browsers! They cannot execute Windows commands!
  }
  if (isSameUser && client.isAuthenticated && client.readyState === WebSocket.OPEN) {
    client.send(dataStr);
    clientFound = true;
  }
});
```
- It filters through connected clients to find the one belonging to this `userId`.
- It explicitly skips `deviceId === "web_client"` because a web browser has no access to CMD or file systems.

#### The Timeout Guard:
```typescript
const timer = setTimeout(() => {
  if (pendingRequests.has(requestId)) {
    reject(new Error(`Command request timed out after ${timeoutMs / 1000}s...`));
    pendingRequests.delete(requestId);
  }
}, timeoutMs);

pendingRequests.set(requestId, { resolve, reject, timer });
```
- If the local computer freezes, crashes, or takes longer than `timeoutMs`, the Promise is rejected gracefully with an informative error rather than hanging the server forever.

---

### E. Pairing Handshake (`startParingHandler`)

```typescript
// Lines 324–411
const startParingHandler = async (req: any, res: any) => {
  const { pairingcode } = req.body;
  const userId: string = req.userId ? req.userId.toString() : "";
  ...
  for (const client of wss.clients as Set<CustomWebSocket>) {
    if (client.pairingCode === pairingcode && client.readyState === WebSocket.OPEN) {
      const deviceId = new Types.ObjectId().toString();
      const deviceToken = generateToken({ userId, deviceId }, "30d");
      ...
      client.deviceId = deviceId;
      client.isAuthenticated = true;
      client.userId = userId;

      sendJson(client, {
        type: "PairingSuccess",
        token: deviceToken,
        userId: userId,
        deviceId: deviceId,
      });

      await UserModel.findOneAndUpdate(
        { _id: userId },
        { $push: { devices: { _id: deviceId, deviceToken, deviceName: "Nexus Local Device" } } }
      );
      return res.status(200).json({ success: true, message: "Pairing successful" });
    }
  }
```
1. Frontend calls HTTP `POST /api/device/pair` with `{ pairingcode: "NX-8492" }`.
2. Cloud iterates through open sockets looking for one with `client.pairingCode === pairingcode`.
3. Creates a unique MongoDB `deviceId` and signs a 30-day JWT `deviceToken`.
4. Upgrades the socket to `isAuthenticated = true` and pushes `"PairingSuccess"` down to the local PC.
5. Saves the device record into MongoDB under `user.devices`.

---

### F. Device Revocation (`revokeDevice`)

```typescript
// Lines 279–313
export const revokeDevice = async (userId: string, deviceId: string) => {
  const result = await UserModel.updateOne(
    { _id: userId },
    { $pull: { devices: { _id: deviceId } } }
  );

  if (wss) {
    for (const client of wss.clients as Set<CustomWebSocket>) {
      if (client.deviceId === deviceId && client.userId === userId) {
        sendJson(client, { type: "PairingFailed", message: "Device has been revoked" });
        client.close(4003, "Device revoked by user");
      }
    }
  }
```
1. Uses Mongo's `$pull` operator to surgically remove the device from the user's array.
2. Locates the active socket for that device.
3. Sends `{ type: "PairingFailed" }` so the local PC knows to wipe its saved token.
4. Closes the socket with WebSocket close code `4003` (custom application close code).

---

## 3. Deep Dive: Local Companion Backend (`ws.service.ts`)

### A. Paths, Storage & Token Persistence

```typescript
// Lines 10–13
const CONFIG_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, "Nexus")
  : path.join(os.homedir(), ".nexus");
const DEVICE_TOKEN_PATH = path.join(CONFIG_DIR, "deviceToken.json");
```

#### Why use `%APPDATA%` / `os.homedir()`?
- On Windows, `process.env.APPDATA` resolves to `C:\Users\<Username>\AppData\Roaming`.
- On Linux/macOS, it falls back to `~/.nexus`.
- **Why this matters**:
  - Never saves secrets inside the Git repository folder (`.git` won't track it).
  - Persists across updates, server restarts, and project rebuilds.
  - Doesn't require Administrator privileges.

---

### B. Pairing Code Generation & Anti-Spam Lock

```typescript
// Lines 39–46
export const generateRandomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "NX-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
```
- **Character Set Selection**: Notice the characters: `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"`.
  - Missing: `0` (Zero), `O` (Letter O), `1` (One), `I` (Letter I).
  - **Why?** Eliminates human reading errors when users type pairing codes from the terminal into the web UI!

```typescript
// Lines 160–163
let isGeneratingLock = false;
let lastGeneratedAt = 0;
const REFRESH_COOLDOWN_MS = 15000;
```
- **Rate-Limiting & Mutex**:
  - If a user rapidly clicks "Refresh Code", `REFRESH_COOLDOWN_MS` enforces a 15-second cooldown.
  - `isGeneratingLock` acts as a boolean mutex to prevent race conditions if multiple async requests arrive simultaneously.

---

### C. Establishing Connection (`ServerWSConnection`)

```typescript
// Lines 219–243
const ServerWSConnection = async () => {
  const deviceData = await readDeviceTokenFile();
  const headers: Record<string, string> = {};

  if (deviceData?.token) {
    headers.Authorization = `Bearer ${deviceData.token}`;
  }

  const backend_URL = process.env.CLOUD_BACKEND_WS || "wss://nexus-v2-e38m.onrender.com";
  const ws = new WebSocket(`${backend_URL}`, { headers });
  activeWS = ws;

  ws.on("open", async () => {
    isConnectedToBackend = true;
    if (!deviceData?.token) {
      const { code } = await generatePairingCode();
      if (code) {
        sendJson(ws, { type: "PairingInit", code });
      }
    }
  });
```
1. Reads `deviceToken.json`. If a token exists, attaches it in the HTTP headers.
2. Connects to the cloud backend URL (`wss://...`).
3. Once connected (`open`):
   - If **paired**: Cloud automatically validates the token and marks socket authenticated.
   - If **unpaired**: Local-BE generates `NX-XXXX` and notifies the Cloud via `{ type: "PairingInit", code }`.

---

### D. Message Dispatcher (`RunCMD`, `PairingSuccess`, `PairingFailed`)

```typescript
// Lines 245–304
ws.on("message", async (data: any) => {
  const parsed = JSON.parse(data.toString());

  switch (parsed.type) {
    case "PairingSuccess": {
      const token = parsed.token || parsed.deviceToken;
      if (token) {
        await saveDeviceTokenFile({ token });
      }
      currentPairingState = null;
      break;
    }

    case "PairingFailed": {
      await saveDeviceTokenFile({ token: "" }); // Wipe invalid token
      await generatePairingCode();              // Ready for new pairing
      break;
    }

    case "RunCMD": {
      const { requestId, cmd } = parsed;
      const parsedCmd = typeof cmd === "string" ? JSON.parse(cmd) : cmd;

      // 1. Run actual Windows command / search
      const cmdResponse = await runCommand(
        parsedCmd.action,
        parsedCmd.param,
        parsedCmd.timeout,
      );

      // 2. Send result back with matching requestId
      sendJson(ws, {
        type: "cmd_response",
        requestId,
        cmdResponse,
      });
      break;
    }
  }
});
```

#### What happens during `RunCMD`:
1. Receives command payload from cloud: `{ type: "RunCMD", requestId: "abc", cmd: { action: "search", param: ... } }`.
2. Calls `runCommand()` (which executes the local file search, PowerShell script, or CMD process).
3. Packages the output into `{ type: "cmd_response", requestId: "abc", cmdResponse }`.
4. Sends it straight back across the WebSocket. The cloud correlates `"abc"` to the pending Promise and delivers the output!

---

### E. Resilience & Auto-Reconnection Loop

```typescript
// Lines 306–314
ws.on("close", () => {
  isConnectedToBackend = false;
  activeWS = null;
  const retryIn = 5000;
  console.log(`[WS] Disconnected from Cloud Backend. Reconnecting in ${retryIn / 1000}s...`);
  setTimeout(ServerWSConnection, retryIn);
});
```

#### Why this is critical:
- Free-tier or cloud deployments (like Render) spin down or restart periodically. Home internet connections can drop packets.
- When the socket closes, `ws.on("close")` executes:
  - Sets `isConnectedToBackend = false` so UI knows the PC is offline.
  - Clears `activeWS`.
  - Schedules `setTimeout(ServerWSConnection, 5000)` to retry automatically every 5 seconds until the server is back up.
- **Zero manual intervention required**: Once paired, your PC silently reconnects whenever the cloud restarts.

---

## 4. Message Types & Payload Reference Table

| Message `type` | Sender | Receiver | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `PairingInit` | Local-BE | Cloud | `{ type: "PairingInit", code: "NX-XXXX" }` | Registers temporary pairing code on the socket. |
| `PairingSuccess` | Cloud | Local-BE | `{ type: "PairingSuccess", token: "jwt...", userId, deviceId }` | Confirms pairing and delivers 30-day device token. |
| `PairingFailed` | Cloud | Local-BE | `{ type: "PairingFailed", message: "..." }` | Informs local device that token is expired/revoked. |
| `RunCMD` | Cloud | Local-BE | `{ type: "RunCMD", requestId: "uuid", cmd: { action, param, timeout } }` | Instructs Local PC to execute a command or search. |
| `cmd_response` | Local-BE | Cloud | `{ type: "cmd_response", requestId: "uuid", cmdResponse: { ... } }` | Delivers command terminal output back to Cloud. |
| `revoke-device` | Local-BE | Cloud | `{ type: "revoke-device", deviceToken: "jwt..." }` | Local PC explicitly requests unpairing. |
| `RevokeResponse` | Cloud | Local-BE | `{ type: "RevokeResponse", success: true, message: "..." }` | Confirms device was removed from MongoDB. |

---

## Summary Mental Model

Think of the system as an **Operator & Field Agent**:
1. **The Cloud Backend is the Operator**: It sits in headquarters, talks to the user (Web UI), and manages the mission database (MongoDB).
2. **The Local Backend is the Field Agent**: It has physical access to the local territory (Windows filesystem, command line).
3. **The WebSocket is the Radio Channel**: The field agent tunes in to the operator.
4. **The `requestId` is the Case Number**: Whenever headquarters says *"Run Case #104: search D: drive"*, the field agent radios back *"Case #104 Complete: Here are the files"*.
