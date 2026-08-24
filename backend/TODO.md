# Nexus Backend TODO

## 🔌 1. Middleware & Authentication Implementation

- [x] **Logger Middleware:** Log incoming request method, URL, and timestamp.
- [x] **Validation Middleware:** Validate payload fields like message, email, and password.
- [x] **JWT Authentication Service (`jwt.service.ts`):** Complete stateless JWT token generation and signature verification with expiration handling.
- [x] **Dynamic Environment Path Resolution (`EnvVariables.ts`):** Robust `.env` discovery across subdirectories and script executions.
- [x] **Auth Middlewares (`authUserLogin.ts`, `authUserSignup.ts`):** Full user registration, login credential validation, and Bearer token guard middleware (`userAuthentication`).
- [x] **Session & Chat Guards (`sessionVerification.ts`, `chatVerification.ts`):** Middleware chains verifying session ownership and chat record presence with MongoDB.
- [x] **404 & Global Error Middleware:** Handle page not found and server crashes gracefully.
- [ ] **Centralized Error Origin Tracker:** Create a common error handling utility that explicitly labels where an error originated (e.g., "AI API", "Database", "PowerShell", "Memory Service").

## 🗄️ 2. Chat History & Database Persistence

- [x] **MongoDB Connection:** Established Mongoose database connection (`connectDB.ts`).
- [x] **User Schema & Model (`user-schema.ts`):** User profile schema with name, email, password, role, devices, and verification tracking.
- [x] **Dedicated Session Model (`session-schema.ts`):** Session schema linking session IDs with user ownership.
- [x] **Chat Schema & Model (`chat-schema.ts`):** Message schema supporting role (`user` / `assistant`), content timestamps, and session linkage.
- [x] **Chat History Service (`chat.history.service.ts`):** Implemented MongoDB CRUD helpers (`getChatHistory`, `setChatHistory`, `updateChatHistory`, `deleteChatHistory`).
- [ ] **Migrate AI Chat Context to MongoDB (`askAIv2.ts` & `chat.controller.ts`):** Switch `askAIv2.ts` and `chat.controller.ts` from local file-based `LocalChatHistory.ts` (`getHistory`) to MongoDB `getChatHistory(userId, session, 10)` and persist AI assistant responses directly into `ChatModel`.
- [ ] **Separate Conversational Chat from Execution Logs:** Store pure user-assistant conversation in `ChatModel` while streaming and saving tool execution diagnostics in a separate collection/log.

## 🧠 3. AI & WebSocket Enhancements

- [x] **Live WebSocket Streaming:** Broadcast real-time stdout/stderr of command execution.
- [x] **Feedback Loop:** Automatically feed command output back into AskAI for iterative multi-turn tasks.
- [x] **AI Providers Refactoring:** Standardized provider interfaces for Gemini, Groq, and OpenCode.
- [ ] **Session-Based WebSocket Routing:** Route WebSocket status and output messages specifically to the client with the active session ID.

## 🛠️ 4. Desktop Tools & Local Companion Backend (`Local-BE`)

- [x] **Standalone Local-BE Service (`Local-BE/`):** Created lightweight local execution server with WebSocket support for executing shell commands and taking desktop screenshots.
- [x] **Search Tool:** Python search implementation (`search.py`).
- [x] **Search App Tool:** App searching integration.
- [x] **System Info & Audio Tool:** CPU, RAM, and volume control tools.
- [ ] **Open Application:** Safe application launching by name.

## 📱 5. Mobile & Cloud Features (Upcoming)

- [ ] **Voice App & Voice Assistant:** Mobile voice assistant features.
- [ ] **Wake Up & Remote Connection:** Remote PC wake-up and connect/disconnect API.
- [ ] **High-Risk Action Confirmation:** Require password/biometrics for sensitive system commands.
- [ ] **Frontend JWT Auth Integration:** Wire Next.js frontend login & registration forms to `/api/login` and `/api/signup` with Bearer token storage.
