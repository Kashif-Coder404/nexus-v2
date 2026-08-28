import { commandParser } from "../Parsers.js";
import { executeCmd, ExecutionResponse } from "../services/execute.service.js";
import { ChatMessageType } from "../Types.js";
import { ActionTypes } from "../Types/ParserTypes.js";

export const runCommand = async (
  action: any,
  param: string | Object,
  timeout: number | 30000,
) => {
  const results = await commandParser({ action, param, timeout });
  results.terminalOutput =
    results.terminalOutput === "" ? "No Output" : results.terminalOutput;
  return results;
};
