# Nexus v2: Self-Build TypeScript Roadmap

This checklist tracks your progress as you build the Nexus AI Assistant with a self-improving skill registry.

---

## 🏗️ 1. Project Initialization & Infrastructure
- [ ] **Initialize Node Project:** Run `npm init -y` inside a new `backend` directory.
- [ ] **Install Core Dependencies:** 
  - Production: `express`, `ws`, `dotenv`, `axios`
  - Development: `typescript`, `@types/node`, `@types/express`, `@types/ws`, `tsx`, `nodemon`
- [ ] **Configure TypeScript:** Create and set up a strict `tsconfig.json` for NodeNext modules.

---

## ⚙️ 2. Backend Core Services (TypeScript)
- [ ] **Setup `server.ts`:** Express server mounted with a WebSocket server (`ws`) for streaming terminal states.
- [ ] **Implement `ai.service.ts`:** Call the LLM (Groq/Gemini) with structured JSON schema outputs (`{ "cmd": "...", "msg": "...", "installSkill": { ... } }`).
- [ ] **Implement `skill.service.ts` (The Registry):**
  - Read/write to `/skills` folder and a `skills.json` registry file.
  - Run powershell code natively using Node's `child_process`.
- [ ] **Implement `chat.controller.ts` (The Loop):**
  - Implement a multi-step execution loop (up to 6 times).
  - Check if the AI wants to install a new skill, save it, and continue executing.
  - Stream logs over WebSockets for each step (`ai_thinking`, `cmd_output`, `system_status`).

---

## 🧠 3. Self-Improving Skills (Level 4 Agent)
- [ ] **System Prompt Setup:** Guide the AI on how to query installed skills and request a new one when a capability is missing.
- [ ] **PowerShell COM Object Utilities:** Teach the AI to generate native commands using `WScript.Shell` for media key actions (mute, play/pause, volume control).
- [ ] **Register Initial Skills:** Populate `skills.json` with a few default tools (e.g., directory list, disk check).

---

## 🎨 4. Premium Frontend UI (HTML/CSS/JS)
- [ ] **Modern Layout:** Setup an `index.html` featuring a sidebar for registered skills, a central chat viewport, and a bottom terminal logs drawer.
- [ ] **Glassmorphic Theme:** Design a dark-mode CSS with clean gradients, floating glass panels, custom scrollbars, and typing animations.
- [ ] **WS Integrations:** Connect the frontend to the backend's WebSocket to render live execution feeds and dynamically refresh the sidebar's skill list.
