# 🖥️ Nexus Web Frontend

A responsive, high-performance web dashboard built to monitor and interact with the Nexus AI console in real time. It offers developers a full-featured visual log of active agent processes, terminal executions, and conversational command controls.

---

## ⚡ Key Features

- **💬 Real-Time Console Interface**: Custom UI panels displaying messages, executing commands, and formatted shell inputs/outputs.
- **🔌 WebSocket Live Sync**: Establishes a persistent client-side WebSocket connection directly to the server to stream agent state changes (e.g. tracking what task the AI is currently working on).
- **🛡️ Secure Communication**: Integrated security headers including authorization headers (`Bearer token`) mapped to your active Nexus workspace settings.
- **📊 Comprehensive Output Diagnostics**:
  - Displays user prompts (`UserBox`).
  - Renders agent actions (`AIBox`), broken down into conversational feedback, exact shell commands run, terminal output (`stdout`), and detailed execution logs (`stderr`).

---

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Linter**: Oxlint (ultra-fast linter configuration)
- **Styling**: Pure CSS for custom layouts

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AIBox.tsx      # Renders detailed AI outputs, commands, and terminals
│   │   ├── Chat.tsx       # Manages web socket hooks, messages, and state bindings
│   │   └── UserBox.tsx    # Renders the user messages
│   ├── context/
│   │   └── provider.tsx   # React global application state provider
│   ├── App.tsx            # Main component root
│   ├── main.tsx           # Application entry point
│   ├── App.css            # Component-level layout styles
│   └── index.css          # Core design tokens and global styles
├── index.html             # HTML Shell
└── vite.config.ts         # Vite build configuration
```

---

## ⚙️ Configuration (`.env`)

Configure the environment file `frontend/.env` to point to your backend:

```env
VITE_NEXUS_API_KEY=your_secure_bearer_token
```

*Note: The frontend chat connects to the backend API at `http://localhost:3100` and receives WebSocket frames on `ws://192.168.31.116:3100` by default (update the connection URL in [Chat.tsx](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/components/Chat.tsx) if your network setup differs).*

---

## 🏃 Run Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs the Vite development server locally. |
| `npm run build` | Compiles and builds the production-ready static bundle (`dist/`). |
| `npm run lint` | Runs the Oxlint static analysis linter. |
| `npm run preview` | Previews the production build locally. |
