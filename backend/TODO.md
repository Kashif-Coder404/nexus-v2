# Nexus Backend TODO

## 🔌 1. Middleware Implementation

- [x] Logger Middleware (Log incoming request method, URL, and timestamp)
- [x] Validation Middleware (Validate payload fields like message and session)
- [x] Auth Middleware (Verify authorization headers/API keys)
- [x] 404 & Global Error Middleware (Handle page not found and server crashes gracefully)

## 🧠 2. AI & WebSocket Enhancements

- [x] Live WebSocket Streaming (Broadcast real-time stdout/stderr of command execution)
- [x] Feedback Loop (Automatically feed command output back into AskAI for the next turn)

## 🗄️ 3. Chat History & Database Persistence

- [x] **MongoDB Connection:** Established Mongoose database connection (`connectDB.ts`).
- [x] **Chat Schema:** Defined Mongoose `ChatModel` schema (`chat-schema.ts`) for message role & content tracking.
- [x] **Chat History Service:** Implemented CRUD helpers (`chat.history.service.ts`) for MongoDB chat persistence.
- [x] **Session File Logs:** Implemented automatic per-session JSON history logging (`AiLogs.ts`).
- [ ] **Dedicated Session Model:** Implement `SessionModel` (`session-schema.ts`) with `sessionId`, `userId` reference, and metadata to support upcoming user authentication & login.

## 🛠️ 4. Desktop Tools (under `backend/tools/`)

- [x] **Search Tool:** Complete python search implementation (`search.py`) #Everything start on startup (todo)
- [x] **Search App Tool:** Complete python search implementation to search apps efficiently (`search.py`)
- [ ] **Volume Controls:** Implement OS-level volume controls (mute/unmute, set volume)
- [x] **System Info:** Expose CPU, RAM, and OS status indicators
- [ ] **Open Application:** Implement safe application launching by name

## 📱 5. Mobile Tools

- [ ] **Voice App:** Integrate voice input/output processing
- [ ] **Voice App (Advanced):** Integrate the Assistant type voice features to the app like the gemini or google assistant
- [ ] **Internal AI (GROQ or Openrouter):** Provide an internal AI which lets you answer without the AI call to the PC if the server on the PC is not running.
- [ ] **Wake Up (PC Call):** Wake up PC from mobile app using AI Voice feature or button.
- [ ] **Connect / Disconnect:** Connect / Disconnect from mobile app to PC.
- [ ] **External WakeUP App:** Provide the API to wake up the PC which gives information on PC status.

#OTHERS

## Content Dialogue / Process Hang Fix
- [ ] **Fire-and-Forget for `start` commands (`execute.service.ts`):** Check if command starts with `start ` and trigger `execCallback(cmd)` detached without `await`ing, so GUI apps and interactive terminals (like `start powershell`) open immediately on desktop without freezing the server.
- [ ] **Safety Timeout (`execute.service.ts`):** Add a `timeout: 10000` (10s) to `exec()` so any background command that prompts or hangs gets cancelled gracefully instead of freezing the AI loop.
- [ ] **Non-Interactive PowerShell Directive (`main.Instructions.ts`):** Instruct the AI to wrap background PowerShell commands in `powershell -NonInteractive -NoProfile -Command "..."` with `-Force`/`-Confirm:$false` flags only when user doesn't want to do that.
