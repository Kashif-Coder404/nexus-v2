# Nexus v2: Self-Build TypeScript Roadmap

This checklist tracks your progress as you build the Nexus AI Assistant with a self-improving skill registry.

---

## 🏗️ 1. Project Initialization & Infrastructure
- [x] **Initialize Node Project:** Run `npm init -y` inside a new `backend` directory.
- [x] **Install Core Dependencies:** 
  - Production: `express`, `ws`, `dotenv`, `axios`
  - Development: `typescript`, `@types/node`, `@types/express`, `@types/ws`, `tsx`, `nodemon`
- [x] **Configure TypeScript:** Create and set up a strict `tsconfig.json` for NodeNext modules.

---

## ⚙️ 2. Backend Core Services & Routing Foundation
- [ ] **Refactor Routing & Controllers:** Separate raw routes in `server.ts` from the chat loop controller logic.
- [ ] **Integrate WebSocket Live Streaming:**
  - Create a WebSocket broadcaster helper.
  - Pass the WebSocket client socket / broadcaster to the `AskAI` loop.
  - Stream logs over WebSockets for each step: `ai_thinking` (AI is choosing a command), `cmd_output` (stdout/stderr of the shell), and `system_status` (what state the loop is in).
- [ ] **Implement `skill.service.ts` (The Registry):**
  - Read/write custom scripts to a new `backend/skills/` directory.
  - Read/write metadata registry to `skills.json` (tracking skill names, descriptions, and file paths).
- [ ] **Integrate Skill Installation in the `AskAI` Execution Loop:**
  - Check if the AI wants to install a new skill (`parsed.installSkill`) before running commands.
  - Save the script using `skill.service.ts`.
  - Feed back registration results to the AI in the loop, allowing immediate execution in the next turn.

---

## 🧠 3. Self-Improving Skills (Level 4 Agent)
- [ ] **System Prompt Setup:** Inject the registry list from `skills.json` into the LLM prompt context at start. Guide the AI on how to request a new skill when a capability is missing.
- [ ] **PowerShell COM Object Utilities:** Teach the AI to generate native commands using `WScript.Shell` for media key actions (mute, play/pause, volume control).
- [ ] **Register Initial Skills:** Populate `skills.json` with a few default tools (e.g., directory list, disk check).

---

## 🎨 4. Premium Frontend UI (HTML/CSS/JS)
- [ ] **Modern Layout:** Setup an `index.html` featuring a sidebar for registered skills, a central chat viewport, and a bottom terminal logs drawer.
- [ ] **Glassmorphic Theme:** Design a dark-mode CSS with clean gradients, floating glass panels, custom scrollbars, and typing animations.
- [ ] **WS Integrations:** Connect the frontend to the backend's WebSocket to render live execution feeds and dynamically refresh the sidebar's skill list.
