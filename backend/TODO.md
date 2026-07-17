# Nexus Backend TODO

## 🔌 1. Middleware Implementation
- [X] Logger Middleware (Log incoming request method, URL, and timestamp)
- [X] Validation Middleware (Validate payload fields like message and session)
- [X] Auth Middleware (Verify authorization headers/API keys)
- [X] 404 & Global Error Middleware (Handle page not found and server crashes gracefully)

## 🧠 2. AI & WebSocket Enhancements
- [X] Live WebSocket Streaming (Broadcast real-time stdout/stderr of command execution)
- [X] Feedback Loop (Automatically feed command output back into AskAI for the next turn)

## 🛠️ 3. Desktop Tools (under `backend/tools/`)
- [X] **Search Tool:** Complete python search implementation (`search.py`)
- [ ] **Volume Controls:** Implement OS-level volume controls (mute/unmute, set volume)
- [ ] **System Info:** Expose CPU, RAM, and OS status indicators
- [ ] **Open Application:** Implement safe application launching by name


## 📱 4. Mobile Tools
- [ ] **Voice App:** Integrate voice input/output processing
- [ ] **Voice App (Advanced):** Integrate the Assistant type voice features to the app like the gemini or google assistant
- [ ] **Internal AI (GROG or Openrouter):** : Provide and internal AI which let you answer withotu the AI call to the pc if the server on the pc is not running.
- [ ] **Wake Up (PC Call):**Wake up pc from mobile app using AI Voice feature or button.
- [ ] **Connect / Disconnect** : Connect / Disconnect from mobile app to pc.
- [ ] **External WakeUP App:** : This Provide the api to wake up the pc which gives you the information that pc is waken up or not