# Nexus v3: Next Phase Roadmap

This checklist tracks your upcoming tasks for the next phase of development for the Nexus AI Assistant (now powered by a React Native mobile frontend).

---

## 🔌 1. Real-Time WebSocket Integration
- [ ] **Backend WebSockets:** Implement live streaming in `AskAI.ts` so every time the AI runs a command, the stdout/stderr and current thought process are broadcasted to connected clients immediately.
- [ ] **React Native WebSocket Client:** Upgrade the frontend `fetch` request to a live WebSocket connection (`ws://192.168.x.x:3100`).
- [ ] **Terminal Drawer UI:** Add a visual "Terminal" or "Debug" panel in the mobile app that shows the live, scrolling shell commands and outputs as the AI executes them in real-time.

---

## 🧠 2. Self-Improving Skills (Level 4 Agent)
- [ ] **Skill Registry Setup:** Create a `skills.json` registry on the backend and a dedicated `backend/skills/` directory.
- [ ] **Prompt Engineering:** Inject the list of available skills into the AI prompt so it knows what custom tools it has.
- [ ] **Skill Installation Logic:** Teach the AI a new shorthand command (e.g., `install_skill`) that takes raw PowerShell or Node.js code, writes it to a file, and registers it to `skills.json` dynamically so it can use it in future turns.

---

## 🎨 3. Premium Frontend UI Polish (React Native / Expo)
- [ ] **Markdown Support:** Integrate a Markdown renderer (like `react-native-markdown-display`) so AI responses with lists and bold text are beautifully formatted.
- [ ] **Animations & Feedback:** Add smooth typing indicators, Lottie animations, and haptic feedback when commands are executed successfully or fail.
- [ ] **Persistent Chat History:** Use `AsyncStorage` or `expo-sqlite` to save chat sessions locally on the phone so the history remains after app restarts.

---

## 🔒 4. Production & Security
- [ ] **Secure Storage for API Keys:** Move API keys (like the proxy/Nvidia key) into a `.env` file instead of hardcoding them in `AICall.ts`.
- [ ] **Error Boundaries:** Implement robust error boundaries in React Native to prevent the app from crashing on unhandled network errors.
- [ ] **Release Automation:** Automate the build process using Expo EAS (Expo Application Services) for easier distribution.
