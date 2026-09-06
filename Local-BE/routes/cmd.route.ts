import express from "express";
import { runCommand } from "../controllers/cmd.controller";

const router = express.Router();

router.post("/run-command", async (req, res) => {
  const { commands } = req.body;
  const actualCommands =
    typeof commands === "string" ? JSON.parse(commands) : commands;
  const action = actualCommands.action;
  const param = actualCommands.param;
  const timeout = actualCommands.timeout || 5000;
  const isDaemon = actualCommands.isDaemon;
  if (!action) {
    return res.status(400).json({
      isSuccess: false,
      msg: "Some parameters are missing.",
      error: "action is missing",
      data: {},
    });
  }
  const data = await runCommand(action, param, timeout, isDaemon);
  res.status(200).json({
    isSuccess: data.isSuccess,
    msg: "Response from the commands",
    error: "",
    data,
  });
});

export default router;
