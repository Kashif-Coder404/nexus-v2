"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatUI from "@/app/components/ChatUI";
import useChat from "@/app/store/useChat";
import { useUserCredentials } from "@/app/store/useUserCredentials";

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;

  const token = useUserCredentials((state) => state.token);
  const session = useChat((state) => state.session);
  const chat = useChat((state) => state.chat);
  const setSession = useChat((state) => state.setSession);
  const setChat = useChat((state) => state.setChat);
  const setWorkingOn = useChat((state) => state.setWorkingOn);
  const setLiveExecutions = useChat((state) => state.setLiveExecutions);

  useEffect(() => {
    if (!sessionId || !token) return;

    // If store already has this session active, skip refetch
    if (session === sessionId && chat.length > 0) return;

    const loadSessionData = async () => {
      setWorkingOn(null);
      setLiveExecutions([]);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL; //doens't reque || as it was came from the env already.
        const res = await fetch(`${backendUrl}/api/chat/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.chat)) {
          setSession(sessionId);
          setChat(data.data.chat);
        } else {
          router.push("/chat");
        }
      } catch (err) {
        console.error("[LOAD SESSION ERROR]:", err);
      }
    };

    loadSessionData();
  }, [sessionId, token]);

  return <ChatUI />;
}
