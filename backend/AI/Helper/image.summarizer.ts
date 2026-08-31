import { geminiAICall } from "../Providers/geminiAI.js";
import { ChatMessageType } from "../Types.js";
import { imageInstructions } from "../instructions/image.instructions.js";
import { captureScreen } from "../../tools/takeScreenShot.js";
import { callAI } from "../CallAI.js";
import { getChat } from "../../services/chat.history.service.js";

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
export const summarizeBase64Image = async (
  base64Raw: string,
  chatMessages: ChatMessageType[],
  moreContext: string,
): Promise<{ summary: string; base64: string } | false> => {
  if (!base64Raw) return false;
  const base64Str = base64Raw.startsWith("data:")
    ? base64Raw
    : `data:image/png;base64,${base64Raw}`;
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
  return { summary, base64: base64Str };
};

export const imageSet = async (
  chatMessages: ChatMessageType[],
  moreContext: string,
): Promise<{ summary: string; base64: string } | false> => {
  const isImage = await imageCheck();
  if (!isImage.success) return false;
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
  return { summary, base64: base64Str };
};

//After screenshot of the screen....
export const summarize_image = async (
  context: string = "",
  imageBuffer: Buffer,
  session: string,
  userId: string,
) => {
  const chatHistory = (await getChat(userId, session, 10))?.chat || [];
  const base64Str = `data:image/png;base64,${imageBuffer?.toString("base64")}`;
  const toPass: any = {
    role: "user",
    content: [
      ...(context
        ? [
            {
              type: "text",
              text: context,
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
  const chatMessages: ChatMessageType[] = [...chatHistory, toPass];
  const summary = await callAI("gemini", {
    chatMessages: chatMessages,
    session: session,
    instructions: imageInstructions,
    isJson: false,
    model: "gemini-3.5-flash-lite",
    retryCount: 0,
  });
  return { summaryImage: summary, success: true };
};
