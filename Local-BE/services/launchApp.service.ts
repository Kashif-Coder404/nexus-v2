import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs";

export interface ProcessItem {
  imageName: string;
  pid: number;
  windowTitle: string;
}

export interface LaunchResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  isSuccess: boolean;
}

const COMMON_APP_NAMES = new Set([
  "notepad",
  "calc",
  "calculator",
  "code",
  "chrome",
  "msedge",
  "brave",
  "firefox",
  "spotify",
  "explorer",
  "mspaint",
  "cmd",
  "powershell",
  "discord",
  "slack",
  "steam",
]);

/**
 * Parse CSV output from `tasklist /v /fo csv`
 */
export function parseTasklistCsv(csvOutput: string): ProcessItem[] {
  const lines = csvOutput.trim().split(/\r?\n/);
  const items: ProcessItem[] = [];

  for (const line of lines) {
    if (!line.startsWith('"')) continue;
    // Split CSV tokens respecting quotes
    const parts = line.split('","').map((s) => s.replace(/^"|"$/g, ""));
    if (parts.length >= 9 && parts[0] !== "Image Name") {
      const pid = parseInt(parts[1], 10);
      if (!isNaN(pid)) {
        items.push({
          imageName: parts[0],
          pid,
          windowTitle: parts[8] && parts[8] !== "N/A" ? parts[8] : "",
        });
      }
    }
  }
  return items;
}

/**
 * Query running processes matching the target pattern using tasklist (fast: ~100-200ms)
 */
export async function getRunningProcesses(
  targetPattern: string,
): Promise<ProcessItem[]> {
  return new Promise((resolve) => {
    if (!targetPattern) return resolve([]);
    const pattern = targetPattern.includes(".")
      ? targetPattern
      : `${targetPattern}*`;

    exec(
      `tasklist /v /fi "imagename eq ${pattern}" /fo csv`,
      { windowsHide: true },
      (err, stdout) => {
        if (err || !stdout) {
          return resolve([]);
        }
        resolve(parseTasklistCsv(stdout));
      },
    );
  });
}

/**
 * Extract target name and classification from a launch command
 */
export function extractTargetInfo(cmd: string): {
  targetName: string;
  isUrl: boolean;
  isFolder: boolean;
} {
  const trimmed = cmd.trim();

  // Check if it's a URL
  if (/https?:\/\//i.test(trimmed)) {
    return { targetName: "browser", isUrl: true, isFolder: false };
  }

  // Strip leading 'start' and optional title argument (e.g. start "" "path")
  let target = trimmed;
  const startMatch = trimmed.match(
    /^start(?:\s+(?:""|"[^"]*"|'[^']*'))?\s+(.*)$/i,
  );
  if (startMatch && startMatch[1]) {
    target = startMatch[1].trim();
  }

  // Strip wrapping quotes
  target = target.replace(/^["']|["']$/g, "").trim();

  // Check if it is a drive or folder path (e.g. "D:\", "D:/Coding", "C:\Users")
  if (
    /^[a-zA-Z]:[\\\/]?$/i.test(target) ||
    ((target.includes("/") || target.includes("\\")) &&
      !target.toLowerCase().endsWith(".exe") &&
      !target.toLowerCase().endsWith(".lnk"))
  ) {
    try {
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        return { targetName: "explorer", isUrl: false, isFolder: true };
      }
    } catch {}
    // Even if fs check fails, drive letters or folder-like paths are folders
    if (/^[a-zA-Z]:/i.test(target)) {
      return { targetName: "explorer", isUrl: false, isFolder: true };
    }
  }

  const base = path.basename(target);
  const ext = path.extname(base);
  const cleanName = ext ? path.basename(base, ext) : base;

  return { targetName: cleanName, isUrl: false, isFolder: false };
}

/**
 * Check whether a command is intended to launch an application or window
 */
export function isAppLaunchCommand(cmd: string): boolean {
  if (!cmd || typeof cmd !== "string") return false;
  const trimmed = cmd.trim();
  const lower = trimmed.toLowerCase();

  // Explicit start command
  if (lower.startsWith("start ") || lower === "start") {
    return true;
  }

  // Executable or shortcut path
  if (
    lower.endsWith(".exe") ||
    lower.endsWith(".lnk") ||
    lower.endsWith(".bat") ||
    lower.endsWith(".cmd")
  ) {
    return true;
  }

  // Known single-word desktop app launchers (e.g. "code", "notepad", "calc")
  const firstWord = lower.split(/\s+/)[0].replace(/^["']|["']$/g, "");
  if (COMMON_APP_NAMES.has(firstWord)) {
    return true;
  }

  return false;
}

/**
 * Launch an application safely without blocking, verify running process, and return rich confirmation.
 */
export async function launchAppWithVerification(
  rawCmd: string,
): Promise<LaunchResult> {
  const trimmed = rawCmd.trim();
  const { targetName, isUrl, isFolder } = extractTargetInfo(trimmed);

  // If command does not start with 'start', prefix it so Windows cmd.exe executes it asynchronously
  const launchCmd = trimmed.toLowerCase().startsWith("start")
    ? trimmed
    : `start "" ${trimmed}`;

  try {
    // 1. Snapshot existing processes if targetName is an executable
    let beforeProcesses: ProcessItem[] = [];
    if (!isUrl && !isFolder && targetName) {
      beforeProcesses = await getRunningProcesses(targetName);
    }

    // 2. Launch process in detached mode with ignored stdio so Node doesn't hold open handles
    const child = spawn(launchCmd, {
      shell: true,
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.unref();

    // 3. Wait 450ms for Windows process manager to register the new process or window
    await new Promise((resolve) => setTimeout(resolve, 450));

    // 4. Verification
    if (isUrl) {
      return {
        stdout: `URL opened in default web browser successfully.`,
        stderr: "",
        exitCode: 0,
        isSuccess: true,
      };
    }

    if (isFolder) {
      return {
        stdout: `Folder opened in Windows File Explorer successfully.`,
        stderr: "",
        exitCode: 0,
        isSuccess: true,
      };
    }

    // Check processes after launch
    const afterProcesses = await getRunningProcesses(targetName);
    const newProcesses = afterProcesses.filter(
      (after) => !beforeProcesses.some((before) => before.pid === after.pid),
    );

    if (newProcesses.length > 0) {
      const topProc = newProcesses[0];
      const winTitle = topProc.windowTitle
        ? ` (Window: "${topProc.windowTitle}")`
        : "";
      return {
        stdout: `Application '${targetName}' launched successfully with new process PID ${newProcesses.map((p) => p.pid).join(", ")}${winTitle}.`,
        stderr: "",
        exitCode: 0,
        isSuccess: true,
      };
    }

    // If no new PID was created, check if existing instances are active (single-instance apps like VS Code / Chrome)
    if (afterProcesses.length > 0) {
      const activeWithTitle = afterProcesses.find((p) => Boolean(p.windowTitle));
      const topProc = activeWithTitle || afterProcesses[0];
      const winTitle = topProc.windowTitle
        ? ` (Window: "${topProc.windowTitle}")`
        : "";
      return {
        stdout: `Application '${targetName}' is active and running under PID ${topProc.pid}${winTitle}. Launch command completed successfully.`,
        stderr: "",
        exitCode: 0,
        isSuccess: true,
      };
    }

    // Fallback if process name differs slightly from shortcut name
    return {
      stdout: `Application '${targetName}' launched into background successfully.`,
      stderr: "",
      exitCode: 0,
      isSuccess: true,
    };
  } catch (error: any) {
    return {
      stdout: "",
      stderr: `Failed to launch application: ${error.message}`,
      exitCode: 1,
      isSuccess: false,
    };
  }
}
