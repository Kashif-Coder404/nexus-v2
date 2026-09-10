import { create } from "zustand";
import { persist } from "zustand/middleware";
type UserMsg = {
  role: "user";
  content: string;
};
type AiMsg = {
  role: "assistant";
  content: any;
};
type Chat = UserMsg | AiMsg;
type ChatStore = {
  chat: Chat[];
  session: string;
  setSession: (session: string) => void;
  addChat: (chat: Chat) => void;
  clearChat: () => void;
};
const useChat = create<ChatStore>((set) => ({
  chat: [],
  session: "",
  setSession: (session: string) => set({ session }),
  addChat: (chat: Chat) => set((state) => ({ chat: [...state.chat, chat] })),
  clearChat: () => set({ chat: [] }),
}));
export default useChat;
