import fs from "fs";
import path from "path";
import os from "os";
import { exec, spawn } from "child_process";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const isDev = path.basename(runningExe).toLowerCase() === "node.exe";

    if (fs.existsSync(targetDir)) {
      if (isDev) {
        try {
          fs.rmSync(targetDir, { recursive: true, force: true });
          console.log(`[UNINSTALL] Removed target directory: ${targetDir}`);
        } catch (e: any) {
          console.warn(
            `[UNINSTALL] Could not remove target directory immediately: ${e.message}`,
          );
        }
      } else {
        // In production Windows binary: schedule self-deletion after process exit
        const cleanupCmd = `timeout /t 2 /nobreak > NUL & taskkill /f /im nexus.exe > NUL 2>&1 & rmdir /s /q "${targetDir}"`;
        const child = spawn("cmd.exe", ["/c", cleanupCmd], {
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

export const setupFirst = async (): Promise<boolean> => {
  try {
    if (process.argv.includes("--uninstall") || process.argv.includes("-u")) {
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

    const isAlreadyInstalled =
      fs.existsSync(targetExe) && fs.existsSync(vbsPath);

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

    // 3. Create run_nexus.vbs in Startup folder for silent background boot
    if (!fs.existsSync(startupDir)) {
      fs.mkdirSync(startupDir, { recursive: true });
    }

    const vbsContent = [
      'Set objShell = CreateObject("WScript.Shell")',
      `objShell.Run """${targetExe}""", 0, False`,
      "Set objShell = Nothing",
    ].join("\r\n");

    fs.writeFileSync(vbsPath, vbsContent, "utf-8");
    console.log(`[SETUP] Created background startup script at: ${vbsPath}`);

    // 4. Launch the installed app in the background
    exec(`wscript.exe "${vbsPath}"`);
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
