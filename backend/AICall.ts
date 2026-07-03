import axios from "axios";
import { instructions } from "./Instructions.js";

const urlNvidia: string = "http://127.0.0.1:8082/v1/messages";
const apiKey: string = "freecc";
const activeModel: string = "claude-3-5-sonnet-20241022";

function parseAIResponse(data: any): string {
  let responseText = "";
  if (typeof data === "string") {
    // Check if the response is a Server-Sent Events (SSE) stream text
    if (data.includes("event:") || data.includes("data:")) {
      const lines = data.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              const parsed = JSON.parse(jsonStr);
              if (parsed.delta && typeof parsed.delta.text === "string") {
                responseText += parsed.delta.text;
              } else if (
                parsed.content_block &&
                typeof parsed.content_block.text === "string"
              ) {
                responseText += parsed.content_block.text;
              }
            }
          } catch (e) {
            // Ignore parse errors for partial lines
          }
        }
      }
    } else {
      responseText = data;
    }
  } else if (
    data &&
    data.content &&
    Array.isArray(data.content) &&
    data.content[0]
  ) {
    // Anthropic style format
    responseText = data.content[0].text || "";
  } else if (
    data &&
    data.choices &&
    Array.isArray(data.choices) &&
    data.choices[0]?.message
  ) {
    // OpenAI style format
    responseText = data.choices[0].message.content || "";
  } else if (data && typeof data.response === "string") {
    // Simple wrapper format
    responseText = data.response;
  } else {
    throw new Error(
      `Unexpected API response structure. Keys present: ${Object.keys(data || {}).join(", ")}`,
    );
  }
  return responseText;
}

export async function apiCall(
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
        stream: false, // Request a standard non-streaming JSON response
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      },
    );

    const responseText = parseAIResponse(res.data);
    console.log("data from nvidia ai proxy parsed: ",responseText);

    //Expample response: 
    // {
    //   "cmd": "shutdown /r /fw /t 0",
    //   "msg": "Restarting your PC and opening the BIOS menu...",
    //   "done": true
    // }
    return responseText;
  } catch (error: any) {
    console.log("[API CALL ERROR]\n");
    console.log("Error: ", error.message);
    return error.message;
  }
}
