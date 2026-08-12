import axios from "axios";
import { instructions } from "../instructions/Instructions.js";
import { extractJSON, parseAIResponse } from "../Parsers.js";
import { setHistory } from "../LocalChatHistory.js";
import { CallNvidiaReturnType, ChatMessageType } from "../Types.js";

const urlNvidia: string = "http://127.0.0.1:8082/v1/messages";
const apiKey: string = "freecc";
const activeModel: string = "claude-3-5-haiku-20241022";

export const callNvidia = async (
  workingOn: string,
  chatMessages: ChatMessageType[],
  session: string,
  aiMsg: string,
  command: string,
  instructionString: string = instructions,
  isJson: boolean = true,
): Promise<CallNvidiaReturnType> => {
  const data = await nvidiaApiCall(chatMessages, instructionString, isJson);
  if (
    data?.includes("aborted") ||
    data?.includes("ECONNREFUSED") ||
    data?.includes("Invalid")
  ) {
    return {
      aiMsg: data,
      command: "",
      workingOn: "",
      success: false,
    };
  }
  if (isJson) {
    
    return {
      aiMsg: data,
      command: "",
      workingOn: "",
      success:
        data?.includes("Invalid") || data?.includes("aborted") ? false : true,
    };
  }
  // chatMessages.push({ role: "assistant", content: data });
  // await setHistory(chatMessages, session);
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
  return { aiMsg, command, workingOn, success: true };
};
export async function nvidiaApiCall(
  chatMessages: Array<{ role: string; content: string }>,
  instructionString: string = instructions,
  isJson: boolean = true,
): Promise<string> {
  try {
    const res = await axios.post(
      urlNvidia,
      {
        model: activeModel,
        max_tokens: 400,
        system: instructionString,
        messages: chatMessages,
        stream: isJson, // Request a standard non-streaming JSON response
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
