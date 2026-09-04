import axios from "axios";
import { instructions } from "../instructions/main.Instructions.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { GeminiResponse } from "../Types.js";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  GEMINI_API,
  GEMINI_API_CW,
  GEMINI_API2,
  GEMINI_API3,
  initializeKeys,
} from "../../EnvVariables.js";
await initializeKeys();
const GEMINI_API_KEYS = [GEMINI_API, GEMINI_API2, GEMINI_API3].filter(
  Boolean,
) as string[];
export type GeminiModelsTypes =
  | "gemini-3.5-flash-lite"
  | "gemini-3.5-flash"
  | "gemini-3.1-flash-lite"
  | "gemini-3.1-flash-live-preview";
type GeminiAICallOptions = {
  chatMessages: Array<{ role: string; content: string }>;
  retryCount: number;
  model: GeminiModelsTypes | string;
  instructionString: string;
  isJson: boolean;
  keyIndex?: number;
};
export const geminiAICall = async ({
  chatMessages,
  retryCount = 0,
  model = "gemini-3.5-flash-lite",
  instructionString = instructions,
  isJson = true,
  keyIndex = 0,
}: GeminiAICallOptions): Promise<GeminiResponse> => {
  const maxKeys = Math.max(GEMINI_API_KEYS.length, 1);
  const safeKeyIndex =
    GEMINI_API_KEYS.length > 0 ? keyIndex % GEMINI_API_KEYS.length : 0;
  const Current_API_KEY = GEMINI_API_KEYS[safeKeyIndex] || GEMINI_API;
  console.log(
    `[GEMINI AI CALL] Model: ${model} | KeyIndex: ${safeKeyIndex} | Retry: ${retryCount}`,
  );
  if (retryCount >= maxKeys) {
    return {
      success: false,
      content: {
        cmd: "",
        msg: "Gemini API Failed or Rate Limited!",
        workingon: "",
      },
    };
  }

  const MessageToAI = [
    {
      role: "system",
      content: instructionString,
    },
    ...chatMessages,
  ];
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        model: model,
        messages: MessageToAI,
        temperature: 0.5,
        ...(isJson && {
          response_format: {
            type: "json_object",
          },
        }),
      },
      {
        headers: {
          Authorization: `Bearer ${Current_API_KEY}`,
          "Content-Type": "application/json",
        },
        // uncomment if you want to use the proxy
        // httpsAgent: agent,
      },
    );

    const messageContent = response.data.choices[0].message.content;
    let parsedContent;
    if (isJson) {
      let cleanStr = messageContent.trim();
      if (cleanStr.startsWith("```json")) {
        cleanStr = cleanStr
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim();
      } else if (cleanStr.startsWith("```")) {
        cleanStr = cleanStr.replace(/^```/, "").replace(/```$/, "").trim();
      }
      try {
        parsedContent = JSON.parse(cleanStr);
      } catch (parseError) {
        // Attempt to extract JSON if there's trailing garbage
        const match = cleanStr.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedContent = JSON.parse(match[0]);
          } catch (e) {
            throw parseError;
          }
        } else {
          throw parseError;
        }
      }
    } else {
      parsedContent = messageContent;
    }
    return {
      content: parsedContent,
      success: true,
      usedKeyIndex: safeKeyIndex,
    };
  } catch (error: any) {
    console.error("[GEMINI AI] API CALL FAILED");

    const status = error.response?.status;
    const errorMsg = error.message || "";
    const errorData = JSON.stringify(error.response?.data || "");
    const isParseError = error instanceof SyntaxError;

    // Detect Service Busy, Overloaded, Rate Limits (429), or Quota Exceeded
    const isRetryableError =
      status === 429 ||
      status === 503 ||
      status === 500 ||
      status === 504 ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      errorMsg.toLowerCase().includes("overloaded") ||
      errorMsg.toLowerCase().includes("busy") ||
      errorMsg.toLowerCase().includes("capacity") ||
      errorMsg.toLowerCase().includes("unavailable") ||
      errorData.includes("RESOURCE_EXHAUSTED") ||
      errorData.includes("UNAVAILABLE") ||
      errorData.toLowerCase().includes("overloaded") ||
      isParseError;

    const maxKeys = Math.max(GEMINI_API_KEYS.length, 1);
    if (isRetryableError && retryCount < maxKeys - 1) {
      const nextKeyIndex = (safeKeyIndex + 1) % maxKeys;
      console.warn(
        `[GEMINI AI] Service busy or rate-limited (${status || errorMsg}). Silently switching to key index ${nextKeyIndex} (Attempt ${retryCount + 1}/${maxKeys})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
      return geminiAICall({
        chatMessages,
        retryCount: retryCount + 1,
        model,
        instructionString,
        isJson,
        keyIndex: nextKeyIndex,
      });
    }

    let userFriendlyMsg =
      "AI service encountered an unexpected error. Please try again.";

    if (
      status === 429 ||
      errorData.includes("RESOURCE_EXHAUSTED") ||
      errorMsg.includes("quota")
    ) {
      userFriendlyMsg =
        "AI request limit or quota exceeded. Please wait a few moments before trying again.";
    } else if (status === 401 || status === 403) {
      userFriendlyMsg =
        "AI authentication error. Please verify your API key in configuration.";
    } else if (
      status === 503 ||
      status === 500 ||
      error.code === "ECONNABORTED"
    ) {
      userFriendlyMsg =
        "AI service is currently busy or experiencing high traffic. Please try again shortly.";
    } else if (error instanceof SyntaxError) {
      userFriendlyMsg =
        "AI response format was invalid. Please try rephrasing your request.";
    }

    if (error.response) {
      console.error("[GEMINI AI] Status:", error.response.status);
    } else {
      console.error("[GEMINI AI] Error:", error.message);
    }

    return {
      success: false,
      content: {
        cmd: "",
        msg: userFriendlyMsg,
        workingon: "",
      },
    };
  }
};

export const liveGeminiAICall = async ({
  chatMessages,
  retryCount = 0,
  model = "gemini-3.1-flash-live-preview",
  instructionString = instructions,
  isJson = true,
  keyIndex = 0,
}: GeminiAICallOptions): Promise<GeminiResponse> => {
  const maxKeys = Math.max(GEMINI_API_KEYS.length, 1);
  const safeKeyIndex =
    GEMINI_API_KEYS.length > 0 ? keyIndex % GEMINI_API_KEYS.length : 0;
  const Current_API_KEY = GEMINI_API_KEYS[safeKeyIndex] || GEMINI_API;
  console.log(
    `[GEMINI LIVE AI CALL] Model: ${model} | KeyIndex: ${safeKeyIndex} | Retry: ${retryCount}`,
  );

  if (retryCount >= maxKeys) {
    return {
      success: false,
      content: {
        cmd: "",
        msg: "Gemini Live API Failed or Rate Limited!",
        workingon: "",
      },
    };
  }

  const ai = new GoogleGenAI({
    apiKey: Current_API_KEY,
  });

  return new Promise(async (resolve) => {
    let fullResponseText = "";

    try {
      // 1. Establish the real-time bidirectional session
      const session = await ai.live.connect({
        model: model,
        config: {
          systemInstruction: {
            parts: [{ text: instructionString }],
          },
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
        callbacks: {
          onopen: () => {
            console.log("[GEMINI LIVE] WebSocket connection ready.");
          },
          onmessage: (message: any) => {
            // Collect text transcription if available
            if (message.serverContent?.outputTranscription?.text) {
              fullResponseText +=
                message.serverContent.outputTranscription.text;
            }

            // Also check modelTurn parts for any text chunks
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                  fullResponseText += part.text;
                }
              }
            }

            // Close session and resolve once the model completes its turn
            if (message.serverContent?.turnComplete) {
              session.close();
            }
          },
          onerror: (error: any) => {
            console.error("[GEMINI LIVE] Error:", error);
          },
          onclose: async (event: any) => {
            if (!fullResponseText.trim() && retryCount < maxKeys - 1) {
              const nextKeyIndex = (safeKeyIndex + 1) % maxKeys;
              console.log(
                `[GEMINI LIVE] Empty response / closed early (code ${event?.code}). Retrying with next key index ${nextKeyIndex}... (Attempt ${retryCount + 1}/${maxKeys})`,
              );
              await new Promise((r) => setTimeout(r, 1500));
              const retryRes = await liveGeminiAICall({
                chatMessages,
                retryCount: retryCount + 1,
                model,
                instructionString,
                isJson,
                keyIndex: nextKeyIndex,
              });
              return resolve(retryRes);
            }

            let parsedContent: any;
            if (isJson) {
              let cleanStr = fullResponseText.trim();
              if (cleanStr.startsWith("```json")) {
                cleanStr = cleanStr
                  .replace(/^```json/, "")
                  .replace(/```$/, "")
                  .trim();
              } else if (cleanStr.startsWith("```")) {
                cleanStr = cleanStr
                  .replace(/^```/, "")
                  .replace(/```$/, "")
                  .trim();
              }
              try {
                parsedContent = JSON.parse(cleanStr);
              } catch (parseError) {
                const match = cleanStr.match(/\{[\s\S]*\}/);
                if (match) {
                  try {
                    parsedContent = JSON.parse(match[0]);
                  } catch (e) {
                    parsedContent = {
                      cmd: "",
                      msg: fullResponseText,
                      workingon: "",
                    };
                  }
                } else {
                  parsedContent = {
                    cmd: "",
                    msg: fullResponseText,
                    workingon: "",
                  };
                }
              }
            } else {
              parsedContent = fullResponseText;
            }

            resolve({
              content: parsedContent,
              success: Boolean(fullResponseText.trim()),
              usedKeyIndex: safeKeyIndex,
            });
          },
        },
      });

      // 2. Format chat messages into Live API turns
      const turns = chatMessages.map((msg) => ({
        role:
          msg.role === "assistant"
            ? "model"
            : msg.role === "system"
              ? "user"
              : msg.role,
        parts: [
          {
            text:
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
          },
        ],
      }));

      if (turns.length === 0) {
        turns.push({ role: "user", parts: [{ text: "Hello" }] });
      }

      // 3. Send turns to the active session
      await session.sendClientContent({
        turns,
        turnComplete: true,
      });
    } catch (error: any) {
      console.error("[GEMINI LIVE] Failed to execute call:", error);

      if (retryCount < maxKeys - 1) {
        const nextKeyIndex = (safeKeyIndex + 1) % maxKeys;
        console.warn(
          `[GEMINI LIVE] Service busy or disconnected. Retrying with next key index ${nextKeyIndex}... (Attempt ${retryCount + 1}/${maxKeys})`,
        );
        await new Promise((r) => setTimeout(r, 1200));
        const retryRes = await liveGeminiAICall({
          chatMessages,
          retryCount: retryCount + 1,
          model,
          instructionString,
          isJson,
          keyIndex: nextKeyIndex,
        });
        return resolve(retryRes);
      }

      resolve({
        success: false,
        content: {
          cmd: "",
          msg: "Gemini Live AI service encountered an error. Please try again.",
          workingon: "",
        },
      });
    }
  });
};
