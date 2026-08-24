import { executeCmd, ExecutionResponse } from "./services/execute.service";
import { takeScreenshot } from "./Tools/takeScreenShot";

export const commandParser = async (
  cmd: {
    action: string;
    param: string | Object;
    timeout: number | 5000;
  },
  session: string,
): Promise<any> => {
  const returningCmd: string = JSON.stringify(cmd);
  let finalResponse: any = {
    cmd: returningCmd,
    msg: "No command Runs! Please Provide: action , param , timeout",
    terminalOutput: "",
    terminalError: "",
    isSuccess: false,
    imageBase64: undefined,
    exitCode: undefined,
  };
  const commandHandlerDict = {
    capture_screen: async () => {
      const context: string = cmd.param as string;
      const { imageBuffer, success, error } = await takeScreenshot();
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = success ? "ScreenShot Captured" : "";
      finalResponse.terminalError = error;
      finalResponse.exitCode = success ? 0 : 1;
      finalResponse.imageBase64 = imageBuffer;
      finalResponse.isSuccess = success;
    },

    in_built: async () => {
      const timeoutMs =
        cmd.timeout && !isNaN(Number(cmd.timeout))
          ? Number(cmd.timeout)
          : 30000;
      const executionResponse: ExecutionResponse = await executeCmd(
        cmd.param as string,
        timeoutMs,
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = executionResponse.stdout;
      finalResponse.terminalError = executionResponse.stderr;
      finalResponse.exitCode = executionResponse.exitCode;
      finalResponse.isSuccess = executionResponse.exitCode === 0;
    },
  };
  // const matchedKey: string = cmd.trim().split("|")[0].trim();
  const matchedKey: string = cmd.action;
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    await commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]();
  }
  return finalResponse;
};
