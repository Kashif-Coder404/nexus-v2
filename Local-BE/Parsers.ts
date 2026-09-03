import { executeCmd, ExecutionResponse } from "./services/execute.service";
import {
  nexusSmartSearch,
  nexusSmartSearchApp,
} from "./services/search.service";
import getSystemInfo from "./Tools/getSystemInfo";
import { imageCapture } from "./Tools/takeScreenShot";
import { ChatMessageType } from "./Types";
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
    msg: "No command Runs!",
    terminalOutput: "",
    terminalError: "",
    isSuccess: false,
    imageBase64: undefined,
    exitCode: undefined,
  };
  const commandHandlerDict = {
    search: async () => {
      const { path, expected_name, extension, isDeepSearch, type } =
        (cmd.param as ParametersType<"search">) || {};
      if (!expected_name) {
        finalResponse.msg = "Missing parameters: expected_name is required";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.isSuccess = false;
        return;
      }
      const isGlobal = !path || isDeepSearch === true;
      const searchResults = await nexusSmartSearch(
        path || "",
        expected_name,
        type || "all",
        extension || "",
        isGlobal,
        isDeepSearch ?? false,
        10,
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(searchResults);
      finalResponse.terminalError = "";
      finalResponse.isSuccess =
        Array.isArray(searchResults) && searchResults.length > 0;
    },
    search_app: async () => {
      const { isDeepSearch, name, extension, extention } =
        (cmd.param as ParametersType<"search_app">) || {};
      if (!name) {
        finalResponse.msg = "Missing parameters: name is required";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.isSuccess = false;
        return;
      }
      const targetExt = extension || extention || "";
      const results = await nexusSmartSearchApp(
        name,
        !!isDeepSearch,
        10,
        targetExt,
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(results);
      finalResponse.terminalError = "";
      finalResponse.isSuccess = Array.isArray(results) && results.length > 0;
    },
    system_info: async () => {
      const sysInfo = await getSystemInfo();
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = sysInfo.info || "";
      finalResponse.terminalError = sysInfo.error || "";
      finalResponse.isSuccess = sysInfo.success;
    },
    capture_screen: async () => {
      const imageCaptureResponse = await imageCapture();
      finalResponse.cmd = returningCmd;
      finalResponse.msg =
        imageCaptureResponse?.msg || "Error on Capturing Image";
      finalResponse.terminalOutput = imageCaptureResponse.success
        ? JSON.stringify({
            msg: imageCaptureResponse.msg,
            success: imageCaptureResponse.success,
          })
        : "";
      finalResponse.terminalError = "";
      finalResponse.isSuccess = imageCaptureResponse.success;
      finalResponse.imageBase64 =
        imageCaptureResponse.success && imageCaptureResponse.data
          ? imageCaptureResponse.data.toString("base64")
          : undefined;
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
  const matchedKey: string = cmd.action;
  if (commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]) {
    await commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]();
  }
  return finalResponse;
};
