# 📋 Nexus v2 — Master Task Tracker & Roadmap (`TASKS.md`)

> **Single Source of Truth** for current progress, active goals, and upcoming features across the Nexus ecosystem.  
> **Last Updated:** September 29, 2026

---

## 🧭 System Status Overview

| Component | Status | Health | Active Branch / Process |
| :--- | :--- | :--- | :--- |
| **`Local-BE-v2`** (C# .NET 8) | 🟢 Operational | 0 Errors | Elevated Service (`dotnet watch -- --service`) |
| **`backend`** (Node.js/Express) | 🟢 Operational | 0 Errors | Running on port `3100` (`npm run dev:server`) |
| **`frontend`** (Next.js 16) | 🟢 Operational | 0 Errors | Running on port `3000` (`npm run dev`) |

---

## ✅ Section 1: Completed Milestones

### 1. PowerShell Execution & Variable Preservation
- [x] **Unwrapper for Native PowerShell**: Fixed inner-quote stripping where `$downloads`, `$_`, and `foreach` loop variables were stripped into empty strings by nested `powershell -Command` wrappers.
- [x] **Trailing Quote Fix**: Refined `unwrapper` in `Parsers.ts` so path quotes like `"Get-ChildItem -Path \"$env:USERPROFILE\\Downloads\""` preserve internal quotes accurately.
- [x] **Native PowerShell Directives**: Updated `main.Instructions.ts` to enforce writing native PowerShell cmdlets directly without nested wrappers.

### 2. Terminal Noise & ANSI Escape Sequence Cleaning
- [x] **Cursor Position Jump Translation**: Replaced ConPTY row-repositioning escape codes (`\x1b[\d+;\d+[Hhf]`) with line breaks (`\n`) so table columns and output lines do not get squished together.
- [x] **CSI & Private Mode Scrubbing**: Cleaned private modes (`\u001b[?9001h`, `\u001b[?25h`), erase sequences (`\u001b[65X`), and OSC titles across both C# `SanitizeTerminalOutput` and Node.js `cleanTerminalOutput`.
- [x] **Dual-Layer Architecture**: Applied terminal sanitization in both the C# agent output stream and the Node.js backend parser before saving to DB or sending to Gemini.

### 3. Agent Stability & WebSocket Communication
- [x] **Zero-Wait Local Agent Error Reporting**: Updated `WebSocketClientService.cs` so if an exception occurs during command execution, it dispatches an immediate failure `cmd_response` back to the cloud instead of hanging for 30s.
- [x] **Null-Safe Regex Execution**: Guarded `ExecuteServices.SanitizeTerminalOutput` with null propagation (`?.`) and fallback try-catch to prevent Hot-Reload Rude Edit crashes.
- [x] **Safe Catch Block in `RunAsync`**: Fallback to raw string output on execution errors to prevent secondary crashes.
- [x] **Background Task Completion Routing**: Implemented `waitForTaskCompletion(taskId, timeoutMs)` and `task_finished` resolution in `websocket.service.ts` so background tasks (>5s) report their final exit codes cleanly.

### 4. AI Orchestration & Token Optimization
- [x] **Scoped Step Error Tracking**: Scoped `terminal_error` in `askAI.ts` to the step currently executed (`currentError`) rather than accumulating past errors. Prevents previous failed steps from poisoning subsequent successful steps.
- [x] **Base64 History Token Stripping**: When `askAI.ts` loads conversation history (`prevChat`) from MongoDB, it replaces heavy `imageBase64` strings with `[Image Attached]` so Gemini's context window isn't flooded with millions of tokens.
- [x] **Resilient AI Inference Routing**: Implemented error-handling boundaries and normalized payload structures across model calls.

---

## 🎯 Section 2: Active & Immediate Goals

### Phase 1: Chat Schema Modernization (Completed ✅)
- [x] **Mongoose Schema Separation (`chat-schema.ts`)**:
  - Stored `content` as pure conversational text (`finalMsg`).
  - Stored `executions` as its own top-level array property (`{ steps, cmd: { action, param }, msg, terminalOutput, terminalError, isSuccess, exitCode, duration, cwd }`).
  - Stored `imageBase64` and `workedSeconds` as distinct document fields instead of packing them into a serialized JSON string.
- [x] **Decoupled Context Compression (`context.summarize.ts`)**:
  - Implemented `buildAiContext` to summarize intentions, actions, and the last 40 words of output/error to protect token budgets.
- [x] **Frontend Message Extraction (`AIMsgBox.tsx` & `ChatUI.tsx`)**:
  - Passed `chMsg` directly to `AIMsgBox` and bound `content` and `executions` directly.
  - Cleaned up dead prototype code (`CommandBox`, `TerminalBox`, `Executions`).

### Phase 2: Live Terminals & Background Process Management
- [ ] **Active Terminals Drawer / Sidebar UI**:
  - Add visual indicator badge (`Active Tasks: X / 4`) in the web sidebar.
  - Display list of background tasks (PID, command, elapsed uptime, status).
- [ ] **One-Click Task Termination**:
  - Add `[Kill]` button next to each running task in the web UI that dispatches `{ "type": "kill_task", "taskId": ..., "pid": ... }` to `Local-BE-v2`.
- [ ] **Disconnect/Reconnect Log Stream**:
  - Replay rolling circular buffer (last 150 lines) from `TaskLogBuffers` in C# when opening a background task drawer.

### Phase 3: Standalone Packaging & Elevation Polish (`Local-BE-v2`)
- [ ] **UAC Elevation Refinement**:
  - Distinguish read-only commands (`--version`, `--status`) from elevated commands (`--install`, `--service`).
  - Eliminate flashing UAC windows when run from non-elevated prompts; display clean console notice: `"[!] Error: This command requires Administrator privileges."`
- [ ] **Single-File Self-Contained Binary (`nexus.exe`)**:
  - Configure `dotnet publish` profile (`PublishSingleFile=true`, `SelfContained=true`, `win-x64`) producing a portable ~50MB executable.
  - Silent background service mode (`<OutputType>WinExe</OutputType>`).

---

## 🔭 Section 3: Feature Backlog & Future Roadmap

### 1. Active Target Device Selection (Multi-PC Management)
- [ ] **Sidebar Radio Selector**:
  - Add device selection radio buttons in `SideBar.tsx` when a user has multiple linked PCs ("Gaming Desktop", "Work Laptop").
- [ ] **Targeted Dispatch in Gateway**:
  - Pass `activeDeviceId` in `sendCmdRequest` so commands execute only on the selected machine instead of broadcasting.

### 2. Zero-Trust Device PIN / 2FA Security
- [ ] **Physical Machine PIN Setup**:
  - Allow defining a 6-digit unlock PIN during local companion setup (`localhost:4100`).
  - Store bcrypt hash in MongoDB (`deviceSecretHash`).
- [ ] **Web Unlock Challenge**:
  - Require PIN verification before unlocking remote shell execution on that device.

### 3. Chromium Browser Companion Extension
- [ ] **Native Tab & Media Control**:
  - Connect browser extension to `Local-BE-v2` via local WebSocket (`ws://localhost:4100/extension`).
  - Provide surgical tab management (close specific tabs without killing browser process).
  - Extract live DOM / web page text for AI research.
  - Control YouTube / media playback directly.

### 4. Remote Mobile Companion (`nexus_app_v2`)
- [ ] Sync chat sessions, live execution steps, and task management with the React Native / Expo mobile app.
- [ ] Biometric confirmation (FaceID / Fingerprint) before executing high-risk system commands remotely.
