import app from "./app";
import ServerWSConnection from "./services/ws.service";

const PORT = 4100;

const server = app.listen(PORT, async () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  ServerWSConnection();
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});
