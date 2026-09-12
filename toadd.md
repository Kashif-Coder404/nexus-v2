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
