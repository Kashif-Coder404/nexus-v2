import fs from "fs";
import path from "path";
import { geminiAICall } from "../Providers/geminiAI.js";
import { ChatMessageType } from "../Types.js";
import { imageInstructions } from "../instructions/image.instructions.js";
import { captureScreen } from "../../tools/takeScreenShot.js";

export const imageCheck = async (): Promise<{
  success: boolean;
  buffer: Buffer | null;
  error?: string;
}> => {
  try {
    const { imageBuffer, success, error } = await captureScreen();
    if (!success || !imageBuffer || error)
      return { success: false, buffer: null, error: error || "" };
    return { success: true, buffer: imageBuffer };
  } catch (error: any) {
    return { success: false, buffer: null, error: error.message || "" };
  }
};
export const imageSet = async (
  chatMessages: ChatMessageType[],
  moreContext: string,
): Promise<{ summary: string; base64: string } | false> => {
  const isImage = await imageCheck();
  if (!isImage.success) return false;
  console.log("[IMAGE SUMMARIZER] Summarizing screenshot...");
  const imageBuffer = isImage.buffer;
  const base64Str = `data:image/jpeg;base64,${imageBuffer?.toString("base64")}`;
  const toPass: any = {
    role: "user",
    content: [
      ...(moreContext
        ? [
            {
              type: "text",
              text: moreContext,
            },
          ]
        : []),
      {
        type: "image_url",
        image_url: {
          url: base64Str,
        },
      },
    ],
  };
  const chatToPass = [...chatMessages, toPass];
  const response = await geminiAICall({
    chatMessages: chatToPass,
    retryCount: 0,
    model: "gemini-3.5-flash-lite",
    instructionString: imageInstructions,
    isJson: false,
  });
  if (!response.success) return false;
  const summary = `[VISUAL CONTEXT SUMMARIZED BY AI]: ${JSON.stringify(response.content)}`;
  console.log("[IMAGE SUMMARIZER] Screenshot summarized successfully.");
  return { summary, base64: base64Str };
};

//After screenshot of the screen....
