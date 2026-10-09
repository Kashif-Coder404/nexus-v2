# 🤖 Nexus AI Companion — OS Command Execution Rules

> **Purpose:** These rules define how the Nexus Cloud AI must format commands, select execution models, and handle Windows-specific quirks when operating on a user's machine via the Local C# Companion (`Local-BE-v2`).

---

## 🎯 The 3-Axis Command Decision Matrix

When constructing a command request to `/test-cmd`, the AI must specify:
1. `ExecutionType`: `Wait` | `Background`
2. `VerifyType`: `None` | `Window` | `Pid`
3. `OutputMode`: `Final` | `Live` | `Event`

---

## 📋 Rule Categories

### 1. Opening Folders (Windows File Explorer)
* **Rule:** ALWAYS format folder open commands as:
  ```powershell
  explorer 'D:\Path\To\Folder'
  ```
* **Critical Constraint:** 
  - MUST use Windows backslashes `\` (e.g. `'D:\Coding\Projects'`).
  - NEVER use forward slashes `/` with `explorer.exe` (forward slashes cause Explorer to treat the path as a switch and default to the Documents folder).
* **Execution Parameters:**
  ```json
  {
    "Command": "explorer 'D:\\Path\\To\\Folder'",
    "ExecutionType": "Wait",
    "VerifyType": "Window",
    "OutputMode": "Event"
  }
  ```
* **Why:** Windows spawns a dedicated separate `explorer.exe` window process with a unique PID, which is verified by the kernel and can be cleanly killed later without closing the desktop shell.

---

### 2. Opening Websites & URLs
* **Rule:** Use `Start-Process` with quotes:
  ```powershell
  Start-Process 'https://www.youtube.com'
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "Start-Process 'https://www.youtube.com'",
    "ExecutionType": "Wait",
    "VerifyType": "Window",
    "OutputMode": "Event"
  }
  ```
* **Why:** Respects the user's default browser (Brave, Chrome, Edge, Firefox), supports multi-process Chromium sandboxing, and captures the spawned tab renderer PIDs.

---

### 3. Launching Desktop Applications & Games (Roblox, Calc, Blender, etc.)
* **Rule:** Launch via application alias or executable name:
  ```powershell
  calc
  notepad
  & "$env:LOCALAPPDATA\Roblox\Versions\...\RobloxPlayerBeta.exe"
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "<app_command>",
    "ExecutionType": "Wait",
    "VerifyType": "Window",
    "OutputMode": "Event"
  }
  ```
* **Why:** Silently spawns launcher via PowerShell with `CreateNoWindow = true`, ignores temporary helper shells (`powershell`, `cmd`, `conhost`), and isolates the genuine GUI application PID.

---

### 4. Opening Folders in VS Code (Zero Dependency on `code` in PATH)
* **Rule:** Use the native registered Windows Protocol Scheme:
  ```powershell
  Start-Process 'vscode://file/D:/Path/To/Project'
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "Start-Process 'vscode://file/D:/Path/To/Project'",
    "ExecutionType": "Wait",
    "VerifyType": "Window",
    "OutputMode": "Event"
  }
  ```
* **Why:** Bypasses missing `code.cmd` in system `PATH` and focuses already-running instances cleanly.

---

### 5. Running Live Interactive Dev Servers (`npm run dev`)
* **Rule:** Run when the user explicitly wants to see console output or press `Ctrl+C`:
  ```powershell
  cd D:\Project\Path ; npm run dev
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "cd D:\\Project\\Path ; npm run dev",
    "ExecutionType": "Background",
    "VerifyType": "Window",
    "OutputMode": "Live"
  }
  ```
* **Why:** Opens a visible Windows Terminal / PowerShell window with `-NoExit`, verifies the terminal window PID immediately, and leaves the server running live for the developer.

---

### 6. Silent Background Daemons & Microservices
* **Rule:** Run when the user wants a headless task, database, or background worker:
  ```powershell
  npm run worker:sync
  python server.py
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "<service_command>",
    "ExecutionType": "Background",
    "VerifyType": "Pid",
    "OutputMode": "Live"
  }
  ```
* **Why:** 100% headless (0 windows, 0 flicker). Redirects stdout/stderr asynchronously, verifies PID is alive after 1 second (detects immediate crashes / port conflicts), and stores the process in `ProcessLauncher.ActiveProcess` for log streaming and termination.

---

### 7. Software Installation via Winget
* **Rule:** ALWAYS include silent non-interactive acceptance flags:
  ```powershell
  winget install --id <package_id> -e --silent --accept-package-agreements --accept-source-agreements
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "winget install --id <package_id> -e --silent --accept-package-agreements --accept-source-agreements",
    "ExecutionType": "Wait",
    "VerifyType": "None",
    "OutputMode": "Final",
    "TimeoutSeconds": 180
  }
  ```
* **Why:** Without these flags, winget halts indefinitely waiting for interactive license agreement stdin.

---

### 8. Project Scaffolding & Interactive CLI Wizards (`create-next-app`, `create-vite`, `npm init`)

Interactive CLI tools ask multiple questions (e.g. project name, TypeScript?, Tailwind?, ESLint?).

#### Approach A: 100% Autonomous (Zero Enter Presses) — RECOMMENDED
When the user asks Nexus to create an app without wanting to manually press Enter:
* **The AI must append all configuration flags or `--yes`:**
  ```powershell
  # Next.js with all default recommended flags:
  npx create-next-app@latest my-app --yes
  # OR explicit flags:
  npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

  # Vite:
  npm create vite@latest my-app -- --template react-ts

  # npm:
  npm init -y
  ```
* **Execution Parameters:**
  ```json
  {
    "Command": "npx create-next-app@latest my-app --yes",
    "ExecutionType": "Wait",
    "VerifyType": "None",
    "OutputMode": "Final",
    "TimeoutSeconds": 180
  }
  ```
* **Why:** Bypasses 100% of interactive prompts and Enter key presses. Scaffolds unattended in the background.

#### Approach B: In-Chat Question Resolution
* The AI asks the user inside the **Nexus Chat** *first*:
  > *"Would you like TypeScript, Tailwind, and App Router for your new Next.js app?"*
* Once the user replies in chat, the AI translates their preferences directly into the command flags (`--typescript --tailwind`) and runs Approach A.
* **Advantage:** User chooses their stack easily inside the clean chat UI without ever touching a terminal.

#### Approach C: Visible Terminal Window (Mode 2)
* When the user explicitly wants to see the raw CLI wizard and use arrow keys/Enter themselves:
  ```json
  {
    "Command": "npx create-next-app@latest my-app",
    "ExecutionType": "Background",
    "VerifyType": "Window",
    "OutputMode": "Live"
  }
  ```
* **Why:** Pops up a visible Windows Terminal on the desktop (`-NoExit`), allowing direct keyboard navigation.

