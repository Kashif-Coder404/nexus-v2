import { WebSocket } from "ws";
import fs from "fs/promises";
import path from "path";
import { runCommand } from "../controllers/cmd.controller";

const DEVICE_TOKEN_PATH = path.join(__dirname, "../deviceToken.json");

let activeWS: WebSocket | null = null;
export let isConnectedToBackend = false;

export interface DeviceTokenData {
  token: string;
}

interface InMemoryPairingState {
  code: string;
  expiresat: string;
}
export let paringMessage: string = "";
// In-memory temporary pairing code state
let currentPairingState: InMemoryPairingState | null = null;

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
    } catch (error) {
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

  // Reuse existing in-memory code if not expired
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

  // Generate a new temporary in-memory pairing code
  const code = generateRandomCode();
  const expiresat = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  currentPairingState = { code, expiresat };

  if (activeWS && activeWS.readyState === WebSocket.OPEN) {
    activeWS.send(JSON.stringify({ type: "PairingInit", code }));
    console.log(`[WS] Initialized with in-memory Pairing Code: ${code}`);
  }

  return {
    code,
    expiresat,
    remainingSeconds: 300,
    isPaired: false,
    isConnected: true,
  };
};

// Alias for compatibility
export const getOrGeneratePairingCode = generatePairingCode;

export const forceNewPairingCode = async () => {
  if (!isConnectedToBackend) {
    throw new Error("Cannot generate pairing code: Cloud Backend is offline.");
  }

  const code = generateRandomCode();
  const expiresat = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  currentPairingState = { code, expiresat };

  if (activeWS && activeWS.readyState === WebSocket.OPEN) {
    activeWS.send(JSON.stringify({ type: "PairingInit", code }));
    console.log(
      `[WS] Sent refreshed in-memory pairing code to Cloud Backend: ${code}`,
    );
  }

  return {
    code,
    expiresat,
    remainingSeconds: 300,
  };
};

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
        console.log(`[WS] Sent Pairing Code to Cloud Backend: ${code}`);
        ws.send(JSON.stringify({ type: "PairingInit", code }));
      }
    }
  });

  ws.on("message", async (data: any) => {
    try {
      const parsed = JSON.parse(data.toString());
      console.log("[WS] Received message:", parsed.type);

      if (parsed.type === "PairingSuccess") {
        paringMessage = "";
        console.log("🎉 [WS] Pairing confirmed by Cloud Backend!");
        const token = parsed.token || parsed.deviceToken;
        if (token) {
          await saveDeviceTokenFile({ token });
        }
        currentPairingState = null;
      } else if (parsed.type === "PairingFailed") {
        console.log("⛔ Device Verification failed from cloud backend!");
        await saveDeviceTokenFile({ token: "" });
        paringMessage = "Device Verification failed from cloud backend!";
        await generatePairingCode();
      } else if (parsed.type === "RunCMD") {
        const cmd =
          typeof parsed.cmd === "string" ? JSON.parse(parsed.cmd) : parsed.cmd;
        const cmdResponse = await runCommand(
          cmd.action,
          cmd.param,
          cmd.timeout,
        );
        ws.send(JSON.stringify({ type: "cmd_response", cmdResponse }));
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
