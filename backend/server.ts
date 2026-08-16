import app from "./app.js";
import dotenv from "dotenv";
import http, { Server } from "http";
import { initWebsocket } from "./services/websocket.service.js";
// import { connectDB } from "./db/connectDB.js";

dotenv.config();
// connectDB();
const PORT: number = 3100;
const server: Server = http.createServer(app);

initWebsocket(server);

server.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
