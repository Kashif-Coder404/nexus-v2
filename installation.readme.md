# 🛠️ Nexus Ecosystem - Reinstallation Guide

This guide outlines the step-by-step process to set up the Nexus Ecosystem (Frontend, Backend, and Mobile App) from scratch on a fresh Windows installation.

## Phase 1: Core System Requirements

Before touching any code, install these fundamental tools on your Windows machine:

1. **[Node.js (LTS)](https://nodejs.org/):** The core runtime for the web frontend, backend server, and the mobile app framework (Expo). Installing Node.js will also install `npm`.
2. **[Python 3](https://www.python.org/downloads/):** Required by the backend for local desktop application searches. Make sure to check the box **"Add Python to PATH"** during installation.
3. **[Git](https://git-scm.com/):** To clone the project and manage versions.
4. **[MongoDB](https://www.mongodb.com/try/download/community):** Required for the backend database (if running locally). You can also use MongoDB Atlas if it's hosted in the cloud.

## Phase 2: Windows Subsystem for Linux (WSL) & AI Proxy

The backend relies on an AI proxy that runs in a Linux environment using WSL.

1. **Install WSL 2 & Ubuntu:**
   Open PowerShell as Administrator and run:
   ```bash
   wsl --install -d Ubuntu
   ```
   Restart your PC if prompted and complete the Ubuntu setup.

2. **Setup NVIDIA NIM & `uv` (Inside WSL):**
   Open your Ubuntu terminal and install the `uv` Python package installer:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
   *Note: You must also restore your `~/fcc/nvidia-nim` directory inside Ubuntu where the proxy server script lives.*

## Phase 3: Mobile Development Environment

If you plan to run or test the `nexus-app` locally:

1. **Expo Go:** Install the **Expo Go** app on your physical iOS/Android device.
2. **Optional (Emulators):** Install [Android Studio](https://developer.android.com/studio) to set up an Android Emulator if you prefer testing on your PC instead of a physical phone.

## Phase 4: Project Configuration

1. **Clone the Repository:**
   ```bash
   git clone <your-repository-url>
   cd Nexus_v2
   ```

2. **Restore Environment Variables (`.env`):**
   You need to recreate the `.env` files for all three project layers. Create these files and add your secure keys:
   
   **`backend/.env`**
   ```env
   PORT=3100
   NEXUS_API_KEY=your_secure_bearer_token
   # Add your MongoDB connection string if required by mongoose
   ```

   **`frontend/.env`**
   ```env
   VITE_NEXUS_API_KEY=your_secure_bearer_token
   ```

   **`nexus-app/.env`**
   ```env
   EXPO_PUBLIC_NEXUS_API_KEY=your_secure_bearer_token
   ```

## Phase 5: Installation & Execution

1. **Install Dependencies:**
   Open a terminal in the root `Nexus_v2` directory and install the packages for each component:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../nexus-app && npm install
   ```

2. **Run the Entire Ecosystem:**
   Navigate back to the `backend` directory (or use the root `.bat` file):
   ```bash
   cd backend
   npm run all
   ```
   *Alternatively, you can double-click `runAll.bat` in the root directory to spin everything up using concurrently.*
