import { spawn, spawnSync } from "child_process";
import os from "os";
type executeParam = {
  action: string;
  param: string;
  timeout: number;
  isDaemon: boolean;
};

export const executeCommand = async (cmd: executeParam) => {
  const actualCmd = typeof cmd === "string" ? JSON.parse(cmd) : cmd;
  const action = actualCmd.action;
  const param = actualCmd.param;
  const timeout = actualCmd.timeout;
  const isDaemon = actualCmd.isDaemon;
  const child = spawn(param, [], {
    shell: true,
  });
  child.stdout.on("data", (data) => {
    console.log(data.toString());
  });
  child.stderr.on("data", (data) => {
    console.log(data.toString());
  });
  child.on("close", (code) => {
    console.log(`Child process exited with code ${code}`);
  });
  // console.log("[EXECUTE COMMANDER]:", actualCmd);

  // if (isDaemon) {
  //   const child = spawn(action, [""], {
  //     shell: true,
  //     detached: true,
  //     stdio: "ignore",
  //   });
  //   child.on("spawn", () => {
  //     console.log("[EXECUTE COMMANDER] Spawned background process:", cmd);
  //   });
  //   child.on("error", (error) => {
  //     console.log("[EXECUTE COMMANDER] Error:", error);
  //   });
  //   child.on("close", (code) => {
  //     console.log(`[EXECUTE COMMANDER] Process exited with code: ${code}`);
  //   });
  //   child.unref();
  //   return;
  // }
};
