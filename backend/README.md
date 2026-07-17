# 🔌 Nexus Backend

The core intelligence and execution engine of the Nexus Ecosystem. This service orchestrates AI agent interactions, executes system command instructions, handles local application searching, and manages real-time status broadcasting to connected interfaces via WebSockets.

---

## 🚀 Key Features

- **🧠 Self-Correcting AI Engine (`AskAI`)**: Coordinates conversation history, processes user requests via an LLM client, runs generated terminal commands locally, and feeds stdout/stderr back into the model in a feedback loop (up to a configurable retry limit) for automatic self-correction.
- **🔌 Robust Middleware Stack**:
  - **Structured Logger**: Monitors and logs all incoming requests (method, route, timestamp).
  - **Auth Guard (`authenticateAPIkey`)**: Secure token-based access verifying bearer API keys.
  - **Error Handlers**: Gracefully handles malformed JSON requests and prevents server crashes.
- **⚡ Live WebSocket Status Streaming**: Broadcasts live worker-state frames (e.g., `ai_data` signaling `workingon` status, and `ai_done` completion indicator) to ensure active visual feedback on clients.
- **🛠️ Desktop Systems Integrations**:
  - **App Search Tool**: Automatically triggers `search.py` via Python 3 to scan directory paths (`dir /b`) and locate specific files or executables matching expected queries.
  - **Terminal Executor (`executeCmd`)**: Executes system shell commands directly on the host OS.
  - **Session Database Control**: Clears or loads session-based chat records dynamically, including a "Delete History" capability.
- **💡 Robust JSON & Regex Parsing Recovery**: Salvages message responses and command parameters from malformed or unstructured LLM output via regex-based fallbacks.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript (`tsx watch` development suite)
- **Framework**: Express.js
- **Real-Time Communication**: `ws` (WebSocket library)
- **External Scripting**: Python 3 (used for desktop search functionality)

---

## 📂 Project Structure

```
backend/
├── AI/                     # AI Orchestration layer
│   ├── AICall.ts           # External LLM Proxy/API calls
│   ├── AiLogs.ts           # Session history persistence (JSON)
│   ├── askAI.ts            # Self-correcting loop and command processing
│   └── instructions/       # Agent prompts & constraint configurations
├── controllers/            # Route controllers (e.g., chat.controller.ts)
├── middlewares/            # Authentication, logging, and recovery filters
├── routes/                 # API endpoint mappings
├── services/               # Command execution and WebSocket broadcasting services
├── tools/                  # Python helper scripts (e.g., search.py)
├── app.ts                  # App configuration and core middleware wire-up
└── server.ts               # HTTP & WS server entry point
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the `backend/` directory:

```env
PORT=3100
NEXUS_API_KEY=your_secure_bearer_token
# Additional variables used by AICall.ts (e.g. LLM endpoints/tokens)
```

---

## 🏃 Run Commands

Run all scripts from the `backend/` folder:

| Command | Action |
| :--- | :--- |
| `npm run dev:server` | Starts the Express/WS server in watch mode (`tsx watch`). |
| `npm run proxy` | Launches the local NIM proxy (e.g. running uvicorn inside Ubuntu WSL). |
| `npm run dev` | Runs the Node server and Python/NIM proxy concurrently. |
| `npm run build` | Compiles the TypeScript codebase (`tsc`). |
| `npm run start` | Launches the production compiled bundle (`node dist/server.js`). |
| `npm run all` | Starts the backend, python proxy, web frontend, and mobile Expo app in parallel. |
