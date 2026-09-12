import { commandParser } from "../Parsers.js";

export const runCommand = async (
  action: any,
  param: string | Object,
  timeout: number | 30000,
  isDaemon: boolean = false,
) => {
  const results = await commandParser({ action, param, timeout, isDaemon });
  if (!results.terminalOutput && !results.terminalError) {
    results.terminalOutput = "No Output";
  }
  return results;
};
