import express from "express";
import { executeCmd } from "../services/execute.service";
import { runCommand } from "../controllers/cmd.controller";
const router = express.Router();

router.post("/commands", async (req, res) => {
  const { commands } = req.body;
  const action = commands.action;
  const param = commands.param;
  const timeout = commands.timeout;
  const session = commands.session;
  const response = await runCommand(action, param, timeout, session);
  res.status(200).json({
    isSuccess: response.isSuccess,
    msg: "Response from the commands",
    response,
  });
});

export default router;
