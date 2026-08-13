import { summarizeInstructions } from "../instructions/para.summary.instructions.js";
import { geminiAICall } from "../Providers/geminiAI.js";
import { callNvidia } from "../Providers/nvidiaAPICall.js";
import { CallNvidiaReturnType, ChatMessageType } from "../Types.js";

export const summarizerCall = async (
  chatHistory: ChatMessageType[] = [],
  session: string,
): Promise<{ content: string; success: boolean }> => {
  if (!chatHistory || chatHistory.length === 0) {
    return { content: "", success: true };
  }

  // Format history messages into a clean text block
  const formattedHistory = chatHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const SummaryMessages = [
    {
      role: "user",
      content: `Please summarize the following chat history:\n${formattedHistory}`,
    },
  ];

  try {
    const nvidiaSummary: CallNvidiaReturnType = await callNvidia(
      "",
      SummaryMessages,
      session,
      "",
      "",
      summarizeInstructions,
      false,
    );
    if (!nvidiaSummary.success || nvidiaSummary.aiMsg.includes("Invalid")) {
      throw new Error("Nvidia Failed To summarize, Trying Gemini...");
    }
    return {
      content: nvidiaSummary.aiMsg,
      success: true,
    };
  } catch (error) {
    console.error(`[SUMMARY ERROR] ${error}`);
    const geminiSummaryResponse: any = await geminiAICall(
      SummaryMessages,
      0,
      "gemini-3.1-flash-lite",
      summarizeInstructions,
      false,
    );
    if (!geminiSummaryResponse.success) {
      return {
        content: "",
        success: false,
      };
    }
    return {
      content: geminiSummaryResponse.content,
      success: true,
    };
  }
};

export const summarize = async (
  chatHistory: ChatMessageType[],
  session: string,
): Promise<ChatMessageType[]> => {
  try {
    if (!chatHistory || chatHistory.length === 0) return [];
    console.log("[SUMMARIZER] GOT CHAT MESSAGES: ", chatHistory);
    const summaryResults = await summarizerCall(chatHistory, session);
    if (!summaryResults.success || !summaryResults.content) return [];

    const summaryChat: ChatMessageType = {
      role: "assistant",
      content: `[System Context - Previous Chat Summary]: ${summaryResults.content}`,
    };
    console.log("[SUMMARIZER] RETURNING: ", summaryChat);

    return [summaryChat];
  } catch (error) {
    console.error("[SUMMARIZER] ERROR: ", error);
    return [
      {
        role: "assistant",
        content: `Error while summarizing the chat!`,
      },
    ];
  }
};
