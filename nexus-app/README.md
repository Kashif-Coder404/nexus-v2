# 📱 Nexus Console Mobile App

A high-performance, premium-designed mobile console application built with React Native and Expo. It provides a sleek terminal dashboard allowing you to monitor and control your desktop services remotely, complete with secure authentication boundaries.

---

## ⚡ Key Features

- **🌌 Modern Dark Theme UI**: Built with a custom sci-fi space theme (`#0B0F19` deep space background with blue `#2563EB` and light-blue `#38BDF8` visual accents) for an immersive console experience.
- **🔐 Biometric Access Control**:
  - Automatically intercept and protect high-risk requests (e.g. commands containing `"shutdown"` or `"turn off"`).
  - Uses `expo-local-authentication` to trigger biometric confirmation (fingerprint, face unlock, or passcode) before dispatching requests to the system.
- **⚡ Live Status Streaming**:
  - Automatically maintains a WebSocket link to track server worker actions (`ai_data` for currently executing operations, and `ai_done` once finalized).
  - Displays dynamic text updates (e.g. `"Running command..."`, `"Searching..."`) with loading animations.
- **📦 Global Context State Layer**: Manages messages, session tokens, WebSocket status, and asynchronous request states using a clean React `useReducer` action system (`chatReducer.ts`).
- **🛠️ Remote Command Console**: Displays distinct speech/code blocks for user prompts (`UserBox`) and structured agent execution panels (`AiBox` rendering text explanations, shell commands, and detailed stdout/stderr responses).

---

## 📂 Project Structure

```
nexus-app/
├── src/
│   ├── app/
│   │   ├── _layout.tsx      # Main layout wrapper
│   │   └── index.tsx        # App entry view wiring ChatBox and ChatInput
│   ├── components/
│   │   ├── AiBox.tsx        # Standard output block for AI replies & commands
│   │   ├── BiometricDemo.tsx# Biometric status indicator/demo
│   │   ├── ChatBox.tsx      # WebSocket receiver and chat log scroller
│   │   ├── ChatInput.tsx    # Styled Text Input with platform-specific keyboards
│   │   └── UserBox.tsx      # Standard user message bubble
│   ├── context/
│   │   └── provider.tsx     # Application global state provider & biometric intercepts
│   ├── hooks/
│   │   ├── chatReducer.ts   # State reducer for message logs
│   │   ├── useAuth.ts       # Wrapper for expo-local-authentication hooks
│   │   └── useChatAPI.ts    # Fetch service with authorization tokens
│   ├── types/
│   │   └── chat.ts          # Core type definitions
│   └── global.css           # Global stylesheet tokens
├── services/
│   └── websocket.service.ts # Configured WebSocket client connection manager
├── app.json                 # Expo configuration
├── package.json             # NPM package scripts & configuration dependencies
└── tsconfig.json            # TypeScript configuration compiler rules
```

---

## ⚙️ Configuration Setup (`.env`)

Add a `.env` file to your mobile root directory:

```env
EXPO_PUBLIC_NEXUS_API_KEY=your_secure_bearer_token
```

*Note: The app targets the server endpoints at `http://192.168.31.116:3100` and `ws://192.168.31.116:3100` by default. Update the server host IP in [useChatAPI.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/nexus-app/src/hooks/useChatAPI.ts) and [websocket.service.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/nexus-app/services/websocket.service.ts) to match your desktop's network local IP.*

---

## 🏃 Run Commands

Inside the `nexus-app/` directory:

| Command | Action |
| :--- | :--- |
| `npm run start` | Launches the Expo development server. |
| `npm run android` | Runs/builds the application on a connected Android Emulator or device. |
| `npm run ios` | Runs/builds the application on an iOS Simulator or device. |
| `npm run web` | Launches a web preview inside a browser tab. |
| `npm run lint` | Runs the Expo project ESLint analysis checks. |
