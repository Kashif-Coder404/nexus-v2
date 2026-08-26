import app from "./app";
import { initWebsocket } from "./services/ws.service";

const PORT = 4100;

const server = app.listen(PORT, async () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  await initWebsocket(server);
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});