import { ChildProcess, exec as execCallback, spawn } from "child_process";

let currentRunningProcess: ChildProcess | null = null;
export interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}
export async function killCurrentProcess() {
  if (currentRunningProcess && currentRunningProcess.pid) {
    try {
      execCallback(`taskkill /pid ${currentRunningProcess.pid} /T /F`);
    } catch (e) {
      console.log(`[EXECUTE COMMADER] Error killing process:`, e);
    }
    currentRunningProcess = null;
  }
}
export async function executeCmd(
  cmd: string,
  timeoutMs: number = 30000,
  isDaemon: boolean = false,
): Promise<ExecutionResponse> {
  if (isDaemon) {
    try {
      const child = spawn(cmd, {
        shell: true,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      return {
        stdout: "Started Background process",
        stderr: "",
        exitCode: 0,
      };
    } catch (error: any) {
      console.log(`[EXECUTE COMMANDER] ERROR: ${error.message}`);
      return {
        stdout: "",
        stderr: error.message,
        exitCode: 1,
      };
    }
  }
  return new Promise((resolve) => {
    const child = execCallback(
      cmd,
      { timeout: timeoutMs },
      (error: any, stdout, stderr) => {
        currentRunningProcess = null;
        if (error) {
          console.log(`[EXECUTE COMMADER] ERROR: ${error}`);
          const isTimeout = error.killed || error.signal === "SIGTERM";
          if (isTimeout && child.pid) {
            try {
              execCallback(`taskkill /pid ${child.pid} /T /F`);
            } catch (e) {
              console.log(`[EXECUTE COMMADER] Error killing process:`, e);
            }
          }
          return resolve({
            stdout: stdout || "",
            stderr: isTimeout
              ? `Command timed out after ${timeoutMs / 1000} seconds`
              : error.message,
            exitCode: error.code || 1,
          });
        }
        return resolve({
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: 0,
        });
      },
    );
    // THIS assigns the process handle so killCurrentProcess() can target its PID!
    currentRunningProcess = child;
  });
}
