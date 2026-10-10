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
): Promise<{ summary: string; base64: string; msg: string } | false> => {
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
  // 1. Try Local Gemini first with gemini-3.6-flash (Free, zero token cost)
  let response = await callAI("gemini", {
    chatMessages: [toPass],
    session: "",
    instructions: imageInstructions,
    isJson: false,
    model: "gemini-3.5-flash-lite",
    retryCount: 0,
  });

  // 2. If Local fails, fall back to Live Gemini
  if (!response || !response.success) {
    console.warn(
      "[IMAGE SUMMARIZER] Local model failed, falling back to Live model...",
    );
    response = await callAI("gemini", {
      chatMessages: [toPass],
      session: "",
      instructions: imageInstructions,
      isJson: false,
      model: "gemini-3.6-flash",
      retryCount: 0,
    });
  }

  console.log("Image Context MSG: ", response.msg);
  if (!response.success)
    return {
      summary: "Image Captured But Failed To Give Context About image",
      base64: base64Str,
      msg: response.msg || "Failed To Give Context About image",
    };

  const visualText =
    response.msg ||
    (typeof response.rawContent === "string"
      ? response.rawContent
      : response.rawContent?.msg ||
        response.rawContent?.text ||
        JSON.stringify(response.rawContent));
  const summary = `[VISUAL CONTEXT SUMMARIZED BY AI]: ${visualText}`;
  return { summary, base64: base64Str, msg: visualText };
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
  const response = await geminiAICall({
    chatMessages: toPass,
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
  const summary = await callAI("gemini", {
    chatMessages: toPass,
    session: session,
    instructions: imageInstructions,
    isJson: false,
    model: "gemini-3.5-flash-lite",
    retryCount: 0,
  });
  return { summaryImage: summary, success: true };
};
