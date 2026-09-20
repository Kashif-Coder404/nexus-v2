import { GoogleGenAI, Modality } from "@google/genai";
import { instructions } from "./instructions/main.Instructions.js";
import readlineSync from "readline-sync";
import { timeStamp } from "console";
import { liveGeminiAICall } from "./Providers/geminiAI.js";
import { GEMINI_API_Main_Acc } from "../EnvVariables.js";

const GOOGLE_API_KEY = GEMINI_API_Main_Acc;
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

(async () => {
  const result = await liveGeminiAICall({
    chatMessages: [{ role: "user", content: "Hello, how are you?" }],
    retryCount: 0,
    model: "gemini-3.1-flash-live-preview",
    instructionString: "",
    isJson: false,
  });
  console.log(result);
})();
