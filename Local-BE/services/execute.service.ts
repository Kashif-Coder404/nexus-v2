import { exec as execCallback } from "child_process";
import { promisify } from "util";

const exec = promisify(execCallback);

export interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCmd(
  cmd: string,
  timeoutMs: number = 30000,
): Promise<ExecutionResponse> {
  try {
    const commandResponse: any = await exec(cmd, {
      timeout: timeoutMs,
    });

    return {
      stdout: commandResponse.stdout,
      stderr: commandResponse.stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    console.log(`[EXECUTE COMMADER] ERROR: ${error}`);
    const isTimeout = error.killed || error.signal === "SIGTERM";
    return {
      stdout: error.stdout || "",
      stderr: isTimeout
        ? `Command timed out after ${timeoutMs / 1000} seconds`
        : error.message,
      exitCode: error.code || 1,
    };
  }
}
