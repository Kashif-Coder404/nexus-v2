import { ChatMessageType } from "./ChatTypes";
export type AppContextType = {
  chatMessages: ChatMessageType[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
};
