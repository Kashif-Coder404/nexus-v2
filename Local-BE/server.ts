import app from "./app";
import ServerWSConnection from "./services/ws.service";
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

  server.on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}

bootstrap();
