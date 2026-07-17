import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { broadCastMessage } from "./websocket.service.js";

const exec = promisify(execCallback);

interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCmd(cmd: string): Promise<ExecutionResponse> {
  try {
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: `Executing: ${cmd.length > 30 ? cmd.slice(0, 30) + "..." : cmd}`,
      },
    });
    const { stdout, stderr } = await exec(cmd);
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: "",
      },
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: `Error: ${error.message}`,
      },
    });
    return {
      stdout: error.stdout || "",
      stderr: error.message,
      exitCode: error.code || 1,
    };
  }
}
