import { appendHistory, getHistory } from "./LocalChatHistory.js";
import { commandParser } from "./Parsers.js";
import { ChatMessageType } from "./Types.js";
import {
  CommandParserResponseType,
  CommandTypes,
} from "./Types/ParserTypes.js";
import * as readlinePromises from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { callAI } from "./CallAI.js";
import { broadCastMessage } from "../services/websocket.service.js";
import {
  behaviourInstructions,
  behaviourPrompt,
} from "./instructions/behaviour.instructions.js";
import { instructions } from "./instructions/main.Instructions.js";

export const askAI = async (
  session: string,
  userMessage: string,
  behaviour: string,
) => {
  let retries = 0;
  let aiResponse: any = null;
  let command: string = "";
  let terminalOutput = "";
  let terminalError = "";
  let capturedImage = "";
  let success = false;
  let isSuccessState = false;
  let workingOn = "";

  const prevChat: ChatMessageType[] = await getHistory(session, 10);
  const summaryChat: ChatMessageType[] = await getHistory(
    `summary_${session}`,
    1,
  );
  let chatHistory: ChatMessageType[] = [
    ...summaryChat,
    ...prevChat,
    {
      role: "user",
      content: userMessage,
    },
  ];
  let commandRunningMsgs: ChatMessageType[] = [];

  while (retries <= 10) {
    const ChatMsgs: ChatMessageType[] = [...chatHistory, ...commandRunningMsgs];
    //Broadcasting here...
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: "Nexus is thinking...",
        msg: "",
        cmd: command || "",
      },
    });
    try {
      let currentMainInstructions: string =
        behaviourPrompt(behaviour) + "\n" + instructions;

      aiResponse = await callAI("gemini", {
        chatMessages: ChatMsgs,
        session: session,
        instructions: currentMainInstructions,
        isJson: true,
      });

      commandRunningMsgs.push({
        role: "assistant",
        content: JSON.stringify(aiResponse.rawContent),
      });

      workingOn = aiResponse.workingOn || "";
      console.log("BROADCASTING: ", workingOn);
      broadCastMessage({
        type: "ai_data",
        data: {
          workingon: workingOn,
          msg: "Nexus is thinking...",
          cmd: command || "",
        },
      });
      const actualContent = aiResponse;
      if (
        actualContent.cmd == null ||
        String(actualContent.cmd).trim() === "" ||
        (typeof actualContent.cmd === "object" && !actualContent.cmd.action)
      ) {
        command = "";
        break;
      }
      if (typeof actualContent.cmd === "object" && actualContent.cmd.action) {
        command = JSON.stringify(actualContent.cmd);
      } else if (typeof actualContent.cmd === "string") {
        command = actualContent.cmd;
      } else {
        command = "";
      }
      if (command) {
        const commandOutput: CommandParserResponseType = await commandParser(
          JSON.parse(command) as CommandTypes,
          session,
          ChatMsgs,
        );
        //Settting variables
        capturedImage = commandOutput.imageBase64 || "";
        terminalOutput += commandOutput.terminalOutput
          ? commandOutput.terminalOutput + "\n"
          : "";

        let currentError = commandOutput.terminalError || "";

        if (
          commandOutput.exitCode !== undefined &&
          commandOutput.exitCode !== null
        ) {
          currentError += currentError
            ? commandOutput.exitCode
              ? `\nEXIT CODE: ${commandOutput.exitCode}`
              : ""
            : commandOutput.exitCode
              ? `EXIT CODE: ${commandOutput.exitCode}`
              : "";
        }
        terminalError += currentError ? currentError + "\n" : "";
        command = commandOutput.cmd || commandOutput.msg || "";
        isSuccessState = commandOutput.isSuccess;
        success = commandOutput.isSuccess;
        const feedbackContent: any = {
          status: isSuccessState ? "success" : "failed",
          command_executed: command || "",
          terminal_output: terminalOutput || "No output",
          terminal_error: terminalError || "",
        };
        commandRunningMsgs.push({
          role: "user",
          content: JSON.stringify(feedbackContent, null, 2),
        });
      }
    } catch (error: any) {
      terminalError += `\nRuntime Error: ${error.message}`;
      isSuccessState = false;
      commandRunningMsgs.push({
        role: "user",
        content: JSON.stringify(
          {
            status: "failed",
            command_executed: command || "",
            terminal_output: terminalOutput || "No output",
            terminal_error: terminalError || "",
          },
          null,
          2,
        ),
      });
    }
    retries++;
  }

  const finalTurnSave: ChatMessageType[] = [
    { role: "user", content: userMessage },
    {
      role: "assistant",
      content: JSON.stringify({
        cmd: command || "",
        msg: aiResponse?.msg || "API CALL NO OUTPUT AS A MESSAGE!",
        terminalError: terminalError || "",
        terminalOutput: terminalOutput || "",
      }),
    },
  ];

  await appendHistory(finalTurnSave, session);
  if (retries >= 5) {
    return {
      cmd: command || "",
      msg: "Maximum try reached!",
      terminalOutput: terminalOutput || "",
      terminalError: terminalError || "",
      imageBase64: capturedImage || "",
    };
  }
  return {
    cmd: command || "",
    msg: aiResponse.msg || "",
    terminalOutput: terminalOutput || "",
    terminalError: terminalError || "",
    imageBase64: capturedImage || "",
  };
};
