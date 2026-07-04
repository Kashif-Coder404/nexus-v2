import { exec as execCallback } from "child_process";
import { promisify } from "util";

const exec = promisify(execCallback);

interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function executeCmd(cmd: string): Promise<ExecutionResponse> {
  try {
    console.log("Executing the command !",cmd); // To be send to the frontend with ws
    const { stdout, stderr } = await exec(cmd);
    console.log("Command done!"); // ws message
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || "",
      stderr: error.message,
      exitCode: error.code || 1,
    };
  }
}
