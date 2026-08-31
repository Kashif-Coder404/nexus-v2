import { WebSocket } from "ws";
import fs from "fs/promises";
import path from "path";
import { runCommand } from "../controllers/cmd.controller.js";

const DEVICE_TOKEN_PATH = path.join(__dirname, "../deviceToken.json");

let activeWS: WebSocket | null = null;
export let isConnectedToBackend = false;
export let pairingMessage: string = "";

export interface DeviceTokenData {
  token: string;
}

interface InMemoryPairingState {
  code: string;
  expiresat: string;
}

// In-memory temporary pairing code state
let currentPairingState: InMemoryPairingState | null = null;

// Helper to safely send JSON over WebSocket
function sendJson(ws: WebSocket | null, payload: Record<string, any>) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

// Generate random 6-character code (e.g. NX-7824)
export const generateRandomCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "NX-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Read persisted device token
export const readDeviceTokenFile =
  async (): Promise<DeviceTokenData | null> => {
    try {
      const data = await fs.readFile(DEVICE_TOKEN_PATH, "utf-8");
      if (!data.trim()) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

// Save device token upon successful pairing
export const saveDeviceTokenFile = async (
  data: DeviceTokenData,
): Promise<void> => {
  await fs.writeFile(DEVICE_TOKEN_PATH, JSON.stringify(data, null, 2), "utf-8");
};

// Generate and manage temporary in-memory pairing code
export const generatePairingCode = async (): Promise<{
  code: string | null;
  expiresat: string | null;
  remainingSeconds: number;
  isPaired: boolean;
  isConnected: boolean;
  message?: string;
}> => {
  const deviceData = await readDeviceTokenFile();

  if (deviceData?.token) {
    return {
      code: null,
      expiresat: null,
      remainingSeconds: 0,
      isPaired: true,
      isConnected: isConnectedToBackend,
    };
  }

  if (!isConnectedToBackend) {
    return {
      code: null,
      expiresat: null,
      remainingSeconds: 0,
      isPaired: false,
      isConnected: false,
      message:
        "Cloud Backend (ws://localhost:3100) is currently offline or unreachable.",
    };
  }

  // Reuse existing in-memory code if still valid
  if (currentPairingState) {
    const timeLeft =
      new Date(currentPairingState.expiresat).getTime() - Date.now();
    if (timeLeft > 0) {
      return {
        code: currentPairingState.code,
        expiresat: currentPairingState.expiresat,
        remainingSeconds: Math.floor(timeLeft / 1000),
        isPaired: false,
        isConnected: true,
      };
    }
  }

  // Generate a fresh temporary code (5-minute TTL)
  const code = generateRandomCode();
  const expiresat = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  currentPairingState = { code, expiresat };

  sendJson(activeWS, { type: "PairingInit", code });
  console.log(`[WS] Initialized with Pairing Code: ${code}`);

  return {
    code,
    expiresat,
    remainingSeconds: 300,
    isPaired: false,
    isConnected: true,
  };
};

// Force generate a new pairing code immediately
export const forceNewPairingCode = async () => {
  if (!isConnectedToBackend) {
    throw new Error("Cannot generate pairing code: Cloud Backend is offline.");
  }

  const code = generateRandomCode();
  const expiresat = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  currentPairingState = { code, expiresat };

  sendJson(activeWS, { type: "PairingInit", code });
  console.log(`[WS] Refreshed pairing code: ${code}`);

  return {
    code,
    expiresat,
    remainingSeconds: 300,
  };
};

// WebSocket Connection to Cloud Backend
const ServerWSConnection = async () => {
  console.log("[WS] Connecting to Cloud Backend at ws://localhost:3100...");
  const deviceData = await readDeviceTokenFile();
  const headers: Record<string, string> = {};

  if (deviceData?.token) {
    headers.Authorization = `Bearer ${deviceData.token}`;
  }

  const ws = new WebSocket(`ws://localhost:3100`, { headers });
  activeWS = ws;

  ws.on("open", async () => {
    isConnectedToBackend = true;
    console.log("[WS] Connected to Cloud Backend!");

    if (!deviceData?.token) {
      const { code } = await generatePairingCode();
      if (code) {
        sendJson(ws, { type: "PairingInit", code });
      }
    }
  });

  ws.on("message", async (data: any) => {
    try {
      const parsed = JSON.parse(data.toString());
      console.log("[WS] Received message:", parsed.type);

      switch (parsed.type) {
        case "PairingSuccess": {
          pairingMessage = "";
          console.log("🎉 [WS] Pairing confirmed by Cloud Backend!");
          const token = parsed.token || parsed.deviceToken;
          if (token) {
            await saveDeviceTokenFile({ token });
          }
          currentPairingState = null;
          break;
        }

        case "PairingFailed": {
          console.log("⛔ [WS] Device verification failed from cloud backend!");
          await saveDeviceTokenFile({ token: "" });
          pairingMessage =
            parsed.message || "Device verification failed from cloud backend!";
          await generatePairingCode();
          break;
        }

        case "RunCMD": {
          const { requestId, cmd } = parsed;
          const parsedCmd = typeof cmd === "string" ? JSON.parse(cmd) : cmd;

          const cmdResponse = await runCommand(
            parsedCmd.action,
            parsedCmd.param,
            parsedCmd.timeout,
          );

          sendJson(ws, {
            type: "cmd_response",
            requestId,
            cmdResponse,
          });
          break;
        }

        default:
          console.log("[WS] Unhandled message type:", parsed.type);
      }
    } catch (err: any) {
      console.error("[WS] Error parsing message:", err.message);
    }
  });

  ws.on("close", () => {
    isConnectedToBackend = false;
    activeWS = null;
    const retryIn = 5000;
    console.log(
      `[WS] Disconnected from Cloud Backend. Reconnecting in ${retryIn / 1000}s...`,
    );
    setTimeout(ServerWSConnection, retryIn);
  });

  ws.on("error", (error) => {
    console.error("[WS] Connection error:", error.message);
  });
};

export default ServerWSConnection;
