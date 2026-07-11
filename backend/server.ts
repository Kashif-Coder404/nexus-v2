import app from "./app.js";
import dotenv from "dotenv";
import http, { Server } from "http";
import { initWebsocket } from "./services/websocket.service.js";

dotenv.config();

const PORT: number = 3100;
const server: Server = http.createServer(app);

initWebsocket(server);

server.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});
