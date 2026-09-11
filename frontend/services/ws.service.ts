import { useUserCredentials } from "@/app/store/useUserCredentials";
import useChat from "@/app/store/useChat";
import { useDevices } from "@/app/store/useDevices";
let activeSocket: WebSocket | null = null;
const WebSocketInit = async () => {
  if (typeof window === "undefined") return;

  const token = useUserCredentials.getState().token;
  if (!token) return;

  console.log("Initialising websocket");
  const wsUrl =
    process.env.NEXT_PUBLIC_WS_URL || "wss://nexus-v2-e38m.onrender.com/";
  const ws = new WebSocket(`${wsUrl}`);

  ws.onopen = () => {
    activeSocket = ws;
    console.log("WebSocket connected");
    ws.send(JSON.stringify({ type: "auth", token }));
  };
  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);

      if (payload.type === "device_list") {
        useDevices.getState().setDevices(payload.devices);
      } else if (payload.type === "device_status") {
        const deviceId = payload.device?.id || payload.deviceId;
        if (deviceId) {
          if (payload.online !== undefined) {
            useDevices.getState().setOnlineDevices(deviceId, payload.online);
          }
          if (payload.service !== undefined) {
            useDevices.getState().setService(deviceId, payload.service);
          }
        }
      } else if (payload.type === "device_removed") {
        useDevices
          .getState()
          .setDevices(
            useDevices
              .getState()
              .devices.filter((d) => d.id !== payload.deviceId),
          );
      } else if (payload.type === "ai_data" && payload.data?.workingon) {
        useChat.getState().setWorkingOn(payload.data.workingon);
      } else if (payload.type === "ai_done") {
        useChat.getState().setWorkingOn(null);
      }
    } catch (err) {
      console.log(err);
    }
  };
  ws.onclose = () => {
    useChat.getState().setWorkingOn(null);
  };
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  return ws;
};
export const requestDevices = () => {
  if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify({ type: "get_devices" }));
  } else {
    console.warn("WebSocket not connected");
  }
};
export default WebSocketInit;
