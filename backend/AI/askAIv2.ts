// import { connectDB } from "../db/connectDB.js";
// import { commandParser } from "./Parsers.js";
// import { ChatMessageType, commandParserType, GeminiResponse } from "./Types.js";
// import { CommandTypes } from "./Types/ParserTypes.js";
// connectDB();
// const tempMessage: ChatMessageType[] = [
//   {
//     role: "User",
//     content: "Help me to run echo hello world!",
//   },
// ];
// type TestingCMDType = {
//   content: {
//     cmd: commandParserType;
//     msg: string;
//     workingon: string;
//   };
//   success: boolean;
// };
// const askAI = async (session: string) => {
//   let success = false;
//   let retries = 0;
//   let cmd = "";
//   const geminiResponse: TestingCMDType = {
//     content: {
//       cmd: {
//         action: "memory_read",
//         param: { alias: "", value: "", category: "app" },
//         timeout: 5000,
//       },
//       msg: "Running command: echo hello world!",
//       workingon: "executing command echo hello world!",
//     },
//     success: true,
//   };
//   let cmdData: CommandTypes = geminiResponse.content.cmd;
//   console.log("Passing ,cmdData: ", cmdData);
//   console.log("Passing ,session: ", session);
//   while (cmdData && retries < 1) {
//     const cmdResponse: commandParserType = await commandParser(
//       cmdData,
//       "session",
//       tempMessage,
//     );
//     console.log("CMD RESPONSE: ", cmdResponse);
//     retries++;
//     if (cmdResponse.isSuccess) {
//       cmdData = cmdResponse.cmd;
//     }
//   }

import { Readline } from "readline/promises";
import { appendHistory, getHistory } from "./LocalChatHistory.js";
import { commandParser } from "./Parsers.js";
import { ChatMessageType, commandParserType } from "./Types.js";
import {
  CommandParserResponseType,
  CommandTypes,
} from "./Types/ParserTypes.js";
import readline from "readline";
import * as readlinePromises from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { callAI } from "./CallAI.js";
import { broadCastMessage } from "../services/websocket.service.js";
//   const aiMessage: ChatMessageType = {
//     role: "assistant",
//     content: JSON.stringify(geminiResponse.content),
//   };
//   tempMessage.push(aiMessage);
//   // console.log(tempMessage);
// };
// await askAI("session_testing");

export const askAI = async (session: string, userMessage: string) => {
  let retries = 0;
  let success = false;
  let aiResponse: any = null;
  let command: string = "";
  let terminalOutput = "";
  let terminalError = "";
  let capturedImage = "";
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

  while (retries <= 5) {
    console.log("TURN: ", retries + 1);
    const ChatMsgs: ChatMessageType[] = [...chatHistory, ...commandRunningMsgs];
    //Broadcasting here...
    console.log("BROADCASTING: Nexus is thinking...");
    broadCastMessage({
      type: "ai_data",
      data: {
        workingon: "Nexus is thinking...",
        msg: "",
        cmd: command || "",
      },
    });
    try {
      aiResponse = await callAI("gemini", {
        chatMessages: ChatMsgs,
        session: session,
        isJson: true,
      });

      commandRunningMsgs.push({
        role: "assistant",
        content: JSON.stringify(aiResponse.rawContent),
      });

      console.log("AI RESPONSE: ", aiResponse);
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

const test = async () => {
  // 1. Create a readline promise interface instance
  const rl = readlinePromises.createInterface({ input, output });
  let isExit = false;

  try {
    while (!isExit) {
      // 2. Await user response using the interface instance
      const userInput = await rl.question("You: ");

      // 3. Check for exit signal right away
      if (userInput.trim().toLowerCase() === "exit") {
        isExit = true;
        break;
      }

      const result: any = await askAI("session_testing", userInput);
      console.log("Nexus: " + result.msg);
      console.log("Terminal Output: " + result.terminalOutput);
      console.log("Terminal Error: " + result.terminalError);
      console.log("Image Base64: " + result.imageBase64);
      console.log("-----------------------------------\n");
    }
  } catch (error) {
    console.error("An error occurred during runtime:", error);
  } finally {
    // 4. Always close the stream to release terminal control
    rl.close();
    console.log("Session ended clean.");
  }
};

// test();
