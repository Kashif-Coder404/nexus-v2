import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { broadCastMessage } from "./websocket.service.js";
import path from "path";

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
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: `Executing: ${cmd.length > 30 ? cmd.slice(0, 30) + "..." : cmd}`,
      },
    });

    // Ensure we run from the project root instead of potentially System32
    // If the process started in the backend folder, we go up one level.
    let executionCwd = process.cwd();
    if (executionCwd.endsWith("backend") || executionCwd.endsWith("backend\\") || executionCwd.endsWith("backend/")) {
      executionCwd = path.resolve(executionCwd, "..");
    }

    if (cmd.trim().startsWith("start ")) {
      execCallback(cmd, { cwd: executionCwd });
      return {
        stdout: "Process started in background successfully.",
        stderr: "",
        exitCode: 0,
      };
    }

    const commandResponse: any = await exec(cmd, { 
      timeout: timeoutMs,
      cwd: executionCwd 
    });

    return {
      stdout: commandResponse.stdout,
      stderr: commandResponse.stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: "",
      },
    });
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
