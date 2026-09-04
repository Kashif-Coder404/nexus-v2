# 📋 Local-BE — Next To-Do & Roadmap (`nexttodo.md`)

## 🗑️ Nexus Companion Uninstaller Roadmap

### 1. Overview
Provide end-users with a clean, one-click or single-command method to completely remove the Nexus companion executable, startup script, and persistent credentials from their Windows machine.

---

### 2. Proposed Uninstallation Flow & Tasks

- [ ] **CLI Uninstall Flag (`nexus.exe --uninstall`):**
  - Add argument parsing to `server.ts` / `setupnexus.ts` for `--uninstall` or `-u`.
  - When executed with this flag:
    1. **Terminate Background Process:** Run `taskkill /F /IM nexus.exe` to stop any running companion instances.
    2. **Remove Startup Script:** Delete `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\run_nexus.vbs`.
    3. **Delete Installed Binary & Folder:** Delete `%LOCALAPPDATA%\Programs\Nexus\nexus.exe` and the `Nexus/` directory.
    4. **Clear Credentials / Pairing Token (Optional Prompt):** Delete `%APPDATA%\Nexus\deviceToken.json`.
    5. **Exit Confirmation:** Print a confirmation message and exit.

- [ ] **Web UI "Unlink & Uninstall" Action:**
  - Add an "Uninstall Companion" button to the local web interface (`http://localhost:4100/`).
  - Upon user confirmation:
    - Trigger an endpoint (e.g. `POST /api/uninstall`).
    - The server removes the startup script, deletes the token, schedules the executable removal via a self-deleting `.cmd` script (`timeout /t 2 & rmdir /s /q ...`), and shuts down the process.

- [ ] **Windows "Add or Remove Programs" Registry Integration (Optional):**
  - Register an uninstall entry in `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexus` so Nexus appears natively in Windows Settings > Installed Apps with an "Uninstall" button.
