import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { instructions } from "./instructions/main.Instructions.js";
import readlineSync from "readline-sync";
import { timeStamp } from "console";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { liveGeminiAICall } from "./Providers/geminiAI.js";

dotenv.config({ path: path.join(__dirname, "../.env") });

const GOOGLE_API_KEY = process.env.GEMINI_API;
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

async function getFullLiveResponse(promptText: string) {
  let session;
  let fullResponseText = "";
  let resolveResponse: any;
  let rejectResponse: any;

  const responsePromise = new Promise((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });

  session = await ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    config: {
      // Gemini Live returns audio, while transcription gives us text.
      responseModalities: ["AUDIO" as Modality],
      outputAudioTranscription: {},
    },
    callbacks: {
      onmessage: (message) => {
        const transcript = message.serverContent?.outputTranscription?.text;

        if (transcript) {
          fullResponseText += transcript;
        }

        if (message.serverContent?.turnComplete) {
          resolveResponse(fullResponseText);
        }
        console.log("FULL ANSWER: ", fullResponseText);
      },

      onerror: (error) => {
        rejectResponse(error.error ?? error);
      },

      onclose: (event) => {
        if (!fullResponseText) {
          rejectResponse(
            new Error(
              `Live session closed before a response (${
                event.code ?? "unknown"
              }): ${event.reason || "no reason provided"}`,
            ),
          );
        }
      },
    },
  });
  
  const mainInstructions: string = instructions;
  session.sendClientContent({
    turns: [
      {
        role: "user",
        parts: [
          {
            text: mainInstructions,
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ],
    turnComplete: true,
  });

  const result = await Promise.race([
    responsePromise,

    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Timed out waiting for Gemini Live response")),
        10000,
      );
    }),
  ]);

  session.close();

  return result as string;
}

// try {
//   let userMessage: string = readlineSync.question("Message to ai: ");
//   let msg: any = { msg: userMessage, time: new Date().getTime() };
//   const prompt: any = [
//     {
//       role: "user",
//       content: JSON.stringify(msg),
//     },
//   ];
//   while (userMessage !== "exit") {
//     msg = { msg: userMessage, time: new Date().getTime() };
//     prompt.push({
//       role: "user",
//       content: JSON.stringify(msg),
//     });
//     console.log("Sending live request, waiting for full prepared response...");

//     const result: string = await getFullLiveResponse(JSON.stringify(prompt));

//     console.log("\n--- Full Prepared Live Response ---");
//     const parsedResults: { cmd: any; msg: any; workingon: string; time: any } =
//       JSON.parse(result);
//     console.log("MESSAGE: ", parsedResults.msg);
//     console.log("COMMAND RUNNING: ", parsedResults.cmd);
//     console.log("WorkingON: ", parsedResults.workingon);
//     console.log(
//       "Time: ",
//       new Date(parsedResults.time).toLocaleString("en-US", {
//         hour12: true,
//         hour: "2-digit",
//         minute: "2-digit",
//       }),
//     );
//     prompt.push({
//       role: "assistant",
//       content: { ...JSON.parse(result), time: new Date().getTime() },
//     });
//     console.log("PROMPT THEN: ", prompt);
//     userMessage = readlineSync.question("Message to ai: ");
//   }
// } catch (error) {
//   console.error("Error communicating with Gemini Live API:", error);

//   process.exitCode = 1;
// }

(async () => {
  const result = await liveGeminiAICall("Hello, how are you?");
  console.log(result);
})();
