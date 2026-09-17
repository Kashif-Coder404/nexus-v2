# 📋 Nexus Local-BE-v2 — Issues & Next Roadmap (`next_work.md`)

> **Executive Summary:** Moving the Nexus companion agent from Node.js/TypeScript to native C# (.NET 8) eliminates external runtime dependencies, cuts process execution latency from ~300ms to <15ms, provides kernel-level process tracking, and allows true silent execution (`WinExe`) without VBScript hacks.

---

## 🚨 Current Issues & Edge Cases (Top Priority to Solve)

The following core challenges and edge cases have been identified during initial development and need to be addressed in the upcoming sessions:

### 1. Resource & Folder Opening inside Applications
- **Issue:** Commands like opening a folder in VS Code (`code "D:\Coding\..."`) or opening media in a creative app can fail if the app lacks CLI arguments or is already open.
- **Edge Cases:**
  - Launching an app that is already running may create duplicate windows instead of opening the folder inside the active instance.
  - Obscure or legacy apps without CLI flags.
- **Planned Solution:**
  - **Layer 1 (URI Protocols):** Use custom URI schemes (e.g. `vscode://file/D:/...`, `spotify:track:...`) to communicate directly with already-running instances.
  - **Layer 2 (Windows Shell Association):** Use `ShellExecute` to open files with their default registered Windows handler.
  - **Layer 3 (Drag & Drop Message):** Send `WM_DROPFILES` window messages to simulate dragging files/folders into open apps.
  - **Layer 4 (UI Automation):** Fallback to Windows UI Automation (`Ctrl+O` dialog injection).

### 2. Background Daemons & Dev Servers (`npm run dev`)
- **Issue:** Long-running commands (like `npm run dev:server` or Python services) never exit on their own. When executed under standard synchronous flow, they hang until the timeout bomb fires.
- **Edge Cases:**
  - Child process tree isolation: `npm.cmd` spawning `node.exe` which detaches and survives even after parent PowerShell termination (leaving ghost processes on ports).
  - Devs needing to see live logs and press `Ctrl+C` to terminate.
- **Planned Solution:**
  - Support `ExecutionType = Background` / `IsDaemon = true`.
  - For debug sessions: Allow opening a visible Windows Terminal / PowerShell window (`-NoExit`) so the developer can watch logs live and exit cleanly with `Ctrl+C`.
  - For silent daemons: Launch detached and poll for 1–2s to confirm initial boot logs without waiting for exit.
  - Implement `/kill-port/{port}` endpoint to cleanly nuke orphaned processes holding specific ports.

### 3. Process Cleanup & Task Registry
- **Issue:** When multiple background tasks or servers run, the agent has no central record of active tasks, leading to resource leaks.
- **Planned Solution:**
  - Implement an in-memory `ConcurrentDictionary<string, TaskInfo> ActiveTasks` registry.
  - Provide `GET /tasks` (listing all running tasks with PID, CPU/RAM usage, and uptime).
  - Provide `POST /tasks/kill/{taskId}` (killing the entire process tree recursively).

### 4. Delayed Application Window Rendering (Heavy Apps / Games)
- **Issue:** Complex applications (like Roblox, Photoshop, or Blender) take 2–5 seconds to initialize and create their `MainWindowHandle`.
- **Planned Solution:**
  - Dynamic polling loop (checking every 500ms up to 7–10 seconds) with early exit as soon as the target PID and window handle appear. (Partially implemented for Roblox; needs expansion to general GUI launches).

---

## 🏗️ Nexus v2 Roadmap & Architecture Blueprint (Matching & Beating v1)

### Phase 1: Native Packaging & 100% Silent Execution
- [ ] **Native Windows Subsystem (`WinExe`):**
  - Switch `<OutputType>` in `Nexus.Agent.csproj` to `WinExe`.
  - Guarantees 0% terminal window popup, 0% screen flicker, and completely replaces the legacy `run_nexus.vbs` script.
- [ ] **Single-File Self-Contained Binary (`nexus.exe`):**
  - Configure `dotnet publish` for `win-x64` self-contained single-file compilation.
  - Produces a single, portable `nexus.exe` (~30MB) that runs on any clean Windows 10/11 machine with no .NET runtime or Node.js required.

### Phase 2: Automated Installer & CLI Engine (`--install` / `--uninstall`)
- [ ] **Command-Line Flag Parsing in `Program.cs`:**
  - Implement `--install`, `-i`, `--uninstall`, `-u`, and `--version`.
- [ ] **One-Click Installation Flow (`nexus.exe --install`):**
  - Copy binary to `%LOCALAPPDATA%\Programs\Nexus\nexus.exe`.
  - Register `%LOCALAPPDATA%\Programs\Nexus` in Windows User `PATH` environment variable.
  - Register a silent Windows Scheduled Task (`schtasks /create /tn "NexusBackgroundService" /sc onlogon`) to auto-start on user login.
  - Launch pairing web dashboard (`http://localhost:4100/`) in default browser.
- [ ] **Clean Uninstallation Flow (`nexus.exe --uninstall`):**
  - Terminate any running Nexus companion instances (`taskkill /F /IM nexus.exe`).
  - Delete Scheduled Task and User `PATH` entry.
  - Remove `%LOCALAPPDATA%\Programs\Nexus` and stored device tokens (`%APPDATA%\Nexus\deviceToken.json`).

### Phase 3: Local Web Dashboard & Pairing API
- [ ] **Embedded Static File Serving (`http://localhost:4100/`):**
  - Serve `paringcode.html` directly using ASP.NET Core static files or embedded string assets.
- [ ] **Pairing Endpoints:**
  - `GET /api/pairing-status` — returns WebSocket connection state, device token status, and pairing code.
  - `POST /api/generate-code` — generates a 6-digit pairing code for device linking.
  - `PUT /switch` — toggle allowing or pausing remote AI command execution.

### Phase 4: Cloud WebSocket Client (`ClientWebSocket` Background Service)
- [ ] **Persistent Connection to Nexus Cloud (`backend/`):**
  - Implement a .NET `BackgroundService` (`IHostedService`) managing an auto-reconnecting `ClientWebSocket`.
  - Read/save credentials from `%APPDATA%\Nexus\deviceToken.json`.
  - Receive remote `RunCMD` requests from the cloud, dispatch to local command engine, and stream results back.
  - Stream periodic heartbeat and system telemetry to the cloud every 10–20 seconds.

### Phase 5: Hardware Telemetry & Screen Capture Superpowers
- [ ] **Hardware Monitoring via `LibreHardwareMonitorLib`:**
  - Real-time CPU usage % and temperature.
  - GPU usage % and temperature.
  - RAM total, used, and percentage.
  - Battery / power state.
- [ ] **In-Memory Screen Capture (`System.Drawing.Common`):**
  - Native GDI+ screen capture directly into RAM `MemoryStream` in <15ms.
  - Base64 JPEG encoding for visual verification without writing temporary files to disk.

### Phase 6: Windows System Tray Companion (Optional Polish)
- [ ] **System Tray Icon (Notification Area):**
  - Minimalist tray icon next to the Windows clock.
  - Right-click menu: "Open Dashboard", "Pause Remote Access", "Check for Updates", "Quit".
