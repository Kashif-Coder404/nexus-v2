import { useUserCredentials } from "@/app/store/useUserCredentials";
import useChat from "@/app/store/useChat";

const WebSocketInit = async () => {
  if (typeof window === "undefined") return;

  const token = useUserCredentials.getState().token;
  if (!token) return;

  console.log("Initialising websocket");
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL || "wss://nexus-v2-e38m.onrender.com/";
  const ws = new WebSocket(`${wsUrl}`);

  ws.onopen = () => {
    console.log("WebSocket connected");
    ws.send(JSON.stringify({ type: "auth", token }));
  };
  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === "ai_data" && payload.data?.workingon) {
        useChat.getState().setWorkingOn(payload.data.workingon);
      } else if (payload.type === "ai_done") {
        useChat.getState().setWorkingOn(null);
      }
    } catch {
      console.log("WebSocket message:", event.data);
    }
  };
  ws.onclose = () => {
    console.log("WebSocket disconnected");
    useChat.getState().setWorkingOn(null);
  };
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  return ws;
};

export default WebSocketInit;
