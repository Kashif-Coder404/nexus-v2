# Nexus Backend - Real Chat Issues & Remaining Tasks

This document details all remaining issues, architectural gaps, and tasks needed to make **real chats** fully operational with database persistence, session handling, and clean frontend communication.

---

## 🗄️ 1. Database Context & Chat History Migration

### Problem
The chat engine and controller currently rely on local `.json` file storage in `backend/AI/chats/` instead of reading and writing to MongoDB collections.

### Affected Files
- [`backend/AI/askAIv2.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/AI/askAIv2.ts)
- [`backend/controllers/chat.controller.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/controllers/chat.controller.ts)
- [`backend/services/chat.history.service.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/chat.history.service.ts)

### Current Progress (Session Update)
- [x] Created `getChat` and `setChat` in [`backend/services/chat.history.service.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/chat.history.service.ts).
- [x] Added `POST /api/chat/history` endpoint in [`backend/routes/chat.routes.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/routes/chat.routes.ts) to retrieve past messages.
- [x] Updated `summarizeBackground` in [`backend/controllers/chat.controller.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/controllers/chat.controller.ts) to use `getChat` and `setChat`.
- [x] Updated [`para.summarizer.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/AI/Helper/para.summarizer.ts) to return string summaries.
- [x] Cleaned up [`chatVerification.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/middlewares/auth/chatVerification.ts) middleware.

### 🎯 Exact Remaining Steps to Finish Sync

#### 1. [`backend/AI/askAIv2.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/AI/askAIv2.ts)
- Replace imports at top: `import { getChat, setChat } from "../services/chat.history.service.js";`
- Update function signature (line 18): `export const askAI = async (userId: string, session: string, userMessage: string, behaviour: string) => {`
- Replace `getHistory` with `getChat` (lines 33-37):
  ```typescript
  const prevChat = await getChat(userId, session, 10);
  const summaryChat = await getChat(userId, `summary_${session}`, 1);
  ```
- Replace `appendHistory` with `setChat` (line 175):
  ```typescript
  await setChat(userId, session, finalTurnSave);
  ```

#### 2. [`backend/controllers/chat.controller.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/controllers/chat.controller.ts)
- Import `setChat` alongside `getChat, updateChat`: `import { getChat, setChat, updateChat } from "../services/chat.history.service.js";`
- Pass `userId` to `askAI` (line 46):
  ```typescript
  const { cmd, msg, terminalOutput, terminalError, imageBase64 } =
    await askAI(userId.toString(), session, content, behaviour);
  ```

#### 3. [`backend/services/chat.history.service.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/chat.history.service.ts)
- Ensure `setChat` handles message arrays using `$each` (for `finalTurnSave` array).
- Clean up the test invocation code at the bottom.

---

## 📡 2. Missing Chat History Endpoint for Frontend

### Problem
The frontend UI needs to retrieve past chat messages when a user loads a page or selects a chat session. The frontend service [`chatService.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend-Testing/src/services/chatService.ts) attempts to call `/api/chat/history`, but no such route exists on the backend.

### Affected Files
- [`backend/routes/chat.routes.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/routes/chat.routes.ts)
- [`backend/controllers/chat.controller.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/controllers/chat.controller.ts)

### Current State
- `backend/routes/chat.routes.ts` only registers `POST /message`.
- `backend/app.ts` contains `POST /api/chats` (which appends a message via `chatVerification.ts`), but no `GET /api/chat/history` or `POST /api/chat/history` to fetch the message list for a session.

### Action Items
- [ ] Create a `getHistoryHandler` controller method that calls `getChatHistory(userId, sessionId, limit)`.
- [ ] Register `GET /history` (or `POST /history`) in `chat.routes.ts` protected by `userAuthentication` and `sessionAuthentication`.

---

## 💬 3. Message Payload Structure (Conversational vs Diagnostics)

### Problem
Currently in `askAIv2.ts` (line 166), the assistant response is structured as a raw JSON string:
```json
{
  "cmd": "...",
  "msg": "...",
  "terminalError": "...",
  "terminalOutput": "..."
}
```
If saved directly into `ChatModel`, the frontend UI receives raw JSON code blobs instead of clean conversational messages.

### Affected Files
- [`backend/AI/askAIv2.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/AI/askAIv2.ts)
- [`backend/db/schema/chat-schema.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/db/schema/chat-schema.ts)

### Action Items
- [ ] Save only the conversational assistant text (`aiResponse.msg`) in `ChatModel` for UI display.
- [ ] If tool command execution diagnostics and terminal outputs need persistence, save them into a dedicated execution logs collection or separate metadata field.

---

## 🔒 4. Session & Chat Initialization Flow

### Problem
The middleware chain for `/api/chat/message` is:
```
userAuthentication -> sessionAuthentication -> chatAuthentication -> sendMessage
```
If a message is sent to a newly created session that does not yet have an existing `ChatModel` document in MongoDB, `chatAuthentication` rejects the request with `401 Unauthorized: Chat is not Found!`.

### Affected Files
- [`backend/middlewares/auth/chatVerification.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/middlewares/auth/chatVerification.ts)
- [`backend/middlewares/auth/sessionVerification.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/middlewares/auth/sessionVerification.ts)
- [`backend/app.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/app.ts)

### Action Items
- [ ] Ensure clear frontend flow: create session via `/api/new-chat` before sending messages, OR
- [ ] Update `chatAuthentication` / `sendMessage` to automatically initialize/upsert the `ChatModel` document if the session is valid but has no messages yet.

---

## ⚡ 5. WebSocket Session Isolation

### Problem
[`websocket.service.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/websocket.service.ts) uses a global broadcast (`broadCastMessage`) that sends AI thinking updates and command outputs to every connected WebSocket client, regardless of session or user identity.

### Affected Files
- [`backend/services/websocket.service.ts`](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/websocket.service.ts)

### Action Items
- [ ] Track client connections by `sessionId` or `userId`.
- [ ] Route `ai_data`, `workingon`, and terminal output messages specifically to the client with the active session.
