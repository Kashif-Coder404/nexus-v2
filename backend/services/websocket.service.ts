import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import url from "url";
import { UserLogin } from "../middlewares/auth/authUserLogin.js";
import { verifyToken } from "./jwt.service.js";

let wss: WebSocketServer;

const initWebsocket = (server: Server) => {
  wss = new WebSocketServer({ server });
  wss.on("connection", async (ws: WebSocket, req: any) => {
    const requestUrl = new URL(req.url, `http:${req.headers.host}`);
    const email: string = requestUrl.searchParams.get("email") || "";
    const password: string = requestUrl.searchParams.get("password") || "";
    if (!(ws as any).token) {
      if (!email && !password) {
        ws.send(
          JSON.stringify({
            type: "Auth",
            msg: "Failed to Authenticate",
            status: 401,
            error: "email and passowrd not provided!",
          }),
        );
        return;
      }
      const user = await UserLogin(email, password);
      if (!user.success) {
        ws.send(
          JSON.stringify({
            type: "Auth",
            msg: "Failed to Authenticate",
            status: 401,
            error: user.message,
          }),
        );
        return;
      } else {
        (ws as any).token = user?.data?.token || "";
      }
      ((ws as any).isAuthenticated as boolean) = true;
      ((ws as any).userId as string) = user?.data?.user?._id.toString() || "";
      ((ws as any).username as string) = user?.data?.user?.name || "";

      ws.send(
        JSON.stringify({
          type: "Auth",
          msg: "Authenticated",
          status: 200,
          data: {
            token: (ws as any).token,
          },
        }),
      );
    }
    ws.on("message", (event) => {
      if (!(ws as any).isAuthenticated) {
        ws.close(4001, "Unauthorized");
        return;
      }
      try {
        const data = event.toString();
        const parsedData = JSON.parse(data);
        const { cmdResponse } = parsedData;

        if (cmdResponse) {
          console.log("[WS] Received cmdResponse from device:", cmdResponse);
        }
      } catch (err: any) {
        console.error("[WS] Error processing incoming message:", err.message);
      }
    });
    ws.on("close", (code: number, reason: Buffer) => {
      console.log(`[WS] Client disconnected (user: ${(ws as any).userId})`);
    });
  });
};

const sendToUser = (userId: string, data: any) => {
  if (!wss) return;
  const dataStr = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach((client: WebSocket) => {
    if (
      (client as any).userId === userId.toString() &&
      (client as any).isAuthenticated &&
      client.readyState === 1
    ) {
      client.send(dataStr);
    }
  });
};

export { initWebsocket, sendToUser };
