# 🔌 Nexus Backend

The core intelligence and execution engine of the Nexus Ecosystem. This service orchestrates AI agent interactions, executes system command instructions, handles local application searching, manages real-time status broadcasting via WebSockets, and handles database persistence for chat history and memory.

---

## 🚀 Key Features

- **🧠 Self-Correcting AI Engine (`AskAI`)**: Coordinates conversation context, executes user commands on the host system, intercepts terminal stdout/stderr, and feeds errors back into the model in a feedback loop (up to 3 automatic retries) for self-correction.
- **🤖 Multi-Provider AI Architecture**: Modular AI provider layer supporting multiple model backends:
  - **Gemini AI** (`geminiAI.ts`)
  - **Groq AI** (`groqAI.ts`)
  - **NVIDIA NIM** (`nvidiaAPICall.ts`)
  - **OpenCode AI** (`openCodeAI.ts`)
- **🗄️ Database & Memory Persistence**:
  - **MongoDB Integration (`mongoose`)**: Database connection ([connectDB.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/db/connectDB.ts)) storing chat histories ([chat-schema.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/db/schema/chat-schema.ts)) and key-value memory entities ([memory-schema.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/db/schema/memory-schema.ts)).
  - **Session History Persistence**: File-based session JSON logging ([AiLogs.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/AI/AiLogs.ts)) for short-term conversation context.
  - **Memory Service (`memory.service.ts`)**: Saves and retrieves user aliases, preferred folder paths, and frequently accessed memories with usage counters.
- **⚡ Live WebSocket Status Streaming**: Real-time WebSocket broadcasting ([websocket.service.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/backend/services/websocket.service.ts)) sending state updates (`acknowledged`, `ai_data`, `ai_done`) to connected frontend clients.
- **🛠️ Desktop Systems & Shell Integration**:
  - **App Search Engine (`search.service.ts`)**: Triggers `search.py` via Python 3 to locate local executables and directories.
  - **System Command Executor (`execute.service.ts`)**: Executes host terminal commands safely.
  - **Telemetry Tool (`getSystemInfo.ts`)**: Gathers host CPU, RAM, OS, and platform metrics.
- **🔌 Middleware & Security Stack**:
  - **API Key Guard (`authenticateAPIkey.ts`)**: Secure Bearer token verification guarding backend endpoints.
  - **Centralized Logger (`Logs.ts`)**: Structured console & file logging.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js ES Modules with TypeScript (`tsx watch` development suite)
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ORM (`mongoose`)
- **Real-Time Communication**: `ws` (WebSocket library)
- **AI Integrations**: Google Generative AI, Groq SDK, NVIDIA NIM (Uvicorn / WSL proxy), OpenCode
- **External Scripting**: Python 3 (used for local application indexing & desktop search)

---

## 📂 Project Structure

```
backend/
├── AI/                     # AI Orchestration & Provider Layer
│   ├── Providers/          # Provider adapters (geminiAI, groqAI, nvidiaAPICall, openCodeAI)
│   ├── instructions/       # Agent prompts & constraint rules (Instructions.ts)
│   ├── AiLogs.ts           # File-based session log persistence (JSON)
│   ├── askAI.ts            # Self-correcting AI loop & tool orchestration
│   ├── Parsers.ts          # LLM response parser & command interceptors
│   └── Types.ts            # AI payload interface definitions
├── controllers/            # Route controllers (chat.controller.ts)
├── db/                     # MongoDB Database setup & Schemas
│   ├── schema/             # Mongoose schemas (chat-schema.ts, memory-schema.ts)
│   └── connectDB.ts        # Database connection initializer
├── middlewares/            # Middleware modules
│   ├── auth/               # Bearer API Key authentication guard (authenticateAPIkey.ts)
│   └── logs/               # Request logger & error handlers
├── routes/                 # Express API routes (chat.routes.ts)
├── services/               # Core execution and business services
│   ├── chat.history.service.ts  # Database chat persistence operations
│   ├── execute.service.ts       # Host terminal command execution runner
│   ├── memory.service.ts        # MongoDB short-term & long-term memory operations
│   ├── search.service.ts        # Desktop application search runner
│   └── websocket.service.ts     # Real-time WebSocket broadcasting service
├── tools/                  # Python & system utilities
│   ├── search/             # Python search scripts (search.py)
│   └── getSystemInfo.ts    # Host system resource telemetry (CPU/RAM/OS)
├── Logs.ts                 # Centralized server logging system
├── app.ts                  # Express application setup & middleware configuration
└── server.ts               # HTTP & WS server entry point + DB connector
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the `backend/` directory:

```env
PORT=3100
MONGODB_URI=mongodb://localhost:27017/nexus
NEXUS_API_KEY=your_secure_bearer_token

# AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
NVIDIA_API_KEY=your_nvidia_api_key
```

---

## 🏃 Run Commands

Run all scripts from the `backend/` folder:

| Command | Action |
| :--- | :--- |
| `npm run dev:server` | Starts the Express/WS server in watch mode (`tsx watch`). |
| `npm run proxy` | Launches the local NIM proxy (running uvicorn inside Ubuntu WSL). |
| `npm run dev` | Runs the Node server and Python/NIM proxy concurrently. |
| `npm run build` | Compiles TypeScript codebase into `dist/`. |
| `npm run start` | Launches compiled production bundle (`node dist/server.js`). |
| `npm run frontend` | Launches Web frontend client (`../frontend`). |
| `npm run app` | Launches Mobile Expo app (`../nexus-app`). |
| `npm run all` | Starts backend, python proxy, web frontend, and mobile app concurrently. |

