# Nexus Live Terminal & Background Process Engine (Architecture Spec)

> **In One Simple Line:** A stateful, multi-session background terminal system that runs long tasks headless on the host PC, streams live logs over WebSockets to Web and Mobile at `/live-terminals/:id`, and strictly limits concurrent sessions to 4 to protect PC resources.

---

## 1. Problem Statement & Motivation
* **Synchronous Hanging:** Standard chat AI tools block or timeout (>30s) when asked to execute long-running commands (e.g. `npm install`, `docker compose up`, `git clone`, `python app.py`).
* **Disconnect / Reload Loss:** If a user closes the browser or locks their phone while a background command is running, the live output stream is lost, even though the process is still running on the PC.
* **Resource Overload:** Without strict concurrency limits, an AI or user could trigger multiple uncontrolled background processes, exhausting CPU, RAM, and port bindings.

---

## 2. Core Architecture & Components

```
                   ┌────────────────────────────────────────────────────────┐
                   │                     USER INTERFACE                     │
                   │  (Web UI & React Native Mobile App: System-pilot)      │
                   ├────────────────────────────┬───────────────────────────┤
                   │  AI Chat Assistant         │  Sidebar Terminal Drawer  │
                   │  - Detects long tasks      │  - Badges: Active (2 / 4) │
                   │  - Provides deep link:     │  - Quick kill button      │
                   │    /live-terminals/:id     │  - Live status indicator  │
                   └─────────────┬──────────────┴─────────────┬─────────────┘
                                 │                            │
                                 │ Direct / Local WebSocket   │
                                 ▼                            ▼
                   ┌────────────────────────────────────────────────────────┐
                   │               C# AGENT: Local-BE-v2                    │
                   │              (TerminalSessionManager)                  │
                   ├────────────────────────────────────────────────────────┤
                   │  [Slot 1] term-4a21 : npm run dev     🟢 Running       │
                   │  [Slot 2] term-88bf : npm install     🟡 In Progress   │
                   │  [Slot 3] EMPTY                       ⚪ Available     │
                   │  [Slot 4] EMPTY                       ⚪ Available     │
                   ├────────────────────────────────────────────────────────┤
                   │  • Max Concurrency Guardrail: 4 Active Terminals       │
                   │  • Rolling Log Buffer: Last 150 lines in memory        │
                   │  • Headless Execution: CreateNoWindow = true           │
                   └────────────────────────────────────────────────────────┘
```

---

## 3. The 4-Terminal Resource Guardrail
To safeguard the host machine's memory and CPU:
1. `Local-BE-v2` enforces a hard limit: `MaxActiveSessions = 4`.
2. If an AI or user requests a 5th background session, C# rejects the request with:
   ```json
   {
     "isSuccess": false,
     "error": "MAX_CONCURRENT_TERMINALS_REACHED",
     "message": "Maximum limit of 4 active background terminals reached. Please terminate an existing terminal before starting a new one."
   }
   ```
3. The AI receives this error and informs the user directly in chat:
   > *"You currently have 4 active background terminals running. Please stop one (e.g., `#term-4a21`) before starting a new one."*

---

## 4. Lifecycle: Finite vs. Daemon Commands

| Type | Examples | Behavior & State |
| :--- | :--- | :--- |
| **Finite Tasks** | `npm install`, `git clone`, `build` | Transitions from `Running 🟢` to `Completed ⚪ (Exit Code: 0)` or `Failed 🔴`. Retains final logs until user dismisses to free up the slot. |
| **Daemon Servers** | `npm run dev`, `python bot.py` | Stays in `Running 🟢` continuously until explicitly stopped via the UI's **Kill Process** button or PC reboot. |

---

## 5. Disconnect / Reconnect State Restoration
* **The In-Memory Ring Buffer:** Each active session retains its last 150 lines of stdout/stderr in a rolling circular buffer.
* **Reconnection Flow:**
  1. User navigates to `/live-terminals/:id` or opens the Mobile App.
  2. Client sends: `{ "type": "attach_terminal", "sessionId": "term-4a21" }`.
  3. C# immediately replays the buffered history so the terminal is never blank.
  4. C# hooks the client into the live real-time output stream.

---

## 6. WebSocket Event Protocol Specification

### A. Terminal Session Discovery
* **Request (Client -> C#):**
  ```json
  { "type": "get_active_terminals" }
  ```
* **Response (C# -> Client):**
  ```json
  {
    "type": "active_terminals_list",
    "terminals": [
      {
        "id": "term-4a21",
        "pid": 14208,
        "command": "npm run dev",
        "startedAt": "2026-09-19T21:40:00Z",
        "status": "running"
      }
    ],
    "activeCount": 1,
    "maxSlots": 4
  }
  ```

### B. Live Log Streaming Chunk
* **Broadcast (C# -> All Attached Clients):**
  ```json
  {
    "type": "terminal_chunk",
    "sessionId": "term-4a21",
    "pid": 14208,
    "chunk": "Ready on http://localhost:3000\n"
  }
  ```

### C. Termination Command
* **Request (Client -> C#):**
  ```json
  { "type": "kill_terminal", "sessionId": "term-4a21" }
  ```
* **Action:** C# kills the entire process tree (`entireProcessTree: true`) and frees the slot.

---

## 7. UI & UX Wireframe

### Dedicated Page Route: `/live-terminals/[id]`
```
┌───────────────────────────────────────────────────────────────────────────┐
│ 🟢 term-4a21: npm run dev (PID: 14208)             [Copy Logs] [🛑 Kill] │
├───────────────────────────────────────────────────────────────────────────┤
│ > nexus-backend@1.0.0 dev                                                 │
│ > tsx watch server.ts                                                     │
│                                                                           │
│ [WS] WebSocket server initialized on port 3100                            │
│ [DB] MongoDB connected successfully                                       │
│ ⚡ Server listening on http://localhost:3100                              │
│                                                                           │
│ █                                                                         │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Phased Implementation Roadmap
- [ ] **Phase 1 (C# Engine):** Build `TerminalSessionManager.cs` with the 4-slot limit, rolling buffer, and process tree lifecycle.
- [ ] **Phase 2 (WS Hub):** Expose `get_active_terminals`, `attach_terminal`, and `kill_terminal` over WebSocket.
- [ ] **Phase 3 (Frontend Route):** Create `/live-terminals/[id]` page with an xterm-compatible or custom streaming terminal view.
- [ ] **Phase 4 (Sidebar & Badges):** Add the "Active Terminals (X/4)" drawer to the navigation bar.
- [ ] **Phase 5 (AI Integration):** Update `main.Instructions.ts` so the AI automatically redirects long-running commands to background terminals and outputs the direct link.
