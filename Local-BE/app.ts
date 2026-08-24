import express from "express";
import cors from "cors";
import router from "./routes/cmd.route";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.post("/commands", router);
export default app;
