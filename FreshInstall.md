# 🛠️ Nexus Ecosystem - Fresh Windows Installation Guide

This guide outlines the complete step-by-step procedure required to restore, configure, and run the **Nexus Ecosystem** on a clean installation of Windows.

---

## ⚠️ Step 0: Critical Backups (Perform BEFORE formatting/reinstalling Windows)

Before wiping your current Windows installation, back up these essential items to an external USB drive or secure cloud storage:

1. **WSL Ubuntu Proxy Directory**:
   * Back up `~/fcc/nvidia-nim` from your WSL Ubuntu environment (contains your FastAPI/Uvicorn proxy server running on port `8082`). Reinstalling Windows wipes WSL completely.
2. **Environment Files (`.env`)**:
   * `backend/.env` (Contains your database connection strings, JWT secret, Gemini/Groq API keys, etc.)
   * `frontend/.env` / `frontend/.env.local`
   * `nexus_app_v2/.env.local` (or `nexus-app/.env`)
   * `frontend-Testing/.env` (if applicable)
   * `Local-BE/.env` (if applicable)
3. **Local Database Data**:
   * If you run MongoDB locally (rather than MongoDB Atlas), run `mongodump` to back up your database records.
4. **Git Repository**:
   * Ensure all local commits across all branches are pushed to your remote repository.

---

## Phase 1: Core Windows Runtimes & Tools

Install these foundational developer tools on your clean Windows OS:

1. **[Git for Windows](https://git-scm.com/download/win)**
   * Standard installation settings.
2. **[Node.js (LTS v20+ / v22+)](https://nodejs.org/)**
   * Installs Node.js, `npm`, and `npx`.
3. **[Python 3.10+](https://www.python.org/downloads/)**
   * ⚠️ **Crucial:** Check the box **"Add Python to PATH"** during installation. The backend spawns `python` directly for running system search utilities.
4. **[MongoDB Community Server & Compass](https://www.mongodb.com/try/download/community)** *(Optional if using MongoDB Atlas cloud)*
   * Install as a Windows Service for automated background startup.

---

## Phase 2: Windows System Modules & Tool Dependencies

The Nexus backend relies on native Windows tools and PowerShell modules:

### 1. Voidtools Everything
* Download and install **[Voidtools Everything](https://www.voidtools.com/)**.
* Ensure the **Everything** desktop service is running in your system tray. The backend uses `Everything64.dll` via IPC to perform ultra-fast desktop searches.

### 2. AudioDeviceCmdlets (PowerShell Module)
* The backend volume control tool uses PowerShell cmdlets (`Get-AudioDevice` and `Set-AudioDevice`).
* Open **PowerShell as Administrator** and execute:
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  Install-Module -Name AudioDeviceCmdlets -Force
  ```

---

## Phase 3: Windows Subsystem for Linux (WSL 2) & AI Proxy

The AI proxy server runs inside a Linux environment.

1. **Install WSL 2 & Ubuntu**:
   Open PowerShell as Administrator and run:
   ```powershell
   wsl --install -d Ubuntu
   ```
   Restart your PC if prompted and set up your Ubuntu username and password.

2. **Install `uv` (Fast Python Package Manager)**:
   Open your Ubuntu terminal and run:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. **Restore Proxy Server**:
   * Restore your backed-up `~/fcc/nvidia-nim` directory inside Ubuntu.
   * Verify the proxy server starts correctly:
     ```bash
     cd ~/fcc/nvidia-nim
     ~/.local/bin/uv run uvicorn server:app --host 0.0.0.0 --port 8082
     ```

---

## Phase 4: Mobile Development Setup (Optional)

If developing or running the mobile app (`nexus_app_v2`):

1. **Physical Device**: Install the **Expo Go** app from the Google Play Store or Apple App Store.
2. **Virtual Device (Emulator)**: Install **[Android Studio](https://developer.android.com/studio)** and configure an Android Virtual Device (AVD).

---

## Phase 5: Project Setup & Environment Configuration

1. **Clone the Repository**:
   ```bash
   git clone <your-repository-url>
   cd Nexus_v2
   ```

2. **Restore Environment Files (`.env`)**:
   Re-create or copy your backed-up `.env` files to their respective locations:

   * **`backend/.env`**:
     ```env
     PORT=3100
     MONGO_URI=mongodb://localhost:27017/nexus
     JWT_SECRET=your_jwt_secret
     GEMINI_API=your_gemini_api_key
     GROQ_KEY_COLLEGE_WISE=your_groq_key
     # Add any other provider keys required by EnvVariables.ts
     ```

   * **`frontend/.env.local`**:
     ```env
     NEXT_PUBLIC_BACKEND_URL=http://localhost:3100
     ```

   * **`nexus_app_v2/.env.local`**:
     ```env
     EXPO_PUBLIC_BACKEND_URL=http://<YOUR_LOCAL_IP>:3100
     ```

---

## Phase 6: Dependency Installation & Launching

1. **Install Node Dependencies**:
   Open a terminal in the root `Nexus_v2` folder and run:
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install

   # Mobile App
   cd ../nexus_app_v2 && npm install
   ```

2. **Run the Full Ecosystem**:
   From the root `Nexus_v2` directory in PowerShell:
   ```powershell
   ./runAll.ps1
   ```
   *Alternatively, navigate into `backend/` and run:*
   ```bash
   npm run all
   ```
