# Nexus: Full Architecture Overview

Nexus is a lightweight AI assistant app with a React frontend and a Node.js backend. The system accepts a chat message, sends it to an AI model through a local proxy, and can optionally execute terminal commands based on the model’s instructions.

## High-Level Flow

```text
User
  |
  v
React UI (Vite + TypeScript)
  |
  v
Express API /api/chat/message
  |
  v
AI Orchestrator (AskAI)
  |
  +--> AI Proxy (local endpoint at 127.0.0.1:8082)
  |
  +--> Command Executor
  |
  +--> History + Logs
  |
  v
JSON response + WebSocket status
```

## Frontend Architecture

The frontend lives in the Vite React app under the frontend folder. Its main job is to provide the chat experience and manage user state.

- App.tsx mounts the main screen and renders the chat interface.
- Chat.tsx handles input, sends messages to the backend, and displays both user and AI messages.
- UserBox and AIBox render the chat bubbles.
- Provider.tsx holds shared state: chat history, message text, loading state, and a session ID. It also performs an initial health check to confirm the backend is running.

```text
frontend/src
  App.tsx
    -> Chat.tsx
         -> UserBox / AIBox
    -> context/provider.tsx
```

## Backend Architecture

The backend is an Express server with REST and WebSocket support. It serves the frontend, exposes chat endpoints, and coordinates AI processing.

- server.ts creates the Express app, enables CORS, starts the HTTP server, sets up WebSockets, and exposes /api/health and /api/chat.
- routes/chat.routes.ts routes POST /api/chat/message to the controller.
- controllers/chat.controller.ts validates the request, grabs the WebSocket server, calls the AI logic, and returns a JSON response.
- services/ws.service.ts broadcasts status updates to connected clients.
- services/execute.service.ts runs shell commands safely through the local terminal.

```text
backend
  server.ts
    -> routes/chat.routes.ts
         -> controllers/chat.controller.ts
              -> AI/askAI.ts
                   -> AI/AICall.ts
                   -> services/execute.service.ts
              -> services/ws.service.ts
```

## AI and Persistence Layer

The AI layer is the core of the app. AskAI loads prior conversation history, sends the conversation to the AI proxy, parses the reply for structured fields like cmd, msg, and terminal output, and then executes commands when needed. If a command runs, the result is fed back into the model so it can continue reasoning.

History and logs are stored in the backend AI history folder and the logs folder, which helps preserve context across sessions.

## What Is Happening in Practice

A user types a message. The frontend sends it to the backend. The backend asks the AI what to do next. If the AI returns a command, the backend runs it locally and returns the result to the UI. The app also streams lightweight system updates over WebSockets so the interface feels live.
