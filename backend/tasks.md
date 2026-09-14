# 📋 Backend & System Tasks (`tasks.md`)

## 🔐 Feature: Device Secret Code / Physical PIN Verification (Zero-Trust Remote Access)

### 1. Overview & Objective

Provide an end-to-end security layer where the physical machine owner sets a private **Secret Code / PIN** on their local companion (`http://localhost:4100/`). When paired, this PIN is stored securely (hashed) on the Cloud Backend. Whenever the user accesses the device from the frontend web app, they must supply this Secret Code to unlock and execute remote commands.

> **Zero-Trust Principle**: Even if cloud account credentials (email/password) are stolen or leaked, unauthorized actors cannot execute arbitrary commands on the user's physical machine without the physical device PIN.

---

### 2. Architecture & Data Flow

```
[Local Companion (paringcode.html)]
   │
   ├─ 1. User inputs custom Secret Code / PIN
   ├─ 2. WS sends { type: "PairingInit", code, secretCode }
   ▼
[Cloud Backend (websocket.service.ts / device.controller.ts)]
   │
   ├─ 3. Hash secretCode using bcrypt (saltRounds: 10)
   ├─ 4. Store `deviceSecretHash` in MongoDB (Device / UserModel)
   ▼
[Frontend Web App (frontend-Testing)]
   │
   ├─ 5. User logs in to web console
   ├─ 6. Web app prompts: "Enter Device Secret PIN to unlock [Device Name]"
   ├─ 7. Sends POST /api/device/verify-pin { deviceId, pin }
   ▼
[Cloud Backend Authorization]
   │
   ├─ 8. Bcrypt compare -> Grants temporary session authorization token
   └─ 9. Allows `RunCMD` routing to local machine
```

---

### 3. Detailed Implementation Tasks

#### Phase 1: Local Companion (`Local-BE`)

- [ ] **UI Input in `paringcode.html`**:
  - Add an optional/required input field for "Device Secret PIN / Passphrase" on the pairing screen.
  - Provide input masking (password type) with a toggle visibility button.
- [ ] **WebSocket Payload in `ws.service.ts`**:
  - Attach `secretCode` to the `PairingInit` WebSocket payload when initiating or confirming device pairing.

#### Phase 2: Cloud Backend (`backend/`)

- [ ] **Database Schema Update**:
  - Add `deviceSecretHash: { type: String, select: false }` to the Device / User schema in MongoDB.
  - Add `failedPinAttempts: { type: Number, default: 0 }` and `pinLockoutUntil: { type: Date }` for brute-force protection.
- [ ] **Bcrypt Hashing**:
  - Hash the incoming `secretCode` using `bcrypt.hash(secretCode, 10)` before persisting.
- [ ] **Verification Endpoint**:
  - Implement `POST /api/device/verify-pin`:
    - Validates `deviceId` and `pin`.
    - Checks rate-limiting / lockout thresholds (max 5 failed attempts).
    - Compares PIN with `bcrypt.compare`.
    - Returns a signed JWT / session grant (e.g. `deviceAccessToken`) valid for the current browser session.
- [ ] **Command Execution Gatekeeper**:
  - In `askAI.ts` / `websocket.service.ts`, ensure `RunCMD` is rejected if the requesting session has not passed device PIN authorization.

#### Phase 3: Web Frontend (`frontend-Testing`)

- [ ] **Device PIN Challenge Modal / Screen**:
  - Render an authentication challenge modal when a user accesses a paired device.
  - Support automatic focus, numeric keypad or text input, and error messages (e.g., "Incorrect PIN — 3 attempts remaining").
- [ ] **Auth State Management in `provider.tsx`**:
  - Store the `isDeviceUnlocked` state and pass the verification token in command headers.

---

### 4. Security Requirements

- ❌ **NEVER** log or store `secretCode` in plain text in logs, database, or WebSocket frames.
- 🔒 **Rate Limiting**: Lock device verification for 15 minutes after 5 consecutive incorrect attempts.
- ⏱️ **Session Scoping**: Store unlock status in sessionStorage or temporary JWT so closing the browser requires re-entry.

### 5 Terminal Output Schema

```TS
type Terminal = {
  id: string,
  cmd: string,
  TerminalOutput: "string",
  TerminalError?: "string",
  success: bolean,
  successType: "success" | "no output",
  errorCode: number,
  errorType: "device failed" | "command failed"
}
const terminals: Terminal[] = [];
```




MAIN :

---

## ✅ Session Progress — 2026-09-14

### ✅ Completed This Session

- [x] **Direct LAN Telemetry ("Connection Welder") Implemented**
  - `Local-BE` WebSocket server (`localwss`) on port `4100` now broadcasts `getSystemInfo()` every 2s.
  - Frontend `liveFeedWs.service.ts` connects directly to `ws://<PC_IP>:4100/` over LAN.
  - `Devices.tsx` renders live CPU, RAM, Uptime, Operator, Platform in glassmorphic cards.

- [x] **IP Address Propagation via Cloud Backend**
  - `Local-BE` sends its LAN IP in the `ipAddress` header on Cloud WS authentication.
  - Cloud backend stores `ws.ipAddress` and sends it inside `device_status` → `device.ipaddress`.

- [x] **Devices Store Updated**
  - `ipAddress` field added to `Device` interface in `useDevices.ts`.
  - `setIpAddress()` action added to Zustand store.

- [x] **Frontend `ws.service.ts` — `device_status` Handler**
  - Now extracts `payload.device.ipaddress` and calls `setIpAddress(deviceId, ip)` to persist IP into store.

- [x] **Offline Detection with Dual-Source Status**
  - `isDeviceOnline = currentDevice.online && isConnected` combines both cloud + LAN state.
  - Visual: greyed/dimmed telemetry on offline, pulsing red OFFLINE badge, animated ping indicator.
  - Offline body card with contextual message shown when `!sysInfo && !isDeviceOnline`.

- [x] **Responsive Device Card Layout Fixed**
  - Header: title row (icon + name + rename btn) + subtitle row (hostname + IP) — no more squishing on mobile.
  - Buttons: Live badge + Revoke pill in `flex-row` on same line, always `shrink-0`.
  - Bottom vitals always `grid-cols-3`, `truncate block` on all cells.
  - `whitespace-nowrap` on RAM used/total so values never wrap.

- [x] **Console Cleanup**
  - Removed all unnecessary `console.log` from `ws.service.ts`, `liveFeedWs.service.ts`, `Login.tsx`, `Signup.tsx`, `SendMsg.tsx`, `DeviceItem.tsx`, `AIMsgBox.tsx`.

- [x] **Sidebar DeviceItem — Navigate to /devices on Click**
  - `DeviceItem.tsx` now uses `useRouter().push("/devices")` on click.

- [x] **README.md Fully Updated**
  - Connection Welder architecture in Mermaid diagram.
  - Feature list updated to include telemetry, responsive UI, offline detection.
  - Roadmap updated with completed checkmarks.

- [x] **GitHub Releases**
  - `nexus.exe` rebuilt via `npm run build:exe` (esbuild + Node SEA).
  - Tag `v2.5.4` created and pushed to `origin/main`.

---

## 🔴 Open Issues / Not Yet Solved

### ❌ Direct LAN Connection Fails on First Pair (After Pairing, Refresh Required)

**Status**: Still unresolved. Fix attempted but issue persists.

**Root Cause Analysis**:
When `Local-BE` pairs with the Cloud Backend for the **first time**, the sequence is:
1. `Local-BE` sends its IP in the WS auth header → Cloud stores `ws.ipAddress`.
2. Cloud fires `device_status` → `{ device: { id, deviceName, ipaddress }, online: true }` to the frontend.
3. Frontend `ws.service.ts` receives `device_status`, sets `online: true`, and (now) sets `ipAddress`.
4. **BUT**: The `Devices.tsx` `useEffect` which opens the LAN WebSocket depends on `[currentDevice?.ipAddress, currentDevice?.online]`.
5. **The problem**: The `device_status` arrives AFTER the component has already mounted and the `useEffect` fired with `ipAddress = undefined`. Because `ipAddress` was `undefined` at that point, `livewebsocket(undefined)` returned `null` early and the connection was never established.
6. The `useEffect` has `currentDevice?.ipAddress` in its dependency array, so it SHOULD re-run when the IP arrives — but there may be a **race condition** or **stale closure** issue preventing re-execution.

**What was fixed**:
- `ws.service.ts` now correctly extracts and stores `ipAddress` from `device_status` payload.
- `setIpAddress()` was added to the Zustand store.

**What still needs investigation**:
- [ ] Verify whether `useEffect` in `Devices.tsx` actually re-fires when `currentDevice.ipAddress` changes from `undefined` → IP string via Zustand.
- [ ] Check if the `useDevices` selector in `Devices.tsx` is causing a stale reference (selector returns new object each render — could cause infinite loops or missed updates).
- [ ] Consider adding a `console.log` temporarily to confirm `currentDevice?.ipAddress` changes after `device_status` arrives.
- [ ] Alternative: add a small retry/polling mechanism in `liveFeedWs.service.ts` that retries connection every 3s if IP becomes available.

---

## 🟡 Upcoming Tasks

- [ ] **JWT Expiration Auto-Watcher** in `DashboardLayout`:
  - `isTokenExpired(token)` utility using base64 JWT decode.
  - `setInterval(checkAuth, 30000)` + `visibilitychange` event listener.
  - Redirect to `/login` and call `logout()` on expiry.

- [ ] **Device PIN / Secret Code System** (see Phase 1–3 above).

- [ ] **Proactive `requestDevices()` on `/devices` page mount**:
  - When user navigates to `/devices`, call `requestDevices()` immediately to ensure cloud sends fresh `device_list` with current IP addresses.

- [ ] **MongoDB Chat History Migration**: Move `askAI.ts` from file-based JSON to `ChatModel`.

- [ ] **Persistent Terminal CWD**: Keep active working directory across sequential shell turns.