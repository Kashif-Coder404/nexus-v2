import { ModelType } from "./CallAI.js";
import { AskAI } from "./AskAI_OOP.js";

// Re-export type for legacy files like ChatTypes.ts

export const askAI = async (
  userId: string,
  session: string,
  userMessage: string,
  modelOrBehaviour: string | ModelType,
  optionalModel?: ModelType,
) => {
  // Support both 4 arguments (WebSocket) and 5 arguments (HTTP controller)
  const model =
    typeof modelOrBehaviour === "object"
      ? modelOrBehaviour
      : optionalModel ||
        ({ provider: "gemini", name: "gemini-3.7-flash" } as ModelType);

  // 🚀 Instantiates your new OOP class and runs the loop!
  const runner = new AskAI(userId, session, userMessage, model);
  return await runner.run();
};
