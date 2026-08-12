import fs from "fs";
import path from "path";
import { geminiAICall } from "./Providers/geminiAI.js";
import { ChatMessageType } from "./Types.js";
import { imageInstructions } from "./instructions/imageinstructions.js";
import { captureScreen } from "../tools/takeScreenShot.js";

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
export const imageSet = async (chatMessages: ChatMessageType[]) => {
  const isImage = await imageCheck();
  if (!isImage.success) return false;
  const imageBuffer = isImage.buffer;
  const toPass: any = {
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBuffer?.toString("base64")}`,
        },
      },
    ],
  };
  const chatToPass = [...chatMessages, toPass];
  console.log("PASSING CHAT MESSAGE: ", chatToPass);
  const response = await geminiAICall(
    chatToPass,
    0,
    "gemini-3.5-flash",
    imageInstructions,
    false,
  );
  if (!response.success) return false;
  chatMessages.push({
    role: "assistant",
    content: `[VISUAL CONTEXT SUMMARIZED BY AI]: ${JSON.stringify(response.content)}`,
  });
  console.log(
    "CHAT MESSAGES AFTER THE IMAGE SENT WITH THE SUMMARIZED MESSAGE: ",
    chatMessages,
  );
  return true;
};

//After screenshot of the screen....
