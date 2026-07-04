import { WebSocketServer, WebSocket } from "ws";

export function broadcast(wssServer: WebSocketServer, data: object) {
  wssServer.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

