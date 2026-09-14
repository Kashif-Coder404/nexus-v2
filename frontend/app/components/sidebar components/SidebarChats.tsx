"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import Dropdown from "../Dropdown";
import ChatItem, { ChatContent } from "./ChatItem";
import useChat from "../../store/useChat";
import { useUserCredentials } from "../../store/useUserCredentials";
import { useSideBar } from "../../store/useSideBar";

export default function SidebarChats() {
  const router = useRouter();
  const token = useUserCredentials((state) => state.token);
  const logout = useUserCredentials((state) => state.logout);
  const session = useChat((state) => state.session);
  const setSession = useChat((state) => state.setSession);
  const setChat = useChat((state) => state.setChat);
  const clearChat = useChat((state) => state.clearChat);
  const { toggleSidebar, isSidebarOpen } = useSideBar();

  const [sessions, setSessions] = useState<ChatContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getChats = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://nexus-v2-e38m.onrender.com";
      const res = await fetch(`${backendUrl}/api/chat/sessions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout();
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const formatted: ChatContent[] = data.data.map((item: any) => ({
          id: item._id,
          title: item.title || "New Chat",
          date: new Date(item.updatedAt || item.createdAt).toLocaleDateString(),
        }));
        setSessions(formatted);
      }
    } catch (err: any) {
      console.error("[FETCH SESSIONS ERROR]:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    if (!token) return;
    try {
      setIsLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://nexus-v2-e38m.onrender.com";
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
        router.push("/chat");
        if (isSidebarOpen) toggleSidebar();
      }
    } catch (err: any) {
      console.error("[LOAD SESSION ERROR]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    clearChat();
    router.push("/chat");
    if (isSidebarOpen) toggleSidebar();
  };

  const handleDeleteChatSession = async (sessionId: string) => {
    if (!token || !sessionId) return;
    try {
      setIsLoading(true);
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://nexus-v2-e38m.onrender.com";
      const res = await fetch(`${backendUrl}/api/chat/delete-chat-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (res.status === 401) {
        logout();
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((item) => item.id !== sessionId));
        if (session === sessionId) {
          clearChat();
          setSession("");
        }
      } else {
        console.error("[DELETE SESSION FAILED]:", data.message);
      }
    } catch (err: any) {
      console.error("[DELETE SESSION ERROR]:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getChats();
    }
  }, [token]);

  return (
    <Dropdown
      title="Chats"
      defaultOpen={true}
      itemNum={sessions.length}
      isLoading={isLoading}
      icon={<MessageSquare className="w-5 h-5" />}
      onRefresh={getChats}
      onAdd={startNewChat}
      classname={{ mainCont: "my-2" }}
    >
      <div className="max-h-full overflow-y-auto flex flex-col gap-1 pr-1">
        {isLoading ? (
          <span className="text-xs text-zinc-500 p-2">Loading chats...</span>
        ) : sessions.length === 0 ? (
          <span className="text-xl text-zinc-500 p-2">
            No chat sessions yet.
          </span>
        ) : (
          sessions.map((el) => (
            <ChatItem
              key={el.id}
              data={el}
              isActive={session === el.id}
              onSelect={loadSession}
              onDelete={handleDeleteChatSession}
            />
          ))
        )}
      </div>
    </Dropdown>
  );
}
