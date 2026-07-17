# Nexus Backend TODO

## 🔌 1. Middleware Implementation
- [X] Logger Middleware (Log incoming request method, URL, and timestamp)
- [X] Validation Middleware (Validate payload fields like message and session)
- [X] Auth Middleware (Verify authorization headers/API keys)
- [X] 404 & Global Error Middleware (Handle page not found and server crashes gracefully)

## 🧠 2. AI & WebSocket Enhancements
- [] Live WebSocket Streaming (Broadcast real-time stdout/stderr of command execution)
- [X] Feedback Loop (Automatically feed command output back into AskAI for the next turn)
- [] Search Service Refactoring (Support cross-platform python vs python3; return Promise)

## 🛠️ 3. Desktop Tools (under `backend/tools/`)
- [O] **Search Tool:** Complete python search implementation (`search.py`)
- [ ] **Volume Controls:** Implement OS-level volume controls (mute/unmute, set volume)
- [ ] **System Info:** Expose CPU, RAM, and OS status indicators
- [ ] **Open Application:** Implement safe application launching by name
- [ ] **Voice App:** Integrate voice input/output processing

