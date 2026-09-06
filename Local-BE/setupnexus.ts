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
      execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: "ignore" });
      console.log(`[UNINSTALL] Deleted scheduled task: ${TASK_NAME}`);
    } catch {}

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
          execSync(`cmd.exe /c rmdir /s /q "${targetDir}"`, { stdio: "ignore" });
          console.log(`[UNINSTALL] Removed target directory: ${targetDir}`);
        } catch (e: any) {
          console.warn(
            `[UNINSTALL] Could not remove target directory immediately: ${e.message}`,
          );
        }
      } else {
        // Web UI / Installed mode: schedule detached PowerShell with cwd: os.tmpdir()
        const cleanScript = `
Start-Sleep -Seconds 2
Stop-Process -Name nexus -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
cmd.exe /c rmdir /s /q '${targetDir}'
if (Test-Path -LiteralPath '${targetDir}') {
  Start-Sleep -Seconds 2
  cmd.exe /c rmdir /s /q '${targetDir}'
}
`;
        const b64 = Buffer.from(cleanScript, "utf16le").toString("base64");

        const child = spawn(
          "powershell.exe",
          ["-NoProfile", "-WindowStyle", "Hidden", "-EncodedCommand", b64],
          {
            cwd: os.tmpdir(),
            detached: true,
            stdio: "ignore",
          },
        );
        child.unref();
        console.log(
          `[UNINSTALL] Scheduled directory removal via PowerShell: ${targetDir}`,
        );
      }
    }

    if (path.resolve(runningExe).toLowerCase().includes("nexus-uninstall")) {
      const tempParent = path.dirname(runningExe);
      spawn("cmd.exe", ["/c", `ping 127.0.0.1 -n 4 >nul & rmdir /s /q "${tempParent}"`], {
        cwd: os.tmpdir(),
        detached: true,
        stdio: "ignore",
      }).unref();
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

export const setupFirst = async (): Promise<boolean> => {
  try {
    if (process.argv.includes("--uninstall") || process.argv.includes("-u")) {
      if (!isRunningAsAdmin()) {
        console.log(
          "⚡ Elevation required to uninstall. Prompting for administrator rights...",
        );
        eleevateSelf();
        return false;
      }
      console.log("\n=======================================================");
      console.log("🗑️  Nexus Uninstaller");
      console.log("=======================================================");
      await uninstallNexus();
      await countdownAndExit(3);
      return false;
    }

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
    const isDev = path.basename(runningExe).toLowerCase() === "node.exe";

    // In development mode (tsx watch / node), skip installer lifecycle and run server
    if (isDev) {
      return true;
    }

    const isRunningAsInstalled =
      path.resolve(runningExe).toLowerCase() ===
      path.resolve(targetExe).toLowerCase();

    // If running directly as the installed application, continue running the server
    if (isRunningAsInstalled) {
      return true;
    }

    // --- FROM THIS POINT ON: Running as the external / downloaded setup .exe ---

    const isAlreadyInstalled = fs.existsSync(targetExe) && isTaskRegistered();

    if (isAlreadyInstalled) {
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

    // 3. Register task in Windows Task Scheduler to run elevated on logon
    const silentVbsPath = path.join(targetDir, "run_silent.vbs");
    const vbsContent = [
      'Set objShell = CreateObject("WScript.Shell")',
      `objShell.Run """${targetExe}""", 0, False`,
      "Set objShell = Nothing",
    ].join("\r\n");
    fs.writeFileSync(silentVbsPath, vbsContent, "utf-8");
    const taskCmd = `wscript.exe \\"${silentVbsPath}\\"`;
    execSync(
      `schtasks /create /tn "${TASK_NAME}" /tr "${taskCmd}" /sc onlogon /rl highest /f`,
      { stdio: "ignore" },
    );
    console.log(`[SETUP] Registered elevated task: ${TASK_NAME}`);
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
