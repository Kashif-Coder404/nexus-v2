import { executeCmd, ExecutionResponse } from "../services/execute.service.js";

export const runCommand = async (
  action: string,
  param: string | Object,
  timeout: number | 30000,
  session?: string,
) => {
  const results: any = await executeCmd(param as string, timeout);
  const isSuccess = results.stderr ? false : true;
  results.stdout = results.stdout === "" ? "No Output" : results.stdout;
  return { isSuccess, ...results };
};
