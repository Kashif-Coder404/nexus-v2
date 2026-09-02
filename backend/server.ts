import app from "./app.js";
import dotenv from "dotenv";
import http, { Server } from "http";
import { initWebsocket } from "./services/websocket.service.js";
import { initializeKeys } from "./EnvVariables.js";
dotenv.config();

await initializeKeys();
const PORT: number = Number(process.env.PORT) || 3100;

const server: Server = http.createServer(app);

initWebsocket(server);

server.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
