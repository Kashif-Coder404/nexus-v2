import {
  ChildProcess,
  exec,
  exec as execCallback,
  execSync,
  spawn,
} from "child_process";
import { search, search_app } from "./search.service";

// import { toRunTestingFIle } from "./executeTesting";
let currentRunningProcess: ChildProcess | null = null;
export interface ExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
}
// Commands that contain these substrings are long-running and should be detached
const BACKGROUND_INCLUDES: string[] = [
  "npm run dev",
  "npm start",
  "tsx watch",
  "nodemon",
  "vite",
];

// Commands that start with these prefixes are GUI launchers / one-shot openers
const BACKGROUND_STARTS_WITH: string[] = [
  "start-process",
  "start ",
  "code ", // VS Code CLI — launches GUI, never exits on its own
  "code.", // e.g. `code.` to open current dir
];

// Commands that contain these strings are GUI / protocol launchers
const BACKGROUND_CONTAINS: string[] = [
  "explorer.exe",
  ".lnk",
  "http://",
  "https://",
];

export function isBackgroundCommand(
  cmd: string,
  explicitDaemon: boolean,
): boolean {
  if (explicitDaemon) return true;

  const lower = cmd.toLowerCase().trim();

  // 1. Long-running servers / watchers
  if (BACKGROUND_INCLUDES.some((pattern) => lower.includes(pattern))) {
    return true;
  }

  // 2. GUI App Launchers — prefix match
  if (BACKGROUND_STARTS_WITH.some((prefix) => lower.startsWith(prefix))) {
    return true;
  }

  // 3. GUI App Launchers — substring match (protocols, file types)
  if (BACKGROUND_CONTAINS.some((pattern) => lower.includes(pattern))) {
    return true;
  }

  return false;
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
export function extractPathFromCmd(cmd: string): string {
  const trimmed = cmd.trim();
  // 1. Extract from -ArgumentList "..." (e.g. Start-Process explorer.exe -ArgumentList "D:/Coding")
  const argListMatch = trimmed.match(/-ArgumentList\s+["']?([^"']+)["']?/i);
  if (argListMatch && argListMatch[1]) {
    return argListMatch[1].trim();
  }
  // 2. Extract from -FilePath "..." (e.g. Start-Process -FilePath "C:/app.exe")
  const filePathMatch = trimmed.match(/-FilePath\s+["']?([^"']+)["']?/i);
  if (filePathMatch && filePathMatch[1]) {
    return filePathMatch[1].trim();
  }
  // 3. Extract path from Start-Process '...' (e.g. Start-Process 'D:/Coding')
  const startProcessMatch = trimmed.match(/Start-Process\s+["']([^"']+)["']/i);
  if (startProcessMatch && startProcessMatch[1]) {
    return startProcessMatch[1].trim();
  }
  // 4. Extract any drive path like C:\... or D:/... anywhere in the command
  const drivePathMatch = trimmed.match(/([a-zA-Z]:[\\/][^\s"';]+)/);
  if (drivePathMatch && drivePathMatch[1]) {
    return drivePathMatch[1].trim();
  }
  // 5. Fallback: if it's already a clean/quoted path, strip outer quotes
  return trimmed.replace(/^["']|["']$/g, "").trim();
}
export const startApplication = async (applicationPath: string) => {
  const sanitizePath = applicationPath.replaceAll("\\", "/").trim();
  if (!sanitizePath) {
    return {
      stdout: "",
      stderr: "Please provide a valid path",
      exitCode: 1,
    };
  }
  const result = await executeCmd(
    `powershell.exe -WindowStyle Hidden -NonInteractive -Command "Start-Process '${sanitizePath}' -WindowStyle Normal"`,
    0,
    true,
  );
  return result;
};
export async function executeCmd(
  cmd: string,
  timeoutMs: number = 30000,
  isDaemon: boolean = false,
): Promise<ExecutionResponse> {
  // console.log(`Executing command: ${cmd} with timeout: ${timeoutMs}ms`);
  const isBackground = isBackgroundCommand(cmd, isDaemon);
  if (isBackground) {
    try {
      const lower = cmd.toLowerCase().trim();

      // explorer.exe and .lnk paths → extract path and use Start-Process
      const isGuiPathLauncher =
        lower.includes("explorer.exe") || lower.includes(".lnk");
      if (isGuiPathLauncher) {
        const targetPath = extractPathFromCmd(cmd);
        const result = await startApplication(targetPath);
        return result;
      }

      // shell: protocol (e.g. shell:AppsFolder\...) → launch via explorer.exe
      // Only explorer.exe natively handles shell: URIs; `start` and Start-Process cannot
      // Normalize forward slashes → backslashes (shell: URIs require backslashes on Windows)
      const shellProtoMatch = cmd.match(/shell:[^\s"']+/i);
      if (shellProtoMatch) {
        const shellPath = shellProtoMatch[0].replaceAll("/", "\\");
        const child = spawn(`explorer.exe ${shellPath}`, {
          shell: true,
          detached: true,
          stdio: "ignore",
        });
        child.unref();
        return {
          stdout: `Opened via explorer: ${shellPath}`,
          stderr: "",
          exitCode: 0,
        };
      }

      // For all other background commands (servers, CLI tools like `code`, protocols)
      // just spawn detached and return immediately
      const child = spawn(cmd, {
        shell: true,
        detached: true,
        stdio: "ignore",
      });
      child.unref();
      return {
        stdout: `Started background process: ${cmd}`,
        stderr: "",
        exitCode: 0,
      };
    } catch (error: any) {
      console.log(`\x1b[31m[EXECUTE COMMANDER] ERROR: ${error.message}`);
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
      {
        timeout: timeoutMs,
        shell: process.platform === "win32" ? "powershell.exe" : "/bin/bash",
      },
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

// Mocking your global variable context
export async function executeCmd_temp(
  cmd: string,
  args?: string[],
  timeoutMs: number = 30000,
  isDaemon: boolean = false,
): Promise<ExecutionResponse> {
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, {
        shell: "powershell.exe",
        detached: false,
        stdio: "ignore",
      });
      child.unref();
      child.on("close", () => {
        console.log("CHILD PROCESS CLOSED!");
      });
      return resolve({
        stdout: "Started Background process",
        stderr: "",
        exitCode: 0,
      });
    } catch (error: any) {
      console.log(`[EXECUTE COMMANDER] ERROR: ${error.message}`);
      return resolve({
        stdout: "",
        stderr: error.message,
        exitCode: 1,
      });
    }
  });
}

// Test Runner Execution
// (async () => {
//   // IMPORTANT: For opening visual applications like 'wt' that run independently,
//   // set isDaemon = true so it fires detached and doesn't get blocked by exec.
//   console.log("Launching Windows Terminal...");
//   const data = await executeCmd_temp(`code`, [], 1000, true);

//   console.log("STDOUT:", data.stdout);
//   console.log("STDERR:", data.stderr);
// })();
// toRunTestingFIle;
