import { executeCmd, ExecutionResponse } from "./services/execute.service";
import { search, search_app } from "./services/search.service";
import { takeScreenshot } from "./Tools/takeScreenShot";
import getSystemInfo from "./Tools/getSystemInfo";
import {
  CommandParserResponseType,
  CommandTypes,
  ParametersType,
} from "./Types/ParserTypes";

export const commandParser = async (
  cmd: CommandTypes,
): Promise<CommandParserResponseType> => {
  const returningCmd: string = JSON.stringify(cmd);
  let finalResponse: CommandParserResponseType = {
    cmd: returningCmd,
    msg: "No command Runs! Please Provide: action, param, timeout",
    terminalOutput: "",
    terminalError: "",
    isSuccess: false,
    imageBase64: undefined,
    exitCode: undefined,
  };

  const commandHandlerDict = {
    system_info: async () => {
      try {
        const sysInfo = await getSystemInfo();
        finalResponse.cmd = returningCmd;
        finalResponse.msg = sysInfo.success
          ? "System info retrieved"
          : "Failed to retrieve system info";
        finalResponse.terminalOutput = sysInfo.info || "";
        finalResponse.terminalError = sysInfo.error || "";
        finalResponse.exitCode = sysInfo.success ? 0 : 1;
        finalResponse.isSuccess = sysInfo.success;
      } catch (err: any) {
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = err.message || String(err);
        finalResponse.exitCode = 1;
        finalResponse.isSuccess = false;
      }
    },
    search: async () => {
      const {
        path,
        expected_name = "",
        extension,
        isDeepSearch,
        type,
      } = (cmd.param as ParametersType<"search">) || {};

      if (!path && !expected_name) {
        finalResponse.msg =
          "Missing parameters: either path or expected_name is required";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.exitCode = 1;
        finalResponse.isSuccess = false;
        return;
      }

      try {
        const isGlobal = !path || isDeepSearch === true;
        const results = await search(
          path || "",
          expected_name,
          type || "all",
          extension || "",
          isGlobal,
          isDeepSearch ?? false,
          10,
        );
        finalResponse.cmd = returningCmd;
        finalResponse.msg = Array.isArray(results)
          ? `Found ${results.length} items`
          : "";
        finalResponse.terminalOutput = JSON.stringify(results);
        finalResponse.terminalError = "";
        finalResponse.exitCode = 0;
        finalResponse.isSuccess = Array.isArray(results) && results.length > 0;
      } catch (err: any) {
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = err.message || String(err);
        finalResponse.exitCode = 1;
        finalResponse.isSuccess = false;
      }
    },

    search_app: async () => {
      const { isDeepSearch, name, extension, extention } =
        (cmd.param as ParametersType<"search_app">) || {};

      if (!name) {
        finalResponse.msg = "Missing parameters: name is required";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.exitCode = 1;
        finalResponse.isSuccess = false;
        return;
      }

      try {
        const targetExt = extension || extention || "";
        const results = await search_app(name, !!isDeepSearch, 10, targetExt);
        finalResponse.cmd = returningCmd;
        finalResponse.msg = "";
        finalResponse.terminalOutput = JSON.stringify(results);
        finalResponse.terminalError = "";
        finalResponse.exitCode = 0;
        finalResponse.isSuccess = Array.isArray(results) && results.length > 0;
      } catch (err: any) {
        finalResponse.terminalOutput = "";
        finalResponse.terminalError = err.message || String(err);
        finalResponse.exitCode = 1;
        finalResponse.isSuccess = false;
      }
    },

    capture_screen: async () => {
      const { imageBuffer, success, error } = await takeScreenshot();
      finalResponse.cmd = returningCmd;
      finalResponse.msg = success
        ? "Screenshot Captured"
        : "Error capturing screenshot";
      finalResponse.terminalOutput = success ? "ScreenShot Captured" : "";
      finalResponse.terminalError = error || "";
      finalResponse.exitCode = success ? 0 : 1;
      finalResponse.imageBase64 =
        success && imageBuffer ? imageBuffer.toString("base64") : undefined;
      finalResponse.isSuccess = success;
    },

    in_built: async () => {
      const timeoutMs =
        cmd.timeout && !isNaN(Number(cmd.timeout))
          ? Number(cmd.timeout)
          : 30000;
      const executionResponse: ExecutionResponse = await executeCmd(
        (cmd.param as string) || "",
        timeoutMs,
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = executionResponse.stdout || "";
      finalResponse.terminalError = executionResponse.stderr || "";
      finalResponse.exitCode = executionResponse.exitCode;
      finalResponse.isSuccess = executionResponse.exitCode === 0;
    },
  };

  const matchedKey = cmd.action;
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    await commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]();
  }

  return finalResponse;
};
