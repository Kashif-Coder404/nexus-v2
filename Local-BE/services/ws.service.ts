import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { runCommand } from "../controllers/cmd.controller";
import url from "url";

// let wss: WebSocketServer;
// const initWebsocket = async (server: Server) => {
//   wss = new WebSocketServer({ server });
//   wss.on("connection", (ws: WebSocket, req) => {
//     const ip = req.socket.remoteAddress;
//     console.log(`[WS] Client connected: ${ip}`);

//     ws.on("message", (event: any) => {
//       const data = event.toString();
//       console.log(`[WS] Message from ${ip}: \n${data}`);
//       // console.log(JSON.parse(data).data.msg);
//       wss.clients.forEach((client: WebSocket) => {
//         if (client.readyState === 1) {
//           client.send(data);
//         }
//       });
//     });
//     ws.on("close", (code: number, reason: Buffer) => {
//       console.log(`[WS] Client disconnected: ${ip}`);
//     });
//   });
// };

// const broadCastMessage = (data: any) => {
//   if (!wss) return;

//   const dataStr = typeof data === "string" ? data : JSON.stringify(data);
//   wss.clients.forEach((client: WebSocket) => {
//     if (client.readyState === 1) {
//       client.send(dataStr);
//     }
//   });
// };
// export { initWebsocket, broadCastMessage };

const email: string = "kashifahmead8755@gmail.com";
const password: string = "kashifpassword";
let currentToken = null;
// const email: string = "";
// const password: string = "";
const ServerWSConnection = () => {
  const ws = new WebSocket(
    `ws://localhost:3100?email=${email}&password=${password}`,
  );
  ws.on("message", async (event: any, req: any) => {
    const data = event.toString();
    const parsedData = JSON.parse(data);
    // console.log("Parsed Data Type: ", parsedData.type);
    if (parsedData.type === "Auth") {
      if (parsedData.status === 401) {
        // console.log("Failed to Authenticate");
      } else if (parsedData.data.token) {
        (ws as any).token = parsedData.data.token;
        console.log(
          "Authentication Complete \nToken " +
            (ws as any).token?.slice(0, 20) +
            "...",
        );
        // console.log("Token: ", (ws as any).token);
      } else {
        console.log("Error in Authenticating");
      }
    } else if (parsedData.type === "RunCMD") {
      const cmd = JSON.parse(parsedData.cmd);
      // console.log("Running CMD: ", cmd);
      const cmdResponse = await runCommand(cmd.action, cmd.param, cmd.timeout);
      ws.send(JSON.stringify({ type: "cmd_response", cmdResponse }));
    }
  });

  ws.on("close", () => {
    const retryIn = 2000;
    console.log(
      `Connection closed. Reconnecting in ${retryIn / 1000} seconds...`,
    );
    setTimeout(ServerWSConnection, retryIn);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
};
export default ServerWSConnection;
