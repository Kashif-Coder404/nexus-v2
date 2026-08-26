import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

let wss: WebSocketServer;
const initWebsocket = async (server: Server) => {
  wss = new WebSocketServer({ server });
  wss.on("connection", (ws: WebSocket, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[WS] Client connected: ${ip}`);

    ws.on("message", (event: any) => {
      const data = event.toString();
      console.log(`[WS] Message from ${ip}: \n${data}`);
      // console.log(JSON.parse(data).data.msg);
      wss.clients.forEach((client: WebSocket) => {
        console.log(client);
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              data: {
                responsemsg: "GOTED THE MESSAGE " + JSON.parse(data).data.msg,
              },
            }),
          );
        }
      });
    });
    ws.on("close", (code: number, reason: Buffer) => {
      console.log(`[WS] Client disconnected: ${ip}`);
    });
  });
};

const broadCastMessage = (data: any) => {
  if (!wss) return;

  const dataStr = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === 1) {
      client.send(dataStr);
    }
  });
};
export { initWebsocket, broadCastMessage };

const clientWSConnection = () => {
  const ws = new WebSocket("ws://localhost:3100");
  ws.on("open", () => {
    console.log("Connected to Backend A");
    ws.send("Hello from Backend B Client");
  });

  ws.on("message", (data) => {
    console.log(`Received from Backend A: ${data}`);
  });

  ws.on("close", () => {
    console.log("Connection closed. Reconnecting in 5 seconds...");
    setTimeout(clientWSConnection, 5000);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
};
clientWSConnection();
