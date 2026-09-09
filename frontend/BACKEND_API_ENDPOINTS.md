# 📡 Nexus Ecosystem — Backend API & WebSocket Specification

> **File:** `BACKEND_API_ENDPOINTS.md`  
> **Backend Host:** `http://localhost:3100`  
> **WebSocket Stream:** `ws://localhost:3100`  
> **Companion Host (`Local-BE`):** `http://localhost:4100`

---

## 📑 Table of Contents
1. [Authentication & Headers](#1-authentication--headers)
2. [Auth Endpoints](#2-auth-endpoints)
3. [Chat Endpoints](#3-chat-endpoints)
4. [Device & Pairing Endpoints](#4-device--pairing-endpoints)
5. [WebSocket Real-Time Gateway](#5-websocket-real-time-gateway)
6. [Supported AI Models & Providers](#6-supported-ai-models--providers)
7. [Frontend Chat Page Setup Checklist](#7-frontend-chat-page-setup-checklist)

---

## 1. Authentication & Headers

Almost all chat and device endpoints are protected by JWT authentication via `userAuthentication` middleware.

### Required Headers
```http
Content-Type: application/json
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Optional Header (Session Binding)
```http
x-session-id: <24_CHAR_MONGODB_OBJECT_ID>
```
*If `x-session-id` is omitted in `/api/chat/message`, the backend automatically generates a new session for the user.*

---

## 2. Auth Endpoints

### `POST /api/auth/signup`
Creates a new user and returns a signed JWT token.

* **Request Body**:
  ```json
  {
    "name": "Operator",
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User Created Successfully",
    "data": {
      "user": {
        "_id": "66d8f1e00000000000000001",
        "name": "Operator",
        "email": "user@example.com"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

### `POST /api/auth/login`
Authenticates user credentials and returns a JWT token.

* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login Successful",
    "data": {
      "user": {
        "_id": "66d8f1e00000000000000001",
        "name": "Operator",
        "email": "user@example.com"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

---

## 3. Chat Endpoints

### `POST /api/chat/message`
Primary AI ReAct orchestration and automation endpoint.

* **Headers**:
  ```http
  Authorization: Bearer <TOKEN>
  x-session-id: <SESSION_ID> (optional)
  ```

* **Request Body**:
  ```json
  {
    "content": "Search for notes.pdf and open it",
    "behaviour": "friendly",
    "sessionId": "66d8f1e00000000000000002",
    "model": {
      "provider": "gemini",
      "name": "gemini-3.5-flash-lite",
      "isLiveModel": false
    }
  }
  ```
  *(Default model is `gemini` / `gemini-3.5-flash-lite`. Behaviour defaults to `"friendly"`).*

* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Chat message processed successfully",
    "sessionId": "66d8f1e00000000000000002",
    "data": {
      "lastAIMsg": "I found notes.pdf and launched it on your PC.",
      "lastCMD": "start C:\\Users\\Operator\\Documents\\notes.pdf",
      "terminal": "Process initiated with PID 12480",
      "terminalError": "",
      "executions": [
        {
          "type": "search",
          "cmd": "voidtools.search('notes.pdf')",
          "output": "1 file found"
        }
      ],
      "imageBase64": "data:image/png;base64,..."
    }
  }
  ```

---

### `POST /api/chat/history`
Loads chat message history for a given session.

* **Headers**:
  ```http
  Authorization: Bearer <TOKEN>
  x-session-id: <SESSION_ID>
  ```
* **Query Parameters**:
  - `lastMsgCount`: Number of past messages to fetch *(Default: 10)*
* **Request Body**:
  ```json
  {
    "sessionId": "66d8f1e00000000000000002"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Chat History",
    "data": {
      "chat": [
        { "role": "user", "content": "What is my CPU usage?" },
        { "role": "assistant", "content": "Your CPU usage is currently 22%." }
      ]
    }
  }
  ```

---

### `GET /api/chat/sessions` (or `POST /api/chat/sessions`)
Retrieves all chat sessions for the authenticated user (sorted newest first).

* **Headers**:
  ```http
  Authorization: Bearer <TOKEN>
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User Sessions",
    "data": [
      {
        "_id": "66d8f1e00000000000000002",
        "userId": "66d8f1e00000000000000001",
        "title": "Search for notes.pdf",
        "createdAt": "2026-09-08T14:20:00.000Z",
        "updatedAt": "2026-09-08T14:25:00.000Z"
      }
    ]
  }
  ```

---

### `POST /api/chat/delete-chat-session`
Deletes a chat session and all its associated messages.

* **Headers**:
  ```http
  Authorization: Bearer <TOKEN>
  x-session-id: <SESSION_ID>
  ```
* **Request Body**:
  ```json
  {
    "sessionId": "66d8f1e00000000000000002"
  }
  ```
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Chat Session Deleted"
  }
  ```

---

## 4. Device & Pairing Endpoints

### `GET /api/health`
System health check.
* **Response**:
  ```json
  {
    "success": true,
    "message": "Health check successful",
    "data": {
      "lastAIMsg": "Hi there! What can I do for you?",
      "lastCMD": "",
      "terminal": "",
      "terminalError": ""
    }
  }
  ```

### `POST /api/pairrequest`
Initiates companion pairing with a 6-digit code.
* **Headers**: `Authorization: Bearer <TOKEN>`
* **Body**: `{ "code": "123456", "deviceName": "Gaming PC" }`

### `DELETE /api/device/:deviceId`
Revokes a paired companion device.
* **Headers**: `Authorization: Bearer <TOKEN>`

---

## 5. WebSocket Real-Time Gateway

Connect to the backend's live WebSocket server for real-time AI execution steps and device status.

* **WebSocket URL**: `ws://localhost:3100`

### Connection & Auth Handshake
Connect with the token in query params:
```javascript
const ws = new WebSocket(`ws://localhost:3100?token=${encodeURIComponent(token)}`);
```
Or send an auth frame immediately upon opening:
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Events Streamed to Frontend
During `POST /api/chat/message`, the backend broadcasts real-time execution steps:

1. **Acknowledgment**:
   ```json
   {
     "type": "acknowledged",
     "status": "received",
     "message": "Search for notes.pdf and open it"
   }
   ```

2. **Live AI Progress (Working On)**:
   ```json
   {
     "type": "ai_data",
     "data": {
       "workingon": "Analyzing request & querying local filesystem..."
     }
   }
   ```

3. **Task Completion**:
   ```json
   {
     "type": "ai_done",
     "data": {
       "workingon": ""
     }
   }
   ```

---

## 6. Supported AI Models & Providers

Passed inside the `model` object in `/api/chat/message`:

| Provider | Model ID | Description |
| :--- | :--- | :--- |
| `gemini` | `gemini-3.5-flash-lite` | Default fast model |
| `gemini` | `gemini-3.5-flash` | Standard high-accuracy model |
| `gemini` | `gemini-3-pro-preview` | Deep reasoning preview |
| `gemini` | `gemini-3.1-flash-live-preview` | Low latency live streaming |
| `tokenrouter` | `qwen/qwen3.8-max-free` | Open Qwen 3.8 Max |
| `tokenrouter` | `mistralai/mistral-large-2407`| Mistral Large |
| `nvidia` | `claude-3-5-haiku-20241022` | Local NIM / WSL Proxy |

---

## 7. Frontend Chat Page Setup Checklist

- [ ] **Auth Token Persistence**: Save `nexus_token` in `localStorage` upon login or for development testing.
- [ ] **API Service (`chatService.ts`)**: Encapsulate `sendMessage`, `fetchHistory`, `fetchSessions`, and `deleteSession`.
- [ ] **State Store (Zustand)**: Manage `currentSessionId`, `messages[]`, `sessions[]`, and `workingOn`.
- [ ] **Sidebar Integration**: Populate the sidebar with real sessions from `GET /api/chat/sessions` and wire up click-to-load and "+ New Chat".
- [ ] **WebSocket Listener**: Subscribe to `ws://localhost:3100` to show live "Thinking / Executing" status pills.
- [ ] **Rich Message Display**: Render markdown responses, terminal outputs (`lastCMD` & `terminal`), and screenshots (`imageBase64`).
