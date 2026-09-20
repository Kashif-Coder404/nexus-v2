# 📋 Project Features & Roadmap (`toadd.md`)

## 🎨 Frontend Roadmap & Milestones

### ✅ Completed
- [x] **Tailwind CSS v4 & IntelliSense Integration**:
  - Configured workspace settings for nested `style` object autocomplete and TSX support.
- [x] **Landing Page (`page.tsx`)**:
  - Modern hero layout with glowing dashboard poster frame.
  - Spaced desktop responsive layout (`xl:`) and mobile column view.
- [x] **Authentication UI (Login & Sign Up)**:
  - Glassmorphic dark cards matching Nexus purple aesthetic (`#7357E2` to `#9129b6`).
  - Standardized form controls, labels, and focus rings.
  - Interlinked routes (`/auth/login` and `/auth/signup`).
- [x] **Viewport & Background Fixes**:
  - Resolved mobile address bar scroll clipping with `min-h-dvh`.
  - Fixed linear gradient cutoff on scroll with `bg-fixed bg-no-repeat`.
- [x] **Interactive Desktop/Mobile Sidebar (`SideBar.tsx`)**:
  - Collapsible sidebar drawer with responsive backdrop on mobile.
  - Collapsible Dropdown component with item counter badges.
  - Dynamic chat session history, delete session integration, and new chat reset.
  - Real-time companion status badges (`● Online`, `● Paused`, `○ Offline`) with WebSocket sync.
  - Manual device list reload trigger.
- [x] **Standalone Windows Companion & Release v2.3.0 (`nexus.exe`)**:
  - Node.js SEA standalone compilation with zero external dependencies.
  - Silent administrative Task Scheduler installation on logon.
  - Automated Windows User `PATH` registration on install & scrubbing on `--uninstall`.
  - Local companion dashboard (`localhost:4100`) with debounced remote execution toggle.
  - Released on GitHub Releases with checksum integrity.
- [x] **Chat UI & Markdown Rendering**:
  - Replaced plain text rendering with `ReactMarkdown` and `remarkGfm`.
  - Word wrapping and boundary protection (`[overflow-wrap:anywhere] break-words`).

---

### 🎯 Next Up: Active Target Device Selector (Sidebar Radio Buttons)
When users pair multiple machines (e.g. "Work Laptop", "Gaming PC", "Office Desktop"):
- [ ] **Frontend UI (`SideBar.tsx`)**:
  - Add purple radio indicator button next to each device in the sidebar list.
  - Clicking any device sets it as the currently active target machine.
  - Highlight the active device with glowing purple border and active indicator.
- [ ] **State Management (`useDevices.ts`)**:
  - Add `activeDeviceId: string | null` and `setActiveDevice(id: string)` to Zustand store.
  - Auto-select the first online device if no active device is currently chosen.
  - Persist active device selection across page reloads.
- [ ] **Targeted Backend Dispatch (`backend/services/websocket.service.ts`)**:
  - Pass `activeDeviceId` with chat/command execution requests.
  - Filter `sendCmdRequest` socket dispatch to execute only on the selected `activeDeviceId` rather than broadcasting to all devices.

---

### 📦 Maintenance & Build Tasks
- [x] **Rebuild Companion Binary & Release v2.4.0 (`nexus.exe`)**:
  - Compiled and bundled the latest debounced remote execution toggle and real-time status sync into standalone executable `nexus.exe` (Node.js SEA).
- [x] **Native PowerShell Shell Execution & Release v2.5.0 (`nexus.exe`)**:
  - Switched `executeCmd` shell to `powershell.exe` on Windows for complex pipe and cmdlet execution without `cmd.exe` single-quote parsing failures.
  - Resolved `terminalOutput` masking in `cmd.controller.ts` and isolated errors into dedicated rose-colored `Error Output` console in `AIMsgBox.tsx`.
  - Added screen capture streaming with URI normalization and MongoDB chat persistence.

---

## 🔐 Priority Backend Feature: Device Secret Code / 2FA PIN Verification (Zero-Trust Remote Access)

### Concept
Allow users to define a private **Secret Code / PIN** directly on their physical machine companion (`http://localhost:4100/`) during pairing. When paired:
- The Cloud Backend stores this PIN hashed using `bcrypt` (`deviceSecretHash`).
- Whenever the user logs in to the Web Frontend, they are prompted to enter this Secret Code to unlock the device.
- **Zero-Trust**: Even with stolen account credentials, no remote commands can run on the user's PC without knowing the physical device's PIN.

### Implementation Checklist
- [ ] **Local Companion (`Local-BE`)**:
  - Add Secret Code input field in `Local-BE/paringcode.html`.
  - Transmit `secretCode` in `PairingInit` payload in `Local-BE/services/ws.service.ts`.
- [ ] **Cloud Backend (`backend/`)**:
  - Add `deviceSecretHash` field to MongoDB device/user schema.
  - Add `POST /api/device/verify-pin` endpoint with bcrypt validation and 5-attempt rate-limiting.
  - Reject `RunCMD` until the active session has passed PIN verification.
- [ ] **Web Frontend (`frontend/`)**:
  - Add Device Unlock Challenge modal when selecting a paired machine.
  - Store temporary session unlock token.

> For the detailed technical task specification, see [backend/tasks.md](../../backend/tasks.md).

---

## ⚡ Local-BE-v2 (.NET 8 C#) — Full Operational Parity & `nexus.exe` Compilation

### ✅ Completed Milestones
- [x] **Core AI Execution Engine**: All 5 actions ported to native C# (.NET 8): `in_built`, `search`, `search_app`, `capture_screen`, `system_info`.
- [x] **4-Persona Process Launcher**: Process lifecycle engine supporting `Wait`, `Background`, `Window`, and `Pid` with process tree kill.
- [x] **LAN IPv4 Detection & Device Status**: Local IP resolution and `device_status` broadcast on WebSocket connect.
- [x] **Remote Execution Killswitch Backend**: Active `IsServiceEnabled` gate rejecting commands with user-friendly notices when paused.
- [x] **WebSocket Control Methods (`WebSocketClientService.cs`)**:
  - `BroadcastStatusAsync(bool isEnabled)`: Broadcasts updated switch state to cloud.
  - `SendPairingInitAsync()`: Emits `PairingInit` with temporary code.
  - `SendRevokeAsync()`: Emits `revoke-device` on local uninstallation.
  - `GetTokenAsync()` & `DeleteTokenAsync()`: Helpers managing `%APPDATA%\Nexus\deviceToken.json`.
- [x] **Global Session Expiry Guard & UI Protection**:
  - Zero-latency client-side `isTokenExpired` helper decoding JWT `exp` claims.
  - Active event listeners on `focus`, `visibilitychange`, and `resize` in `DashboardLayout` auto-logging out expired sessions.
  - `401 Unauthorized` fetch interceptor in `SendMsg.tsx` preventing raw `"jwt expired"` messages in chat feed.
  - Extended backend token lifetime in `jwt.service.ts` from 1 hour to 7 days.
  - Defaulted frontend input model to `gemini-3.5-flash-lite`.
- [x] **Surgical Process Termination Directive (`main.Instructions.ts`)**:
  - Mandated hunting chat history for recent process launch PIDs.
  - Enforced `taskkill /F /PID <pid> /T` and `Stop-Process -Id <pid> -Force` for complete process tree termination.
  - Restricted `MainWindowTitle` exclusively to browser tab targeting.

---

### 🎯 Remaining Roadmap (Priority Order)

### 1. Direct P2P LAN Hardware Telemetry Stream (Port 4100)
- [ ] **`GetLiveFeedJson()` in `GetSystemInfoService.cs`**:
  - Prepares system snapshot: OS details, CPU model/cores/clock speed, memory used/total/percentage, user info, and rich hardware telemetry.
  - Matches exact schema consumed by `Devices.tsx` and `liveFeedWs.service.ts`.
- [ ] **ASP.NET Core WebSocket Endpoint (`ws://*:4100/`) in `Program.cs`**:
  - Enables `app.UseWebSockets()`.
  - Pushes `{ message: "Connected to Local-BE!" }` and immediate initial snapshot.
  - Background loop streams updated telemetry every 5 seconds over local Wi-Fi with zero cloud latency.
- [ ] **LAN IP Binding**: Bind Kestrel to `http://0.0.0.0:4100` so mobile phones and LAN clients can connect.

### 2. Local Web Dashboard & REST APIs (`Program.cs`)
- [ ] **Embedded `paringcode.html`**:
  - Embed `paringcode.html` as `<EmbeddedResource>` inside `Nexus.Agent.csproj`.
  - Serve directly from memory at `/`, `/setup`, `/login`, `/paring` (100% standalone, no external files required).
- [ ] **REST Endpoints**:
  - `GET /api/pairing-status`: `{ isConnected, isPaired, isEnable, code, remainingSeconds, pairingError }`.
  - `GET /getParingCode`: Legacy backwards-compatible alias.
  - `POST /api/generate-code`: Generates a fresh temporary pairing code.
  - `PUT /switch`: Toggles `DeviceStateManager.IsServiceEnabled` and calls `BroadcastStatusAsync`.
  - `GET /getService`: Returns `{ isEnable }`.
  - `POST /api/stop-server`: Gracefully terminates the agent process.
  - `POST /api/uninstall`: Revokes cloud registration and removes local device token.

### 3. Standalone Single-File Compilation (`nexus.exe`)
- [ ] **UAC Administrator Elevation (`app.manifest`)**:
  - Embed `<requestedExecutionLevel level="requireAdministrator" uiAccess="false" />` so `WinRing0x64.sys` always gets kernel permissions on launch (preventing CPU Temp: 0).
- [ ] **Single-File Self-Contained Profile (`Nexus.Agent.csproj`)**:
  - Set `PublishSingleFile=true`, `SelfContained=true`, `RuntimeIdentifier=win-x64`, `IncludeNativeLibrariesForSelfExtract=true`, `EnableCompressionInSingleFile=true`.
  - Produces standalone ~55-65 MB executable with zero prerequisites.
- [ ] **Silent Background Execution**:
  - Configure `<OutputType>WinExe</OutputType>` for production to run with no black console window.
- [ ] **One-Click Build Script (`build-agent.ps1`)**:
  - Automates clean release publishing into `Local-BE-v2/dist/nexus.exe`.

### 4. Self-Installer & Service Lifecycle (`SetupService.cs`)
- [ ] **First-Launch Installation Flow**:
  - Detects if running from `%LOCALAPPDATA%\Programs\Nexus\nexus.exe`.
  - If external, copies binary, adds directory to User `PATH`, and registers Windows Task Scheduler logon task (`schtasks /sc onlogon /rl HIGHEST`).
  - Launches background service silently.
- [ ] **CLI Flags**:
  - `nexus --start`: Starts background agent.
  - `nexus --stop`: Terminates running instances.
  - `nexus --uninstall`: Unregisters task, cleans PATH, revokes cloud registration, and deletes program folder.

