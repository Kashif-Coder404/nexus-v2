import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { broadCastMessage } from "./websocket.service.js";

const exec = promisify(execCallback);

interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCmd(
  cmd: string,
  timeoutMs: number = 10000,
): Promise<ExecutionResponse> {
  try {
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: `Executing: ${cmd.length > 30 ? cmd.slice(0, 30) + "..." : cmd}`,
      },
    });

    if (cmd.trim().startsWith("start ")) {
      execCallback(cmd);
      return {
        stdout: "Process started in background successfully.",
        stderr: "",
        exitCode: 0,
      };
    }

    const commandResponse: any = await exec(cmd, { timeout: timeoutMs });

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
// const tempCMD: string = `start "" "C://Users//Kashif//Desktop//visual studio code.lnk"`;
// console.log(await executeCmd(tempCMD));
