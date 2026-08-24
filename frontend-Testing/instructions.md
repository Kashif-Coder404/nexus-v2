# Frontend Handoff: API Key Auth & Chat.tsx Refactoring Instructions

Hi, 

As the Senior Architect on this project, I want you to refactor the web frontend codebase. The current [Chat.tsx](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/components/Chat.tsx) contains mixed responsibilities (state handling, fetch side effects, response parsing, and HTML rendering). We need to split this into clean, modular layers.

Please follow these step-by-step instructions to implement the new architecture.

---

## 🏗️ Target Architecture

We are separating our concerns into three strict layers:
1. **Service Layer (`src/services/`)**: Pure utility functions handling network requests. Zero React code.
2. **Hook Layer (`src/hooks/`)**: Stateful React logic wrapping API calls and syncing context state.
3. **View/Presentation Layer (`src/components/`)**: Pure UI rendering.

```
+------------------+     +--------------------+     +-------------------+
|  chatService.ts  | --> |     useChat.ts     | --> |     Chat.tsx      |
|  (Fetch Network) |     | (React Hook/State) |     |  (Pure View UI)   |
+------------------+     +--------------------+     +-------------------+
```

---

## 📋 Developer Action Items

### Task 1: Create the Environment File
Create a new file at [frontend/.env](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/.env) and define the authentication key:

```env
VITE_NEXUS_API_KEY=MyCurrentAPI
```
*Note: Vite requires the `VITE_` prefix to automatically bundle environment variables into client-side JS.*

---

### Task 2: Implement the API Service Layer
Create a new folder `src/services/` and add a new file [frontend/src/services/chatService.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/services/chatService.ts).

**Implementation Details**:
* Encapsulate the raw `fetch` call to `/api/chat/message`.
* Extract the API key from Vite environment using `import.meta.env.VITE_NEXUS_API_KEY`.
* Append the key as an `Authorization` header: `Authorization: Bearer <KEY>`.

**Code Template**:
```typescript
const API_URL = "http://localhost:3100/api/chat";

export async function sendChatMessage(message: string, session: string) {
  const apiKey = import.meta.env.VITE_NEXUS_API_KEY || "";

  const res = await fetch(`${API_URL}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ message, session }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
  }

  return res.json();
}
```

---

### Task 3: Implement the Custom React Hook
Create a new folder `src/hooks/` and add a new file [frontend/src/hooks/useChat.ts](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/hooks/useChat.ts).

**Implementation Details**:
* Import `useAppContext` to gain access to history, sessions, and loading flags.
* Add an `isSending` state to lock UI inputs while the fetch executes.
* Invoke `sendChatMessage` from your service layer.
* Parse the new standardized backend format: `{ success: boolean, message: string, data: { lastAIMsg, lastCMD, terminal, terminalError } }`. Make sure you map this backend structure to your local frontend `chatHistory` state schema.

**Code Template**:
```typescript
import { useState } from "react";
import { useAppContext } from "../context/provider";
import { sendChatMessage } from "../services/chatService";

export function useChat() {
  const { isLoading, chatHistory, setChatHistory, msg, setMsg, session } = useAppContext();
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (!msg) return;
    setIsSending(true);

    // 1. Add user message locally
    setChatHistory((prev: any) => [
      ...prev,
      { id: Date.now(), role: "user", content: msg },
    ]);

    try {
      // 2. Fetch via service
      const response = await sendChatMessage(msg, session);

      // 3. Handle standardized response
      if (response.success) {
        setChatHistory((prev: any) => [
          ...prev,
          {
            role: "nexus",
            content: {
              msg: response.data.lastAIMsg,
              cmd: response.data.lastCMD || "",
              terminal: response.data.terminal || "",
              terminalError: response.data.terminalError || "",
            },
          },
        ]);
      } else {
        setChatHistory((prev: any) => [
          ...prev,
          {
            role: "nexus",
            content: {
              msg: response.message || "Failed to get reply",
              cmd: "",
              terminal: "",
              terminalError: response.message || "",
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error during message dispatch:", error);
      setChatHistory((prev: any) => [
        ...prev,
        {
          role: "nexus",
          content: {
            msg: error.message || "Server is not responding",
            cmd: "",
            terminal: "",
            terminalError: "",
          },
        },
      ]);
    } finally {
      // 4. Reset controls
      setMsg("");
      setIsSending(false);
    }
  };

  return {
    isLoading,
    chatHistory,
    msg,
    setMsg,
    isSending,
    sendMessage,
  };
}
```

---

### Task 4: Secure and Standardize the Health Check
Update [frontend/src/context/provider.tsx](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/context/provider.tsx) to supply authentication headers for health checking and parse the new success object.

**Steps**:
* Modify `handleHealthCheck()` to extract `VITE_NEXUS_API_KEY` from Vite env.
* Add header `Authorization: Bearer <apiKey>` to the health check fetch.
* Check if `res.status === 200 && data.success` is true, then extract the initial AI message from `data.data.lastAIMsg` and lowercase the role name to `"nexus"` so it registers correctly.

**Target Code Snippet**:
```typescript
    async function handleHealthCheck() {
      try {
        const apiKey = import.meta.env.VITE_NEXUS_API_KEY || "";
        const res: any = await fetch("http://localhost:3100/api/health", {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });
        const data = await res.json();
        console.log("First Message", data);
        
        if (res.status === 200 && data.success) {
          setChatHistory([
            {
              id: Date.now(),
              role: "nexus",
              content: {
                msg: data.data.lastAIMsg,
                cmd: data.data.lastCMD || "",
                terminal: data.data.terminal || "",
                terminalError: data.data.terminalError || "",
              },
            },
          ]);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        throw new Error(data.message || "Server is not responding");
      } catch (error: any) {
        // ... Keep existing catch block ...
```

---

### Task 5: Clean Up `Chat.tsx`
Rewrite [frontend/src/components/Chat.tsx](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/frontend/src/components/Chat.tsx) to remove React state/fetch boilerplate and directly consume `useChat`.

**Target Code**:
```tsx
import { useChat } from "../hooks/useChat";
import AIBOX from "./AIBox";
import UserBox from "./UserBox";

const Chat = () => {
  const { isLoading, chatHistory, msg, setMsg, isSending, sendMessage } = useChat();

  return (
    <div className="ChatCont">
      <h1>Chat</h1>
      <div className="chat">
        {chatHistory.map((msg: any, index: number) => {
          const key = msg.id || `msg-${index}`;
          if (msg.role === "user") {
            return <UserBox key={key} message={msg.content} />;
          }
          if (msg.role === "nexus") {
            return (
              <AIBOX
                key={key}
                message={msg.content.msg || msg.content.aiMsg}
                cmd={msg.content.cmd}
                terminal={msg.content.terminal}
                terminalError={msg.content.terminalError}
              />
            );
          }
          return null;
        })}
        {isLoading && chatHistory.length === 0 && (
          <div className="loading">Connecting to server...</div>
        )}
        {isSending && <div className="loading">Nexus is typing...</div>}
      </div>
      <div className="input">
        <input
          type="text"
          className="input-text"
          placeholder={isSending ? "Sending..." : "Message..."}
          value={msg}
          onKeyDown={(e: any) => e.key === "Enter" && sendMessage()}
          onChange={(e: any) => setMsg(e.target.value)}
          disabled={isLoading || isSending}
        />
        <button
          className="send"
          onClick={sendMessage}
          disabled={isLoading || isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
```

---

## 🧪 Verification Tasks
Once done, execute this command inside the `frontend/` directory to ensure compilation builds perfectly:
```bash
npm run build
```

Let me know once you finish implementing these layers or if you run into any compilation issues!
