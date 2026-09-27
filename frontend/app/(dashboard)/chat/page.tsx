"use client";

import { useEffect } from "react";
import ChatUI from "@/app/components/ChatUI";
import useChat from "@/app/store/useChat";

export default function NewChatPage() {
  const clearChat = useChat((state) => state.clearChat);
  const setSession = useChat((state) => state.setSession);
  const setWorkingOn = useChat((state) => state.setWorkingOn);
  const setLiveExecutions = useChat((state) => state.setLiveExecutions);

  useEffect(() => {
    // Visiting /chat always resets to a fresh, clean conversation
    clearChat();
    setSession("");
    setWorkingOn(null);
    setLiveExecutions([]);
  }, []);

  return <ChatUI />;
}
