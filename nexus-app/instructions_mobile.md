# Mobile App (nexus-app) API Key & Response Standardization Instructions

Hi,

As the Senior Architect on this project, I want you to update the Expo Mobile app ([nexus-app](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/nexus-app)) to match the new backend security and response data structure.

Please follow these step-by-step instructions.

---

## 📋 Developer Action Items

### Task 1: Configure Mobile Environment File
Create a new file at [nexus-app/.env](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/nexus-app/.env) and set the matching API Key:

```env
EXPO_PUBLIC_NEXUS_API_KEY=MyCurrentAPI
```
*Note: Expo requires environment variables to be prefixed with `EXPO_PUBLIC_` in order to expose them to your client-side React Native JS bundle.*

---

### Task 2: Update Fetch Call & Response Parsing in `index.tsx`
Open [nexus-app/src/app/index.tsx](file:///d:/Coding/PROJECTS/NExt/Nexus_v2/nexus-app/src/app/index.tsx).

**Implementation Details**:
* Read the API key from environment: `process.env.EXPO_PUBLIC_NEXUS_API_KEY`.
* Append the `Authorization: Bearer <key>` header to the `/api/chat/message` fetch request.
* Update the response parsing code to read from `data.data` when `data.success` is true, or handle error messages if `data.success` is false.

**Replacement Code Snippet** (Replace lines 43 to 92 in your original file):

```typescript
    try {
      const apiKey = process.env.EXPO_PUBLIC_NEXUS_API_KEY || "";
      const response = await fetch(
        "http://192.168.31.116:3100/api/chat/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}` // <-- Added API Key
          },
          body: JSON.stringify({
            message: message,
            session: session,
          }),
        },
      );

      const data: any = await response.json(); // Parses the response from the server

      // Update the specific message to sent
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === newMsgId ? { ...msg, status: "sent" } : msg,
        ),
      );

      console.log("Data from the server: ", data);
      
      // Parse standardized backend response layout
      if (data && data.success) {
        const payload = data.data;
        let finalText = payload.lastAIMsg || "";
        if (payload.lastCMD) {
          finalText += (finalText ? "\n\n" : "") + "> " + payload.lastCMD;
        }
        if (payload.terminal) {
          finalText += (finalText ? "\n\n" : "") + payload.terminal;
        }
        if (payload.terminalError) {
          finalText += (finalText ? "\n\n" : "") + "Error:\n" + payload.terminalError;
        }
        if (!finalText) {
          finalText = "No message received";
        }

        setChatHistory((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "AI",
            text: finalText,
            status: "sent",
          },
        ]);
      } else {
        // Handle error responses from backend
        setChatHistory((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "AI",
            text: data.message || "Failed to process message.",
            status: "sent",
          },
        ]);
      }
```

---

## 🧪 Verification Tasks

1. Ensure the backend server is running.
2. Build/start your Expo app:
   ```bash
   npm run start
   ```
3. Send a message from your mobile app and verify:
   * The message is successfully authenticated by the backend.
   * The response is correctly parsed and rendered in the mobile chat history.
