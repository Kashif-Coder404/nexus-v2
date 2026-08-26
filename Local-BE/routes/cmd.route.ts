import express from "express";
import { executeCmd } from "../services/execute.service";
import { runCommand } from "../controllers/cmd.controller";
import { error } from "node:console";
const router = express.Router();

router.post("/run-command", async (req, res) => {
  const { commands } = req.body;
  const actualCommands =
    typeof commands === "string" ? JSON.parse(commands) : commands;
  const action = actualCommands.action;
  const param = actualCommands.param;
  const timeout = actualCommands.timeout || 5000;
  // const session = commands.session;
  console.log("[CMD]", actualCommands);
  if (!action || !param) {
    console.log("[CMD] Missing parameters");
    return res.status(400).json({
      isSuccess: false,
      msg: "Some parameters are missing.",
      error: "action or param is missing",
      response: {},
    });
  }
  const response = await runCommand(action, param, timeout);
  console.log("[CMD] Response:", response);
  res.status(200).json({
    isSuccess: response.isSuccess,
    msg: "Response from the commands",
    error: "",
    response,
  });
});

export default router;
