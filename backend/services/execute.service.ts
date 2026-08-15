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
  timeoutMs: number = 5000,
): Promise<ExecutionResponse> {
  try {
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: `Executing: ${cmd.length > 30 ? cmd.slice(0, 30) + "..." : cmd}`,
      },
    });

    const commandResponse: any = await exec(cmd, { timeout: timeoutMs });
    // const commandResponse: any = await execCallback(cmd, { timeout: 10000 });

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
// const tempCMD: string = `start "" "C://Users//Kashif//Desktop//VSCode.lnk"`;
// executeCmd(tempCMD);
