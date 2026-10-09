import { WebSocketServer } from "ws";
import app from "./app";
import ServerWSConnection, { sendSystemdata } from "./services/ws.service";
import { setupFirst } from "./setupnexus";

const PORT = 4100;

async function bootstrap() {
  const shouldRunServer = await setupFirst();
  if (!shouldRunServer) {
    return;
  }

  const server = app.listen(PORT, async () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
    ServerWSConnection();
  });

  const localwss = new WebSocketServer({ server });

  localwss.on("connection", (ws) => {
    console.log("[Local-BE] New local connection");
    console.log("[LOCAL WS] Phone/Browser connected directly!");
    ws.send(JSON.stringify({ message: "Connected to Local-BE!" }));
    let sysInterVal: NodeJS.Timeout;
    sysInterVal = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        sendSystemdata(ws);
      }
    }, 20000); // every 10s
    ws.on("error", (err: any) => {
      console.error("[LOCAL WS] Error:", err?.message || err);
    });
    ws.on("close", () => {
      clearInterval(sysInterVal);
    });
  });

  server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}

bootstrap();
