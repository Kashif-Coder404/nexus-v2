import { executeCmd, ExecutionResponse } from "../services/execute.service.js";

export const runCommand = async (
  action: string,
  param: string | Object,
  timeout: number | 30000,
  session: string,
) => {
  const results: any = await commandParser(
    { action: action, param: param, timeout: timeout },
    session,
  );
  return results;
};

