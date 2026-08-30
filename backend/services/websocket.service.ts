import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { generateToken, verifyToken } from "./jwt.service.js";
import { UserModel } from "../db/schema/user-schema.js";

export interface CustomWebSocket extends WebSocket {
  userId?: string;
  deviceId?: string;
  isAuthenticated?: boolean;
  pairingCode?: string;
}

let wss: WebSocketServer;

const sendJson = (ws: WebSocket, payload: Record<string, any>) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};
type deviceTokenType = {
  token: {
    userId: string;
    deviceId: string;
  };
};
type JwtPayload = {
  token: {
    userId: string;
    deviceId: string;
  };
  success: boolean;
};
const connectDevice = async (ws: CustomWebSocket, token: string): Promise<void> => {
  const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
  const decodedToken = verifyToken(actualToken) as JwtPayload;
  const decodedUserId = decodedToken.token?.userId as string;
  const decodedDeviceId = decodedToken.token?.deviceId as string;

  if (!decodedToken.success || !decodedUserId || !decodedDeviceId) {
    sendJson(ws, {
      type: "PairingFailed",
      message: "Invalid token or Expired",
      data: null,
    });
    return;
  }

  const user = await UserModel.findOne({
    _id: decodedUserId,
    "devices.deviceId": decodedDeviceId,
  });

  if (!user) {
    sendJson(ws, {
      type: "PairingFailed",
      message: "Device has been revoked.",
      data: null,
    });
    return;
  }

  ws.isAuthenticated = true;
  ws.userId = decodedUserId;
  ws.deviceId = decodedDeviceId;
  console.log(
    `[WS] Authenticated device ${decodedDeviceId} for user ${decodedUserId}`,
  );
};

const initWebsocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: CustomWebSocket, req: any) => {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader) {
      await connectDevice(ws, authHeader);
    }

    ws.on("message", (event: any) => {
      try {
        const data = event.toString();
        console.log("[WS] Received message:", data);
        const parsedData = JSON.parse(data);

        if (parsedData.type === "PairingInit") {
          ws.pairingCode = parsedData.code;
        } else if (
          parsedData.type === "cmd_response" ||
          parsedData.type === "CMDResponse"
        ) {
          if (ws.isAuthenticated) {
            console.log("[WS] CMD Response:", parsedData.cmdResponse);
          }
        }
      } catch (err: any) {
        console.error("[WS] Message parsing error:", err.message);
      }
    });

    ws.on("close", () => {
      console.log(
        `[WS] Client disconnected (user: ${ws.userId || "unauthenticated"})`,
      );
    });
  });
};

const sendToUser = (userId: string, data: any, deviceId?: string) => {
  if (!wss) return;
  const dataStr = typeof data === "string" ? data : JSON.stringify(data);

  (wss.clients as Set<CustomWebSocket>).forEach((client) => {
    const isSameUser = client.userId === userId.toString();
    const isSameDevice = !deviceId || client.deviceId === deviceId;

    if (
      isSameUser &&
      isSameDevice &&
      client.isAuthenticated &&
      client.readyState === WebSocket.OPEN
    ) {
      client.send(dataStr);
    }
  });
};

const startParingHandler = async (req: any, res: any) => {
  if (!wss) {
    return res.status(500).json({
      success: false,
      message: "WebSocket server not initialized",
      data: null,
    });
  }

  const { paringcode } = req.body;
  const userId: string = req.userId;

  if (!paringcode) {
    return res.status(400).json({
      success: false,
      message: "Pairing code is required",
      data: null,
    });
  }

  for (const client of wss.clients as Set<CustomWebSocket>) {
    if (
      client.pairingCode === paringcode &&
      client.readyState === WebSocket.OPEN
    ) {
      const deviceId = crypto.randomUUID();
      const deviceToken = generateToken(
        {
          userId: userId,
          deviceId: deviceId,
        },
        "30d",
      );

      if (!deviceToken) {
        sendJson(client, {
          type: "PairingFailed",
          message: "Failed to generate device token",
          data: null,
        });
        return res.status(500).json({
          success: false,
          message: "Device Token generation failed",
          data: null,
        });
      }

      client.deviceId = deviceId;
      client.isAuthenticated = true;
      client.userId = userId;

      sendJson(client, {
        type: "PairingSuccess",
        token: deviceToken,
        userId: userId,
        deviceId: deviceId,
      });

      await UserModel.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            devices: {
              deviceId: deviceId,
              deviceToken: deviceToken,
              deviceName: "Nexus Local Device",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      );

      return res.status(200).json({
        success: true,
        message: "Pairing successful",
        data: { deviceId },
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: "Pairing Failed! Please enter a valid pairing code.",
    data: null,
  });
};

export { initWebsocket, sendToUser, startParingHandler };
