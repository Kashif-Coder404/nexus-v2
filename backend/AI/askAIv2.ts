// import { broadCastMessage } from "../services/websocket.service.js";
// import { callAI } from "./CallAI.js";
// import { instructions } from "./instructions/main.Instructions.js";
// import { getHistory } from "./LocalChatHistory.js";
// import { commandParser } from "./Parsers.js";
// import { ChatMessageType } from "./Types.js";
// import { commandParserType, CommandTypes } from "./Types/ParserTypes.js";

// type MainAskAI = {
//   message: string;
//   session: string;
//   retries: number;
//   chatMessages?: ChatMessageType[];
//   accumulatedTerminal?: string;
//   accumulatedError?: string;
//   lastExecutedCmd?: string;
//   capturedImage?: string;
// };

// const askAI = async ({
//   message,
//   session,
//   retries = 0,
//   accumulatedTerminal = "",
//   accumulatedError = "",
//   lastExecutedCmd = "",
//   capturedImage = "",
// }: MainAskAI) => {
//   const MAX_LIMIT = 10;
//   const mainInstructions = instructions;
//   //Initial Setup
//   let ChatMessages: ChatMessageType[] = (await getHistory(session, 10)) || [];
//   if (ChatMessages.length > 0) {
//     ChatMessages = [
//       ...(await getHistory(`summary_${session}`, 1)),
//       ...ChatMessages,
//     ];
//   }
//   const CommandRunChatMessages = [
//     ...ChatMessages,
//     { role: "user", content: message },
//   ];
//   try {
//     //Sending request and getting response in a loop way
//     while (retries < MAX_LIMIT) {
//       //temp after sending Chatmessages...

//       const AIResponse: any = {
//         content: {
//           cmd: "command..",
//           msg: "message from ai..",
//           workingon: "working on..",
//         },
//         success: true,
//       };
//       if (AIResponse.content.cmd) {
//         const parsedCMD: any = {
//           action: "system_info",
//           param: null,
//           timeout: 10000,
//         };
//         const comamndOutput: commandParserType = await commandParser(
//           parsedCMD,
//           session,
//           CommandRunChatMessages,
//         );
//         CommandRunChatMessages.push({
//           role: "assistant",
//           content: JSON.stringify({
//             msg: comamndOutput.msg,
//             terminalError: comamndOutput.terminalError,
//             terminalOutput: comamndOutput.terminalOutput,
//           }),
//         });
//       } else break;
//       retries++;
//     }
//     return {
//         aiMsg:
//     }
//   } catch (error) {}
// };

// export default askAI;
