import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

let wss: WebSocketServer;
const initWebsocket = (server: Server) => {
  wss = new WebSocketServer({ server });
  wss.on("connection", (ws: WebSocket, req) => {
    ws.on("message", (event) => {
      const data = event.toString();

      //BroadCasting!
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(data);
        }
      });
    });
    ws.on("close", (code: number, reason: Buffer) => {
      console.log(`Connection Closed code ${code}, Reason: ${reason}`);
    });
  });
};

const broadCastMessage = (data: any) => {
  if (!wss) return;

  const message = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};
export { initWebsocket, broadCastMessage };
