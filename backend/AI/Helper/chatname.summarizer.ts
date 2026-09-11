import { callAI } from "../CallAI.js";
import { chatnameInstructions } from "../instructions/chatname.instructions.js";

const chatSummarize = async (chatMessage: any): Promise<string> => {
  const summarized = await callAI("gemini", {
    chatMessages: chatMessage || [],
    isJson: false,
    instructions: chatnameInstructions,
    session: "",
    isLiveModel: false,
    model: "gemini-3.1-flash-live-preview",
  });
  //   console.log(summarized);
  if (summarized.success === false) {
    console.log(
      "Failed To Put Title with live model , retrying with flash lite",
    );
  } else {
    return summarized.rawContent || summarized.msg;
  }
  const summarized2 = await callAI("gemini", {
    chatMessages: chatMessage || [],
    isJson: false,
    instructions: chatnameInstructions,
    session: "",
    isLiveModel: false,
    model: "gemini-3.1-flash-lite",
  });
  if (summarized2.success === false) {
    return chatMessage[0].content.substring(0, 25);
  }
  return summarized2.rawContent || summarized2.msg;
};
export default chatSummarize;
