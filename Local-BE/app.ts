import express from "express";
import cors from "cors";
import router from "./routes/cmd.route";
import { broadCastMessage } from "./services/ws.service";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use("/commands", router);
export default app;
