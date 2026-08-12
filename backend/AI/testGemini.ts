import { geminiAICall } from "./Providers/geminiAI.js";
import { GeminiResponse } from "./Types.js";
import { instructions } from "./instructions/Instructions.js";
import { summarize } from "./summarizer.js";
const testGemini = async () => {
  const geminiResponse: GeminiResponse = await geminiAICall(
    [{ role: "user", content: "Hey, What Are you doing" }],
    0,
    "gemini-3.5-flash",
    instructions,
    true,
  );
  console.log("GEMINI RESPONSE: ", geminiResponse);
};
const testSummary = async () => {
  const tempChatMessages = [
    {
      role: "user",
      content: "Hey, I am Kashif could you run the echo hello world?",
    },
  ];
  const summaryResult: any = await summarize(
    tempChatMessages,
    "summaryTestSession",
  );
  console.log("SUMMARY RESULT: ", summaryResult);
};
testSummary();
