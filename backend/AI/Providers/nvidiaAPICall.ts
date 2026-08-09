import axios from "axios";
import { instructions } from "../instructions/Instructions.js";
import { extractJSON, parseAIResponse } from "../Parsers.js";
import { setHistory } from "../AiLogs.js";
import { CallNvidiaReturnType, ChatMessageType } from "../Types.js";

const urlNvidia: string = "http://127.0.0.1:8082/v1/messages";
const apiKey: string = "freecc";
const activeModel: string = "claude-3-5-haiku-20241022";

const callNvidia = async (
  workingOn: string,
  chatMessages: ChatMessageType[],
  session: string,
  aiMsg: string,
  command: string,
): Promise<CallNvidiaReturnType> => {
  const data = await nvidiaApiCall(chatMessages);
  chatMessages.push({ role: "assistant", content: data });
  await setHistory(chatMessages, session);
  // 4. Parse the AI response to extract command instructions
  const parsed = extractJSON(data);

  if (parsed) {
    aiMsg = parsed.msg || "";
    command = parsed.cmd || "";
  } else {
    if (
      typeof data === "string" &&
      (data.includes('{"cmd"') || data.includes('{"msg"'))
    ) {
      aiMsg =
        "I encountered an error generating my response due to a malformed output.";
    } else {
      aiMsg = data;
    }
    command = "";
  }
  workingOn = parsed?.workingon || "";
  return { aiMsg, command, workingOn };
};
export async function nvidiaApiCall(
  chatMessages: Array<{ role: string; content: string }>,
): Promise<string> {
  try {
    const res = await axios.post(
      urlNvidia,
      {
        model: activeModel,
        max_tokens: 400,
        system: instructions,
        messages: chatMessages,
        stream: true, // Request a standard non-streaming JSON response
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        timeout: 120000, // 120 seconds timeout to accommodate larger models
      },
    );
    const responseText = parseAIResponse(res.data);
    // console.log("AI RESPONSE FROM API: ", responseText);
    return responseText;
  } catch (error: any) {
    return error.message;
  }
}
