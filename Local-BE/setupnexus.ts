import { exec, execSync } from "child_process";
import os from "os";
import path from "path";
import { runCommand } from "./controllers/cmd.controller";
const setupFirst = async () => {
  //   const CONFIG_DIR = process.env.APPDATA
  //     ? path.join(process.env.APPDATA, "Nexus")
  //     : path.join(os.homedir(), ".nexus");
  //   const DEVICE_TOKEN_PATH = path.join(CONFIG_DIR, "deviceToken.json");
  //   console.log("CONFIG_DIR: ", CONFIG_DIR);
  //   console.log("DEVICE_TOKEN_PATH: ", DEVICE_TOKEN_PATH);
  //   const result: any = (
  //     await runCommand("in_built", `cd ${os.homedir()} && cd`, 1000)
  //   ).terminalOutput;
  const homeDir = os.homedir();

  exec(`powershell "cd ${homeDir} ; dir"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }

    console.log(os.homedir());
    console.log(stdout); // The output lives here
  });
};

setupFirst();
