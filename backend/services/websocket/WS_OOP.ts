import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage, Server } from "http";
import { ActiveSessions, CustomWebSocket, PendingTask } from "./Types.js";
import { verifyToken } from "../jwt.service.js";
//Client = Frontend , ClientDevice = Local Backend WS
export class ClientSession {
  public userId = "";
  public isAuthenticated: boolean = false;
  constructor(public ws: WebSocket) {
    this.ws.on("message", (raw) => this.onMessage(raw));
    this.ws.on("close", () => this.onClose());
  }

  public send(payload: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      const msg =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      this.ws.send(msg);
    }
  }
  private async onMessage(data: any) {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === "auth") {
        await this.handleAuth(parsed.token);
      }
    } catch (error) {
      console.log("Invalid JSON", error);
    }
  }

  private async handleAuth(token: string) {
    token = token.trim().replace("Bearer ", "");
    const decoded: any = verifyToken(token);
    if (!decoded.success) {
      this.send({ type: "PairingFailed", message: "Invalid or Expired Token" });
      return;
    }

    this.userId = decoded.token?.userId || decoded.token?.id;
    this.isAuthenticated = this.userId ? true : false;
    let tabs = WebSocketService.userClients.get(this.userId);
    if (!tabs) {
      tabs = new Set();
      WebSocketService.userClients.set(this.userId, tabs);
    }
    tabs.add(this);
    this.send({ type: "PairingSuccess" });
  }

  private async onClose() {
    console.log(`Web Client Disconected (${this.userId})`);
    const tabs = WebSocketService.userClients.get(this.userId);
    if (tabs) {
      tabs.delete(this);
      if (tabs.size === 0) {
        WebSocketService.userClients.delete(this.userId);
      }
    }
  }
}
type DataPayload = {
  type: string;
  payload: object | null;
};
type ClientTabs = Set<ClientSession>;
export class WebSocketService {
  private static wss: WebSocketServer;
  public static userClients = new Map<string, ClientTabs>();
  public static activeSessions = new Map<string, ActiveSessions>();
  private static pendingTasks = new Map<string, PendingTask>();
  private static pendingRequest = new Map<string, string>();

  public static init(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      this.onConnection(ws, req);
    });
  }
  private static async onConnection(ws: WebSocket, req: IncomingMessage) {
    const session = new ClientSession(ws);
    console.log(`New Web Client Connected (${session.userId})`);
  }
  public static sendToClient(userId: string, data: DataPayload) {
    const tabs = this.userClients.get(userId);
    if (!tabs) return;
    const payload = JSON.stringify(data);
    for (const session of tabs) {
      session.send(payload);
    }
  }
}
