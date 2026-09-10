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
  workingOn: string | null;
  setWorkingOn: (workingOn: string | null) => void;
  setSession: (session: string) => void;
  setChat: (chat: Chat[]) => void;
  addChat: (chat: Chat) => void;
  clearChat: () => void;
};
const useChat = create<ChatStore>((set) => ({
  chat: [],
  session: "",
  workingOn: null,
  setWorkingOn: (workingOn: string | null) => set({ workingOn }),
  setSession: (session: string) => set({ session }),
  setChat: (chat: Chat[]) => set({ chat }),
  addChat: (chat: Chat) => set((state) => ({ chat: [...state.chat, chat] })),
  clearChat: () => set({ chat: [] }),
}));
export default useChat;
