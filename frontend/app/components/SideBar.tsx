"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSideBar } from "../store/useSideBar";
import {
  ArrowLeft,
  ChevronRight,
  Delete,
  EllipsisVertical,
  ExternalLink,
  Laptop,
  LogOut,
  MessageSquare,
  Settings,
  Sliders,
  Trash2,
  User,
} from "lucide-react";
import Dropdown, { DropdownItem } from "./Dropdown";
import { useUserCredentials } from "../store/useUserCredentials";
import useChat from "../store/useChat";
import { usePathname, useRouter } from "next/navigation";
import Chats from "./Chats";
import { useDevices } from "../store/useDevices";
import { requestDevices } from "@/services/ws.service";

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Easily add or adjust items here
const menuItems: SidebarItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Chats", href: "/chat" },
  { label: "Settings", href: "/settings" },
];

type ChatContent = {
  id: string; //Chat session id basically.
  title: string;
  date: string;
};

export default function SideBar() {
  const { toggleSidebar, isSidebarOpen } = useSideBar();
  const user = useUserCredentials((state) => state.user);
  const token = useUserCredentials((state) => state.token);
  const session = useChat((state) => state.session);
  const setSession = useChat((state) => state.setSession);
  const setChat = useChat((state) => state.setChat);
  const clearChat = useChat((state) => state.clearChat);
  const logout = useUserCredentials((state) => state.logout);
  const router = useRouter();
  const devices = useDevices((state) => state.devices);
  const openPairModal = useDevices((state) => state.openPairModal);
  const [sessions, setSessions] = useState<ChatContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDevicesLoading, setIsDevicesLoading] = useState<boolean>(false);
  const [isLogoutShown, setLogoutShown] = useState<boolean>(false);
  const handleDevicesRefresh = async () => {
    console.log("Requesting devices...", devices);
    setIsDevicesLoading(true);
    requestDevices();
  };
  const handleOpenPairModel = () => {
    openPairModal();
    if (isSidebarOpen) toggleSidebar(false);
  };
  const handleDeviceRevoke = async (deviceId: string) => {
    if (!token || !deviceId) return;
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://nexus-v2-e38m.onrender.com";
      const res = await fetch(`${backendUrl}/api/device/${deviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        useDevices
          .getState()
          .setDevices(
            useDevices.getState().devices.filter((d) => d.id !== deviceId),
          );
      } else {
        console.error("[REVOKE DEVICE FAILED]:", data.message);
      }
    } catch (err: any) {
      console.error("[REVOKE DEVICE ERROR]:", err.message);
    }
  };
  const pathname = usePathname();
  const handleDeleteChatSession = async (sessionId: string) => {
    setIsLoading(true);
    if (!token || !sessionId) return;
    try {
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
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        // Map database session fields (_id, title, updatedAt) to ChatContent
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
  useEffect(() => {
    setIsDevicesLoading(false);
  }, [devices]);
  useEffect(() => {
    if (user?.devices && devices.length === 0) {
      useDevices.getState().setDevices(
        user.devices.map((d) => ({
          id: d._id,
          deviceName: d.deviceName,
          online: false,
        })),
      );
    }
  }, [user?.devices]);
  // Automatically fetch chats when token is available on mount
  useEffect(() => {
    if (token) {
      getChats();
    }
  }, [token]);

  return (
    <>
      {/* Mobile backdrop to easily close when tapping outside */}
      {isSidebarOpen && (
        <div
          onClick={() => toggleSidebar()}
          className={style.backdrop}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${style.asideCont} ${
          isSidebarOpen ? style.asideOpen : style.asideClose
        }`}
      >
        <div className={style.headerCont}>
          <div className="flex items-center justify-between pb-4 w-full">
            <img
              src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
              alt="Nexus Logo"
              className={style.logoImage}
            />
            <div className="flex items-center gap-2 px-1 mb-3">
              <Link
                href="/dashboard"
                onClick={() => isSidebarOpen && toggleSidebar(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  pathname === "/dashboard"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/chat"
                onClick={() => isSidebarOpen && toggleSidebar(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  pathname === "/chat"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>
            </div>
            <button onClick={() => toggleSidebar()} className={style.closeBtn}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          {/* Quick Navigation for Mobile & Desktop */}

          <div className="flex flex-col items-stretch w-full">
            {/* Devices Dropdown */}
            <Dropdown
              title="Devices"
              itemNum={devices.length}
              icon={<Laptop className="w-5 h-5" />}
              isLoading={isDevicesLoading}
              onRefresh={() => handleDevicesRefresh()}
              onAdd={handleOpenPairModel}
              viewAllHref="/devices"
            >
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1 [scrollbar-width:thin] [scrollbar-color:#7e22ce_transparent]">
                {devices.length === 0 ? (
                  <span className="text-xs text-zinc-500 p-2">
                    No companion devices linked.
                  </span>
                ) : (
                  devices.map((el) => (
                    <DropdownItem className="group" key={el.id}>
                      <span
                        className="font-semibold text-sm sm:text-base truncate max-w-[130px]"
                        title={el.deviceName}
                      >
                        {el.deviceName}
                      </span>
                      <div className="flex items-center shrink-0">
                        <span
                          className={`text-xs shrink-0 transition-colors ${
                            !el.online
                              ? "text-zinc-500"
                              : el.service === false
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {!el.online
                            ? "○ Offline"
                            : el.service === false
                              ? "● Paused"
                              : "● Online"}
                        </span>
                        <div className="md:w-0 md:opacity-0 w-7 group-hover:w-7 group-hover:opacity-100 group-hover:ml-1.5 overflow-hidden transition-all duration-200 ease-out flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeviceRevoke(el.id);
                            }}
                            className="shrink-0 p-1 text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
                            title="Revoke / Delete device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </DropdownItem>
                  ))
                )}
              </div>
            </Dropdown>

            <hr className={`my-2 ${style.divider}`} />

            {/* Chats Dropdown */}
            <Dropdown
              title="Chats"
              defaultOpen={true}
              itemNum={sessions.length}
              isLoading={isLoading}
              icon={<MessageSquare className="w-5 h-5" />}
              onRefresh={getChats}
              onAdd={startNewChat}
              // viewAllHref="/chat"
            >
              <div className="max-h-full overflow-y-auto flex flex-col gap-1 pr-1 [scrollbar-width:thin] [scrollbar-color:#7e22ce_transparent]">
                {isLoading ? (
                  <span className="text-xs text-zinc-500 p-2">
                    Loading chats...
                  </span>
                ) : sessions.length === 0 ? (
                  <span className="text-xl text-zinc-500 p-2">
                    No chat sessions yet.
                  </span>
                ) : (
                  sessions.map((el) => (
                    <Chats
                      key={el.id}
                      onClick={() => loadSession(el.id)}
                      className={`flex justify-between items-center group cursor-pointer p-2 mb-2 hover:bg-white/20 transition-colors rounded-xl ${
                        session === el.id ? "bg-white/15" : ""
                      }`}
                    >
                      <span
                        className="text-white text-start text-base md:text-lg truncate max-w-[140px] sm:max-w-[160px]"
                        title={el.title}
                      >
                        {el.title}
                      </span>
                      <div className="flex items-center shrink-0">
                        <span className="text-purple-200/70 text-xs shrink-0 transition-colors">
                          {el.date}
                        </span>
                        <div className="md:w-0 md:opacity-0 w-7 group-hover:w-7 group-hover:opacity-100 group-hover:ml-1.5 overflow-hidden transition-all duration-200 ease-out flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChatSession(el.id);
                            }}
                            className="shrink-0 p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Chats>
                  ))
                )}
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="shrink-0 mt-auto w-full">
          <div className="flex justify-between items-center p-3 my-1 rounded-xl hover:bg-white/10 transition cursor-pointer text-white">
            <div className="flex justify-center items-center gap-2 max-w-fit">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              <h3 className="text-sm sm:text-base font-semibold">Settings</h3>
            </div>
            <div>
              <ChevronRight strokeWidth={3} className="w-4 h-4" />
            </div>
          </div>

          <hr className={`my-1 ${style.divider}`} />

          <div className="group relative flex justify-between items-center p-3 my-2 rounded-xl hover:bg-white/10 transition cursor-pointer text-white">
            <div className="flex justify-center items-center gap-2 max-w-fit">
              <div className="rounded-full border-2 p-0.5">
                <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl sm:text-base font-semibold">
                  {user?.name}
                </h3>
                {/* <h2 className="text-sm text-purple-300 font-semibold">
                  {user?.email}
                </h2> */}
              </div>
            </div>
            <div className="text-purple-400">
              {isLogoutShown && (
                <div className="absolute bottom-full right-0 mb-2 w-60 bg-zinc-950/95 border border-purple-500/30 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                  {/* 1. User Header */}
                  <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {user?.email || "Signed in"}
                    </p>
                  </div>

                  {/* 2. Quick Actions List */}
                  <button
                    onClick={() => {
                      handleOpenPairModel();
                      setLogoutShown(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer w-full text-left"
                  >
                    <Laptop className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Pair New Companion</span>
                  </button>

                  <a
                    href="https://github.com/Kashif-Coder404/nexus-v2"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>GitHub Repository</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                      v2.5.0
                    </span>
                  </a>

                  <hr className="my-1 border-zinc-800/80" />

                  {/* 3. Logout Button */}
                  <button
                    onClick={() => {
                      logout();
                      router.push("/auth/login");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer w-full text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              <EllipsisVertical
                onClick={() => setLogoutShown(!isLogoutShown)}
                strokeWidth={3}
                className="w-6 h-6  "
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

const style = {
  backdrop:
    "fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300 cursor-pointer",
  asideCont:
    "fixed inset-y-0 left-0 z-50 flex justify-between h-dvh flex-col p-3 border-r border-purple-900/30 bg-linear-to-b from-black to-[#20193F] transition-all duration-300 ease-in-out w-80 max-w-[88vw] sm:w-80 md:w-80 lg:w-80 md:static md:shrink-0",
  asideOpen: "translate-x-0 md:ml-0",
  asideClose: "-translate-x-full md:-ml-80 lg:-ml-80",
  headerCont: "flex flex-col items-center justify-between pb-4",
  logoImage: "w-9 h-9 object-contain",
  closeBtn:
    "flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer",
  divider: "w-full border border-purple-400/40 rounded",
};
