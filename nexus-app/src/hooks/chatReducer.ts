import { MessageItems, UserProp, AIBoxProps } from "@/types/chat";

export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; payload: UserProp }
  | { type: "ADD_AI_MESSAGE"; payload: AIBoxProps }
  | {
      type: "UPDATE_MESSAGE_STATUS";
      payload: { id: string; status: "sent" | "error" };
    }
  | { type: "SET_CHAT_HISTORY"; payload: MessageItems[] | ((prev: MessageItems[]) => MessageItems[]) };

export const chatReducer = (
  state: MessageItems[],
  action: ChatAction,
): MessageItems[] => {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return [...state, action.payload];
    case "ADD_AI_MESSAGE":
      return [...state, action.payload];
    case "UPDATE_MESSAGE_STATUS":
      return state.map((msg) =>
        msg.id === action.payload.id && msg.role === "user"
          ? ({ ...msg, status: action.payload.status } as UserProp)
          : msg,
      );
    case "SET_CHAT_HISTORY":
      if (typeof action.payload === "function") {
        return action.payload(state);
      }
      return action.payload;
    default:
      return state;
  }
};
