import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { generateToken, verifyToken } from "./jwt.service.js";
import { UserModel } from "../db/schema/user-schema.js";
import { commandParserType } from "../AI/Types.js";
import { CommandParserResponseType } from "../AI/Types/ParserTypes.js";
import { Types } from "mongoose";

export interface CustomWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  deviceId?: string;
  deviceName?: string;
  isAuthenticated?: boolean;
  pairingCode?: string;
  service?: boolean;
  ipAddress?: string;
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
  ipaddress: string,
  service?: boolean,
): Promise<void> => {
  const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
  const decodedToken = verifyToken(actualToken) as JwtPayload;
  const decodedUserId =
    (decodedToken.token?.userId as string) ||
    ((decodedToken.token as any)?.id as string);

  const decodedDeviceId =
    (decodedToken.token?.deviceId as string) ||
    ((decodedToken.token as any)?.deviceId as string);

  let deviceName = "";

  if (!decodedToken.success || !decodedUserId) {
    sendJson(ws, {
      type: "PairingFailed",
      message: "Invalid token or Expired",
      data: null,
    });
    return;
  }

  if (decodedDeviceId) {
    const user = await UserModel.findOne({
      _id: decodedUserId,
      "devices._id": decodedDeviceId,
      "devices.deviceToken": actualToken,
    });
    deviceName =
      user?.devices?.find((d) => d._id.toString() === decodedDeviceId)
        ?.deviceName || "";
    if (!user) {
      sendJson(ws, {
        type: "PairingFailed",
        message: "Device has been revoked.",
        data: null,
      });
      return;
    }
  } else {
    const user = await UserModel.findById(decodedUserId);
    if (!user) {
      sendJson(ws, {
        type: "PairingFailed",
        message: "User not found.",
        data: null,
      });
      return;
    }
  }
  ws.isAlive = true;
  ws.isAuthenticated = true;
  ws.userId = decodedUserId;
  ws.deviceId = decodedDeviceId || "web_client";
  ws.deviceName = deviceName;
  ws.ipAddress = ipaddress;
  ws.service = typeof service === "boolean" ? service : true;
  console.log(
    `[WS] Authenticated ${decodedDeviceId ? `device ${decodedDeviceId}` : "web client"} for user ${decodedUserId}`,
  );
  if (decodedDeviceId) {
    sendToUser(decodedUserId, {
      type: "device_status",
      device: {
        deviceName: deviceName,
        id: decodedDeviceId,
        ipaddress: ws.ipAddress,
      },
      online: true,
      service: ws.service,
    });
  } else {
    await sendDeviceStatus(ws, decodedUserId);
  }
};

const initWebsocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: CustomWebSocket, req: any) => {
    const url = new URL(
      req.url || "",
      `http://${req.headers.host || "localhost"}`,
    );
    const queryToken = url.searchParams.get("token");
    const authHeader =
      req.headers["authorization"] ||
      req.headers["Authorization"] ||
      queryToken;
    const ipHeader = req.headers["ipaddress"] || req.headers["ipAddress"];
    console.log("IP ADDRESS: ", ipHeader);
    if (authHeader) {
      await connectDevice(ws, authHeader, ipHeader as string);
    }

    ws.on("message", async (event: any) => {
      try {
        const data = event.toString();
        const parsedData = JSON.parse(data);

        const { type } = parsedData;

        switch (type) {
          case "PairingInit": {
            ws.pairingCode = parsedData.code;
            break;
          }

          case "auth": {
            if (parsedData.token) {
              await connectDevice(
                ws,
                parsedData.token,
                parsedData.ipAddress || parsedData.ipaddress || ipHeader,
                parsedData.service,
              );
            }
            break;
          }

          case "get_devices": {
            if (ws.isAuthenticated && ws.userId) {
              await sendDeviceStatus(ws, ws.userId);
            }
            break;
          }

          case "device_status": {
            if (ws.isAuthenticated && ws.deviceId) {
              // Broadcast to the user's frontend web client
              ws.service = parsedData.service;
              if (parsedData.ipAddress) {
                ws.ipAddress = parsedData.ipAddress;
              }
              sendToUser(ws.userId!, {
                type: "device_status",
                device: {
                  deviceName: ws.deviceName,
                  id: ws.deviceId,
                  ipAddress: ws.ipAddress,
                },
                online: true,
                service: parsedData.service,
              });
            }
            break;
          }

          case "cmd_response": {
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
            break;
          }


          case "revoke-device": {
            if (!ws.isAuthenticated) break;
            let targetDeviceId = parsedData.deviceId;

            if (parsedData.deviceToken) {
              const actualToken = parsedData.deviceToken.startsWith("Bearer ")
                ? parsedData.deviceToken.slice(7)
                : parsedData.deviceToken;
              const decodedToken = verifyToken(actualToken) as JwtPayload;
              if (
                !decodedToken ||
                !decodedToken.success ||
                !decodedToken.token
              ) {
                sendJson(ws, {
                  type: "PairingFailed",
                  message: "Invalid token",
                });
                break;
              }
              const tokenUserId =
                (decodedToken.token?.userId as string) ||
                ((decodedToken.token as any)?.id as string);
              if (tokenUserId !== ws.userId) {
                sendJson(ws, {
                  type: "PairingFailed",
                  message: "You cannot revoke another user's device",
                });
                break;
              }
              targetDeviceId =
                (decodedToken.token?.deviceId as string) ||
                ((decodedToken.token as any)?.deviceId as string);
            }

            // If no specific deviceId provided and sender is an authenticated companion device, target itself
            if (
              !targetDeviceId &&
              ws.deviceId &&
              ws.deviceId !== "web_client"
            ) {
              targetDeviceId = ws.deviceId;
            }

            if (!targetDeviceId) {
              sendJson(ws, {
                type: "Error",
                message: "Device ID required to revoke",
              });
              break;
            }

            const result = await revokeDevice(ws.userId!, targetDeviceId);
            sendJson(ws, {
              type: "RevokeResponse",
              success: result.success,
              message: result.message,
              deviceId: targetDeviceId,
            });
            break;
          }

          default:
            console.log(`[WS] Unhandled event type: ${type}`);
            break;
        }
      } catch (err: any) {
        console.error("[WS] Message parsing error:", err.message);
      }
    });
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("close", () => {
      console.log(
        `[WS] Client disconnected (user: ${ws.userId || "unauthenticated"}, device: ${ws.deviceId || "none"})`,
      );
      if (
        ws.isAuthenticated &&
        ws.userId &&
        ws.deviceId &&
        ws.deviceId !== "web_client"
      ) {
        sendToUser(ws.userId, {
          type: "device_status",
          device: { deviceName: ws.deviceName, id: ws.deviceId },
          online: false,
        });
      }

      ws.userId = "";
      ws.isAuthenticated = false;
      ws.deviceId = "";
    });
  });
};
//Client check pinging...
setInterval(() => {
  if (!wss) return;
  wss.clients.forEach((client: CustomWebSocket) => {
    if (client.deviceId === "web_client") return; // skip browser clients
    if (client.isAlive === false) {
      return client.terminate();
    }
    client.isAlive = false; // assume dead until pong proves otherwise
    client.ping(); // triggers Local-BE auto-pong
  });
}, 30000);

const sendDeviceStatus = async (ws: WebSocket, userId: string) => {
  const userDoc = await UserModel.findById(userId);
  sendJson(ws, {
    type: "device_list",
    devices: (userDoc?.devices || []).map((d) => {
      const client = Array.from(wss.clients as Set<CustomWebSocket>).find(
        (c) => c.deviceId === d._id.toString(),
      );
      return {
        id: d._id.toString(),
        deviceName: d.deviceName,
        online: !!client,
        service: client ? (client.service ?? true) : true,
        ipAddress: client?.ipAddress,
      };
    }),
  });
};

const sendToUser = (userId: string, data: any, deviceId?: string) => {
  if (!wss) return;
  const dataStr = typeof data === "string" ? data : JSON.stringify(data);

  (wss.clients as Set<CustomWebSocket>).forEach((client) => {
    const isSameUser = client.userId?.toString() === userId?.toString();
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
    let isAliveFound = false;
    (wss.clients as Set<CustomWebSocket>).forEach((client) => {
      const isSameUser = client.userId?.toString() === userId?.toString();
      if (client.deviceId === "web_client") {
        return;
      }
      if (
        isSameUser &&
        client.isAuthenticated &&
        client.readyState === WebSocket.OPEN
      ) {
        clientFound = true;
        if (client.isAlive) {
          isAliveFound = true;
          client.send(dataStr);
        }
      }
    });
    if (!clientFound || !isAliveFound) {
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
export const revokeDevice = async (
  userId: string,
  deviceId?: string,
  deviceToken?: string,
) => {
  let targetDeviceId = deviceId;
  if (!targetDeviceId && deviceToken) {
    const user = await UserModel.findById(userId);
    const matched = user?.devices?.find((d) => d.deviceToken === deviceToken);
    if (matched) {
      targetDeviceId = matched._id.toString();
    }
  }

  const deviceObjectId =
    targetDeviceId && Types.ObjectId.isValid(targetDeviceId)
      ? new Types.ObjectId(targetDeviceId)
      : null;
  const orConditions: any[] = [];
  if (deviceObjectId) orConditions.push({ _id: deviceObjectId });
  if (targetDeviceId) orConditions.push({ _id: targetDeviceId });
  if (deviceToken) orConditions.push({ deviceToken: deviceToken });

  const result = await UserModel.updateOne(
    { _id: userId },
    {
      $pull: {
        devices: {
          $or:
            orConditions.length > 0 ? orConditions : [{ _id: targetDeviceId }],
        },
      },
    },
  );
  if (result.modifiedCount === 0) {
    return {
      success: false,
      message: "Failed to revoke device: Device not found",
      data: null,
    };
  }
  if (wss) {
    for (const client of wss.clients as Set<CustomWebSocket>) {
      if (
        (client.deviceId === targetDeviceId ||
          (client as any).deviceToken === deviceToken) &&
        client.userId?.toString() === userId?.toString()
      ) {
        sendJson(client, {
          type: "PairingFailed",
          message: "Device has been revoked",
        });
        client.close(4003, "Device revoked by user");
      }
    }
  }
  if (targetDeviceId) {
    sendToUser(userId, {
      type: "device_removed",
      deviceId: targetDeviceId,
    });
  }
  return {
    success: true,
    message: "Device revoked successfully",
    data: null,
  };
};

export const revokeSelfHandler = async (req: any, res: any) => {
  try {
    const authHeader = req.headers["authorization"];
    const bodyToken = req.body?.deviceToken;
    const rawToken = authHeader || (bodyToken ? `Bearer ${bodyToken}` : null);
    if (!rawToken || !rawToken.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token not provided",
      });
    }
    const token = rawToken.substring(7);
    const decodedToken: any = verifyToken(token);
    if (!decodedToken.success || !decodedToken.token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }
    const userId = (
      decodedToken.token.userId || decodedToken.token.id
    )?.toString();
    const deviceId = decodedToken.token.deviceId?.toString();
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Token does not contain user identity",
      });
    }
    const result = await revokeDevice(userId, deviceId, token);
    return res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[REVOKE SELF ERROR]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during device revocation",
    });
  }
};

export const revokeDeviceHandler = async (req: any, res: any) => {
  const userId: string = req.userId ? req.userId.toString() : "";
  const { deviceId } = req.params;
  const result = await revokeDevice(userId, deviceId);
  return res.status(200).json({
    success: result.success,
    message: result.message,
    data: result.data,
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

  const { pairingcode } = req.body;
  const userId: string = req.userId ? req.userId.toString() : "";

  if (!pairingcode) {
    return res.status(400).json({
      success: false,
      message: "Pairing code is required",
      data: null,
    });
  }

  for (const client of wss.clients as Set<CustomWebSocket>) {
    if (
      client.pairingCode === pairingcode &&
      client.readyState === WebSocket.OPEN
    ) {
      client.pairingCode = "";
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
