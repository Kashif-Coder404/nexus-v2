import fs from "fs";
import path from "path";
import os from "os";
import { exec, execSync, execFileSync, spawn, spawnSync } from "child_process";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TASK_NAME = "NexusBackgroundService";
const isRunningAsAdmin = () => {
  try {
    execSync("net session", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const addDirToUserPath = (dirPath: string) => {
  try {
    const psCmd = `
      $dir = '${dirPath}';
      $current = [Environment]::GetEnvironmentVariable('Path', 'User');
      $parts = ($current -split ';').Where({ $_.Trim() -ne '' });
      if ($parts -notcontains $dir) {
        $newPath = ($parts + $dir) -join ';';
        [Environment]::SetEnvironmentVariable('Path', $newPath, 'User');
      }
    `.replace(/\r?\n/g, " ");
    spawnSync("powershell.exe", ["-NoProfile", "-Command", psCmd], {
      stdio: "ignore",
    });
    console.log(`[SETUP] Added ${dirPath} to User PATH.`);
  } catch (err: any) {
    console.warn(`[SETUP] Could not add to PATH: ${err.message}`);
  }
};

const removeDirFromUserPath = (dirPath: string) => {
  try {
    const psCmd = `
      $dir = '${dirPath}'.TrimEnd('\\');
      $current = [Environment]::GetEnvironmentVariable('Path', 'User');
      $parts = ($current -split ';').Where({ $_.Trim() -ne '' -and $_.TrimEnd('\\') -ne $dir });
      $newPath = $parts -join ';';
      [Environment]::SetEnvironmentVariable('Path', $newPath, 'User');
    `.replace(/\r?\n/g, " ");
    spawnSync("powershell.exe", ["-NoProfile", "-Command", psCmd], {
      stdio: "ignore",
    });
    console.log(`[UNINSTALL] Removed ${dirPath} from User PATH.`);
  } catch (err: any) {
    console.warn(`[UNINSTALL] Could not remove from PATH: ${err.message}`);
  }
};

const eleevateSelf = () => {
  const args = process.argv
    .slice(1)
    .map((arg) => `"${arg}"`)
    .join(" ");
  const psCommand = `Start-Process -FilePath "${process.execPath}" -ArgumentList '${args}' -Verb RunAs`;
  try {
    spawnSync("powershell.exe", ["-NoProfile", "-Command", psCommand], {
      stdio: "inherit",
    });
  } catch (err: any) {
    console.log(err.message);
  }
  process.exit(0);
};
const isTaskRegistered = (): boolean => {
  try {
    execSync(`schtasks /query /tn "${TASK_NAME}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
async function countdownAndExit(seconds: number = 5) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(
      `\r⏳ Closing this window in ${i} second${i > 1 ? "s" : ""}... `,
    );
    await sleep(1000);
  }
  console.log("\nDone.");
  process.exit(0);
}

export const uninstallNexus = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log("[UNINSTALL] Starting Nexus uninstallation...");

    const localAppData =
      process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const targetDir = path.join(localAppData, "Programs", "Nexus");

    const appData =
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const startupDir = path.join(
      appData,
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs",
      "Startup",
    );
    const vbsPath = path.join(startupDir, "run_nexus.vbs");

    const configDir = path.join(appData, "Nexus");
    const dotNexusDir = path.join(os.homedir(), ".nexus");
    const localDevToken = path.join(process.cwd(), "dist", "deviceToken.json");

    // 1. Remove background startup VBS script
    if (fs.existsSync(vbsPath)) {
      fs.unlinkSync(vbsPath);
      console.log(`[UNINSTALL] Deleted startup script: ${vbsPath}`);
    }
    // Stop and delete the scheduled task
    try {
      execSync(`schtasks /end /tn "${TASK_NAME}"`, { stdio: "ignore" });
    } catch {}
    try {
      execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: "ignore" });
      console.log(`[UNINSTALL] Deleted scheduled task: ${TASK_NAME}`);
    } catch {}

    // Clean up User PATH entry
    removeDirFromUserPath(targetDir);

    // 2. Remove configuration and device credentials
    if (fs.existsSync(configDir)) {
      fs.rmSync(configDir, { recursive: true, force: true });
      console.log(`[UNINSTALL] Deleted configuration directory: ${configDir}`);
    }
    if (fs.existsSync(dotNexusDir)) {
      fs.rmSync(dotNexusDir, { recursive: true, force: true });
      console.log(`[UNINSTALL] Deleted directory: ${dotNexusDir}`);
    }
    if (fs.existsSync(localDevToken)) {
      fs.unlinkSync(localDevToken);
      console.log(`[UNINSTALL] Deleted dev token: ${localDevToken}`);
    }

    // 3. Delete installed executable and folder
    const runningExe = process.execPath;
    const isRunningFromTarget = path
      .resolve(runningExe)
      .toLowerCase()
      .startsWith(path.resolve(targetDir).toLowerCase());

    if (fs.existsSync(targetDir)) {
      if (!isRunningFromTarget) {
        // CLI / External mode: kill background nexus processes (excluding this process) and delete directly
        try {
          const killCmd = `Get-Process -Name nexus -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne ${process.pid} } | Stop-Process -Force`;
          spawnSync("powershell.exe", ["-NoProfile", "-Command", killCmd], {
            stdio: "ignore",
          });
        } catch {}
        await sleep(500);
        try {
          execSync(`cmd.exe /c rmdir /s /q "${targetDir}"`, {
            stdio: "ignore",
          });
          console.log(`[UNINSTALL] Removed target directory: ${targetDir}`);
        } catch (e: any) {
          console.warn(
            `[UNINSTALL] Could not remove target directory immediately: ${e.message}`,
          );
        }
      } else {
        // Installed mode: Write self-deleting helper batch file in temp directory with retry loop
        const batPath = path.join(os.tmpdir(), "nexus_uninstall.bat");
        const batContent = [
          "@echo off",
          ":: Wait for nexus.exe to exit completely",
          "ping 127.0.0.1 -n 4 >nul",
          "taskkill /f /im nexus.exe >nul 2>&1",
          "set /a attempts=0",
          ":retry",
          `rmdir /s /q "${targetDir}" >nul 2>&1`,
          `if exist "${targetDir}" (`,
          "    set /a attempts+=1",
          "    if %attempts% lss 10 (",
          "        ping 127.0.0.1 -n 2 >nul",
          "        taskkill /f /im nexus.exe >nul 2>&1",
          "        goto retry",
          "    )",
          ")",
          'del "%~f0"',
        ].join("\r\n");

        fs.writeFileSync(batPath, batContent, "utf-8");

        const child = spawn("cmd.exe", ["/c", batPath], {
          cwd: os.tmpdir(),
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        });
        child.unref();

        console.log(`[UNINSTALL] Scheduled directory removal: ${targetDir}`);
      }
    }

    console.log("[UNINSTALL] Uninstallation completed successfully.");
    return {
      success: true,
      message: "Nexus has been completely uninstalled from this PC.",
    };
  } catch (error: any) {
    console.error("[UNINSTALL ERROR]", error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};
export const isAlreadyRunning = async () => {
  try {
    const alreadyRunningCheckCommand = `tasklist /fi "ImageName eq nexus.exe" /fo csv /nh `;
    const output = execSync(alreadyRunningCheckCommand, {
      encoding: "utf-8",
    });
    if (output.includes("INFO: No tasks")) {
      return false;
    }
    const lines = output.trim().split(/\r?\n/).filter(Boolean);
    const otherInstances = lines.filter((line) => {
      const parts = line.split(",");
      if (parts.length >= 2) {
        const pid = parseInt(parts[1].replace(/"/g, "").trim(), 10);
        return pid !== process.pid;
      }
      return false;
    });
    return otherInstances.length > 0;
  } catch (error) {
    console.log("Error while checking running process: ", error);
    return false;
  }
};
export const stopServer = async () => {
  try {
    if (!(await isAlreadyRunning())) {
      return { success: false, msg: "Server is Already Stopped!" };
    }
    try {
      execSync(`schtasks /end /tn "${TASK_NAME}"`, { stdio: "ignore" });
    } catch {}

    // 1. Try normal termination first (fast, no UAC prompt)
    const killCmd = `Get-Process -Name nexus -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne ${process.pid} } | Stop-Process -Force`;
    spawnSync("powershell.exe", ["-NoProfile", "-Command", killCmd], {
      stdio: "ignore",
    });

    // 2. Check if nexus is still running (e.g. if it was started elevated)
    if (await isAlreadyRunning()) {
      const elevateKill = `Start-Process cmd.exe -ArgumentList '/c taskkill /f /im nexus.exe' -Verb RunAs -WindowStyle Hidden -Wait`;
      spawnSync("powershell.exe", ["-NoProfile", "-Command", elevateKill]);
    }

    // 3. Final check
    if (await isAlreadyRunning()) {
      return {
        success: false,
        msg: "Failed to stop server: Access Denied. Please run terminal as Administrator.",
      };
    }

    return { success: true, msg: "Stopped the server" };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};
export const disableServiceAndStopServer = async () => {
  execSync(
    `powershell -Command "Start-Process wt -ArgumentList '-p \\"Command Prompt\\" cmd /c taskkill /f /im nexus.exe' -Verb runAs"`,
  );
};

export const setupFirst = async (): Promise<boolean> => {
  const checkIsInstalled = async (targetExe: string): Promise<boolean> => {
    return fs.existsSync(targetExe) && isTaskRegistered();
  };
  try {
    const localAppData =
      process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const targetDir = path.join(localAppData, "Programs", "Nexus");
    const targetExe = path.join(targetDir, "nexus.exe");

    const startupDir = path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs",
      "Startup",
    );
    const vbsPath = path.join(startupDir, "run_nexus.vbs");

    const runningExe = process.execPath;
    const silentVbsPath = path.join(targetDir, "run_silent.vbs");
    const vbsContent = [
      'Set objShell = CreateObject("WScript.Shell")',
      `objShell.Run """${targetExe}"" --background", 0, False`,
      "Set objShell = Nothing",
    ].join("\r\n");
    const isDev = path.basename(runningExe).toLowerCase() === "node.exe";

    if (process.argv.includes("--uninstall") || process.argv.includes("-u")) {
      if (!isRunningAsAdmin()) {
        console.log(
          "⚡ Elevation required to uninstall. Prompting for administrator rights...",
        );
        eleevateSelf();
        return false;
      }
      console.log("\n=======================================================");
      console.log("🗑️  Nexus Uninstaller ");
      console.log("=======================================================");
      await uninstallNexus();
      console.log("\nDone.");
      process.exit(0);
    }
    // STOP SERVER
    if (process.argv.includes("--stop-server")) {
      console.log("\x1b[33m\x1b[1mStopping Nexus...\x1b[0m");
      const res = await stopServer();
      if (!res.success) {
        console.log(`\x1b[31m\x1b[1m${res.msg}\x1b[0m`);
      } else {
        console.log(`\x1b[32m\x1b[1m${res.msg}\x1b[0m`);
      }
      await countdownAndExit(3);
      return false;
    }
    // Background Run

    if (process.argv.includes("--background")) {
      return true;
    }

    // START SERVER
    if (process.argv.includes("--start-server")) {
      if (isDev) {
        if (await isAlreadyRunning()) {
          console.log("\x1b[34m\x1b[1mNexus is already running!\x1b[0m");
          return false;
        }
        console.log("\x1b[32m\x1b[1mStarting Nexus in dev mode...\x1b[0m");
        return true;
      }
      if (!(await checkIsInstalled(targetExe))) {
        console.log("\x1b[31m\x1b[1mNexus is not installed yet!\x1b[0m");
        console.log("Please run the installer to set up Nexus first.");
        await countdownAndExit(3);
        return false;
      }
      if (await isAlreadyRunning()) {
        console.log("\x1b[34m\x1b[1mNexus is already running!\x1b[0m");
        await countdownAndExit(2);
        return false;
      }

      console.log("\x1b[32m\x1b[1mStarting Nexus service...\x1b[0m");

      try {
        if (fs.existsSync(silentVbsPath)) {
          spawn("wscript.exe", [silentVbsPath], {
            detached: true,
            stdio: "ignore",
          }).unref();
        } else {
          execSync(`schtasks /run /tn "${TASK_NAME}"`, { stdio: "ignore" });
        }
        console.log(
          "\x1b[32m\x1b[1mNexus service started successfully!\x1b[0m",
        );
      } catch (err: any) {
        console.error(
          "\x1b[31m\x1b[1mFailed to start Nexus service! Try to Reboot PC\x1b[0m",
          err.message,
        );
      }
      await countdownAndExit(2);
      return false;
    }

    // In development mode (tsx watch / node), skip installer lifecycle and run server
    if (isDev) {
      return true;
    }

    const isRunningAsInstalled =
      path.resolve(runningExe).toLowerCase() ===
      path.resolve(targetExe).toLowerCase();

    // If running directly as the installed application, continue running the server
    if (isRunningAsInstalled) {
      console.log("\n=======================================================");
      console.log("⚡ Nexus CLI");
      console.log("=======================================================");
      console.log("Usage:");
      console.log("  nexus --start-server   Start the background server");
      console.log("  nexus --stop-server    Stop the running server");
      console.log("  nexus --uninstall      Uninstall Nexus from this PC");
      console.log("=======================================================\n");
      return false; // Free the terminal immediately
    }

    // --- FROM THIS POINT ON: Running as the external / downloaded setup .exe ---

    const isAlreadyInstalled = await checkIsInstalled(targetExe);

    if (isAlreadyInstalled) {
      addDirToUserPath(targetDir);
      console.log("\n=======================================================");
      console.log("⚡ Nexus is already installed and setup is complete!");
      console.log(`📁 Installed at: ${targetExe}`);
      console.log("🚀 It runs automatically in the background on startup.");
      console.log("✅ You can safely close or delete this downloaded file.");
      console.log("✅ Restart Needed for changes to take effect!");
      console.log("=======================================================\n");

      await countdownAndExit(5);
      return false;
    }
    if (!isRunningAsAdmin()) {
      console.log(
        "⚡ Elevation required. Prompting for administrator rights...",
      );
      eleevateSelf();
      return false;
    }
    // First-time setup: Perform installation
    console.log("\n=======================================================");
    console.log("🚀 Setting up Nexus on your PC for the first time...");
    console.log("=======================================================");

    // 1. Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 2. Copy current executable into target directory
    fs.copyFileSync(runningExe, targetExe);
    console.log(`[SETUP] Copied nexus.exe to: ${targetExe}`);

    // Add Nexus to User PATH so CLI commands work from anywhere
    addDirToUserPath(targetDir);

    // 3. Register task in Windows Task Scheduler on logon

    fs.writeFileSync(silentVbsPath, vbsContent, "utf-8");
    const taskCmd = `wscript.exe \\"${silentVbsPath}\\"`;
    execSync(
      `schtasks /create /tn "${TASK_NAME}" /tr "${taskCmd}" /sc onlogon /f`,
      { stdio: "ignore" },
    );
    console.log(`[SETUP] Registered task: ${TASK_NAME}`);
    // Clean up any legacy VBS startup script if present
    if (fs.existsSync(vbsPath)) {
      try {
        fs.unlinkSync(vbsPath);
      } catch {}
    }
    // 4. Launch the installed app in the background immediately
    execSync(`schtasks /run /tn "${TASK_NAME}"`, { stdio: "ignore" });
    console.log("[SETUP] Started Nexus background service.");

    console.log("\n=======================================================");
    console.log("🎉 Setup is done! Nexus is now running in the background.");
    console.log("✅ You can safely close this terminal window.");
    console.log("=======================================================\n");

    await countdownAndExit(5);
    return false;
  } catch (error: any) {
    console.error(
      `\n[SETUP ERROR] An error occurred during setup: ${error.message}`,
    );
    return true; // Fallback: allow server to continue if error
  }
};
// (async () => {
//   await disableServiceAndStopServer();
// })();
