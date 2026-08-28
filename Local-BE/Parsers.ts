import { executeCmd, ExecutionResponse } from "./services/execute.service";
import { search, search_app } from "./services/search.service";
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
      const { path, expected_name, extension } =
        cmd.param as ParametersType<"search">;
      if (!expected_name) {
        finalResponse.msg = "Missing parameters";
        finalResponse.terminalError = "Missing parameters";
        finalResponse.isSuccess = false;
        return;
      }
      const searchResults = await search(path, expected_name, extension);
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = JSON.stringify(
        searchResults.results || searchResults,
      );
      finalResponse.terminalError = "";
      finalResponse.isSuccess =
        searchResults.results && searchResults.results.length > 0;
    },
    search_app: async () => {
      const { isDeepSearch, name, extention } =
        cmd.param as ParametersType<"search_app">;
      const results: string = JSON.stringify(
        await search_app(isDeepSearch, name, extention),
      );
      finalResponse.cmd = returningCmd;
      finalResponse.msg = "";
      finalResponse.terminalOutput = results;
      finalResponse.terminalError = "";
      finalResponse.isSuccess = !!results && results !== "[[],[],[]]";
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
