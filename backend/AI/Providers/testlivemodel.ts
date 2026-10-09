import { instructions } from "../instructions/main.Instructions.js";
import { liveGeminiAICall } from "./geminiAI.js";

const testLive = async () => {
  const chatMessages = [
    {
      role: "user",
      content: "ok open the youtube for me",
    },
  ];
  const response = await liveGeminiAICall({
    chatMessages,
    retryCount: 0,
    model: "gemini-3.8-live",
    instructionString: instructions,
    isJson: true,
    keyIndex: 0,
  });
  console.log(JSON.stringify(response));
};
testLive();
