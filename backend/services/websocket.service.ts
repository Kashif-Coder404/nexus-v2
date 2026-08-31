import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { generateToken, verifyToken } from "./jwt.service.js";
import { UserModel } from "../db/schema/user-schema.js";
import { commandParserType } from "../AI/Types.js";
import { CommandParserResponseType } from "../AI/Types/ParserTypes.js";
import { Types } from "mongoose";

export interface CustomWebSocket extends WebSocket {
  userId?: string;
  deviceId?: string;
  isAuthenticated?: boolean;
  pairingCode?: string;
}
// Practice Promise for ws await function!
const pendingRequests = new Map();

//Main
let wss: WebSocketServer;
function sendJson(ws: WebSocket, payload: Record<string, any>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
type JwtPayload = {
  token: {
    userId: string;
    deviceId: string;
  };
  success: boolean;
};
const connectDevice = async (
  ws: CustomWebSocket,
  token: string,
): Promise<void> => {
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
    "devices._id": decodedDeviceId,
    "devices.deviceToken": actualToken,
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
        const parsedData = JSON.parse(data);

        if (parsedData.type === "PairingInit") {
          ws.pairingCode = parsedData.code;
        } else if (parsedData.type === "cmd_response") {
          if (ws.isAuthenticated) {
            const { requestId, cmdResponse } = parsedData;
            const requestHandler = pendingRequests.get(requestId);
            if (requestHandler) {
              if (requestHandler.timer) {
                clearTimeout(requestHandler.timer);
              }
              requestHandler.resolve(cmdResponse);
              pendingRequests.delete(requestId);
            }
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

const sendCmdRequest = async (
  userId: string,
  cmd: any,
  timeoutMs: number = 30000,
): Promise<CommandParserResponseType> => {
  return new Promise((resolve, reject) => {
    if (!wss) {
      return reject(new Error("WebSocket server is not initialized"));
    }

    const requestId = crypto.randomUUID();
    const parsedCmd = typeof cmd === "string" ? JSON.parse(cmd) : cmd;
    const dataStr = JSON.stringify({
      type: "RunCMD",
      cmd: parsedCmd,
      requestId,
    });

    let clientFound = false;

    (wss.clients as Set<CustomWebSocket>).forEach((client) => {
      const isSameUser = client.userId === userId.toString();

      if (
        isSameUser &&
        client.isAuthenticated &&
        client.readyState === WebSocket.OPEN
      ) {
        client.send(dataStr);
        clientFound = true;
      }
    });

    if (!clientFound) {
      return reject(
        new Error(
          "Local backend server is not connected or authenticated. Please ensure your local backend is running and paired.",
        ),
      );
    }

    const timer = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        reject(
          new Error(
            `Command request timed out after ${timeoutMs / 1000}s without response from local backend.`,
          ),
        );
        pendingRequests.delete(requestId);
      }
    }, timeoutMs);

    pendingRequests.set(requestId, {
      resolve,
      reject,
      timer,
    });
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
      const deviceId = new Types.ObjectId().toString();

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
              _id: deviceId,
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

export { initWebsocket, sendToUser, startParingHandler, sendCmdRequest };
