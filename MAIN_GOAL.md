# 🎯 MAIN GOAL: Zero-Loss Disaster Recovery & Clean-Slate Restoration

The objective is to ensure that if this entire project directory or machine is deleted, the **Nexus Ecosystem** can be completely restored, built, and brought back online with zero data loss and minimal manual effort.

---

## 🏗️ 1. Pillars Required for Complete Project Restoration

To achieve true clean-slate restorability, the project must satisfy five core pillars:

### 1. Codebase & Version Control (Git)
* **Remote Repository Sync:** All source code across `backend`, `frontend`, and `nexus_app_v2` must be pushed to a remote repository (e.g., GitHub/GitLab).
* **Deterministic Dependencies:** Lockfiles (`package-lock.json`) must be committed for all modules to prevent breaking version drift during reinstalls.
* **Repository Hygiene (`.gitignore`):** Ignore build artifacts (`dist`, `.expo`, `node_modules`, `*.log`), while ensuring setup files, scripts, and asset folders are tracked.

### 2. Secrets & Environment Configuration
* **Standardized `.env.example` Files:** Every sub-project (`backend`, `frontend`, `nexus_app_v2`) must have an up-to-date `.env.example` detailing every required key and its purpose.
* **Central Secrets Backup:** A secure off-repo backup (e.g., Password Manager or Encrypted Vault) containing:
  * Master API Key (`NEXUS_API_KEY`)
  * AI Provider Keys (Gemini, Groq, NVIDIA NIM, OpenCode)
  * MongoDB Connection URI

### 3. Database & State Persistence
* **Cloud Database vs. Local Snapshots:**
  * **Option A (Recommended):** Use MongoDB Atlas (Cloud) with automated daily snapshots so database state persists independently of local disk deletion.
  * **Option B:** Provide automated database export/import scripts (`mongodump` / `mongorestore`) to backup collections (`memories`, `chats`, `sessions`).
* **Chat History Migration:** Transition chat logs from local file-based storage (`backend/AI/chats/`) to the database so conversations are backed up centrally.

### 4. External Dependencies & AI Proxy Portability
* **Automate Proxy Setup:** The Python/WSL AI proxy currently located at `~/fcc/nvidia-nim` must have a self-contained setup script or requirements file (`requirements.txt` / `pyproject.toml`) included inside the repository.
* **Cross-Platform Scripting:** Ensure launcher scripts (`runAll.ps1`, `setup.bat`) work on any fresh machine with standard prerequisites.

### 5. Automated Bootstrap Scripting
* **1-Command Dependency Installation:** A root script (e.g., `npm run setup:all` or `setup.ps1`) to install all sub-project dependencies concurrently.
* **1-Command Launch:** A single unified script (`.\runAll.ps1` or Docker Compose) to start all services (Backend, Frontend, Mobile packager, and AI proxy).

---

## 📋 2. Actionable Setup Checklist

- [ ] **Step 1: Create `.env.example` templates** in `backend/`, `frontend/`, and `nexus_app_v2/`.
- [ ] **Step 2: Commit all current sub-projects** (`backend`, `frontend`, `nexus_app_v2`) to the remote Git repository.
- [ ] **Step 3: Migrate chat history to MongoDB** to eliminate reliance on local `.json` files.
- [ ] **Step 4: Script external proxy dependencies** so the Python NIM proxy can be installed with a single command on a clean machine.
- [ ] **Step 5: Create a root `setup.ps1` / `setup.bat`** script to automate `npm install` across all packages.
- [ ] **Step 6: Write a Disaster Recovery Runbook** detailing exact steps to restore from scratch.

---

## 🧪 3. Restoration Test Protocol (Validation)

To verify that the project has reached this goal:

1. Clone the repository into a completely fresh, empty directory (`Nexus_v2_Test`).
2. Copy environment secrets from the secure vault into `.env` files using `.env.example` templates.
3. Run the automated setup script (`.\setup.ps1`).
4. Execute `.\runAll.ps1` and verify:
   * Backend connects to MongoDB and starts on `http://localhost:3100`.
   * Frontend loads and communicates with backend.
   * Mobile app bundles without missing module errors.
   * AI ReAct loop executes shell commands and returns responses.
