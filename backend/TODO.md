# Nexus Backend TODO

## 🔌 1. Middleware Implementation
- [X] Logger Middleware (Log incoming request method, URL, and timestamp)
- [X] Validation Middleware (Validate payload fields like message and session)
- [X] Auth Middleware (Verify authorization headers/API keys)
- [X] 404 & Global Error Middleware (Handle page not found and server crashes gracefully)

## 🧠 2. AI & WebSocket Enhancements
- [X] Live WebSocket Streaming (Broadcast real-time stdout/stderr of command execution)
- [X] Feedback Loop (Automatically feed command output back into AskAI for the next turn)

## 🗄️ 3. Chat History & Database Persistence
- [X] **MongoDB Connection:** Established Mongoose database connection (`connectDB.ts`).
- [X] **Chat Schema:** Defined Mongoose `ChatModel` schema (`chat-schema.ts`) for message role & content tracking.
- [X] **Chat History Service:** Implemented CRUD helpers (`chat.history.service.ts`) for MongoDB chat persistence.
- [X] **Session File Logs:** Implemented automatic per-session JSON history logging (`AiLogs.ts`).
- [ ] **Dedicated Session Model:** Implement `SessionModel` (`session-schema.ts`) with `sessionId`, `userId` reference, and metadata to support upcoming user authentication & login.

## 🛠️ 4. Desktop Tools (under `backend/tools/`)
- [X] **Search Tool:** Complete python search implementation (`search.py`) #Everything start on startup (todo)
- [X] **Search App Tool:** Complete python search implementation to search apps efficiently (`search.py`)
- [ ] **Volume Controls:** Implement OS-level volume controls (mute/unmute, set volume)
- [X] **System Info:** Expose CPU, RAM, and OS status indicators
- [ ] **Open Application:** Implement safe application launching by name

## 📱 5. Mobile Tools
- [ ] **Voice App:** Integrate voice input/output processing
- [ ] **Voice App (Advanced):** Integrate the Assistant type voice features to the app like the gemini or google assistant
- [ ] **Internal AI (GROQ or Openrouter):** Provide an internal AI which lets you answer without the AI call to the PC if the server on the PC is not running.
- [ ] **Wake Up (PC Call):** Wake up PC from mobile app using AI Voice feature or button.
- [ ] **Connect / Disconnect:** Connect / Disconnect from mobile app to PC.
- [ ] **External WakeUP App:** Provide the API to wake up the PC which gives information on PC status.
