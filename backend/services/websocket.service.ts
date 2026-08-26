import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import url from "url";

let wss: WebSocketServer;
const initWebsocket = (server: Server) => {
  wss = new WebSocketServer({ server });
  wss.on("connection", (ws: WebSocket, req) => {
    const sessionId = url.parse(req.url as string, true)?.query?.sessionId;
    const userId = url.parse(req.url as string, true)?.query?.userId;
    console.log(sessionId, userId); // Need to be done!
    ws.on("message", (event: any) => {
      const data = event.toString();
      //BroadCasting!
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === 1) {
          client.send(data);
        }
      });
    });
    ws.on("close", (code: number, reason: Buffer) => {});
  });
};

const broadCastMessage = (data: any) => {
  if (!wss) return;
  console.log("Broadcasting data: ", data);
  const dataStr = typeof data === "string" ? data : JSON.stringify(data);
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === 1) {
      client.send(dataStr);
    }
  });
};
export { initWebsocket, broadCastMessage };
