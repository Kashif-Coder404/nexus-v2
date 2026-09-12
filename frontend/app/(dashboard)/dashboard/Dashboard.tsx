"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Laptop,
  MessageSquare,
  Plus,
  Download,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Camera,
  Terminal,
  Cpu,
  Folder,
} from "lucide-react";
import { useUserCredentials } from "@/app/store/useUserCredentials";
import { useDevices } from "@/app/store/useDevices";
import useChat from "@/app/store/useChat";
import { requestDevices } from "@/services/ws.service";

interface ChatSession {
  id: string;
  title: string;
  date: string;
}

export default function DashboardUI() {
  const router = useRouter();
  const user = useUserCredentials((state) => state.user);
  const token = useUserCredentials((state) => state.token);
  const devices = useDevices((state) => state.devices);
  const openPairModal = useDevices((state) => state.openPairModal);
  const setSession = useChat((state) => state.setSession);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);

  const onlineDevicesCount = devices.filter((d) => d.online).length;

  // Fetch real user sessions
  useEffect(() => {
    if (!token) return;
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "https://nexus-v2-e38m.onrender.com";
        const res = await fetch(`${backendUrl}/api/chat/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const formatted = data.data.map((item: any) => ({
            id: item._id,
            title: item.title || "Untitled Session",
            date: new Date(item.updatedAt || item.createdAt).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric" }
            ),
          }));
          setSessions(formatted);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [token]);

  const handleRefreshDevices = () => {
    setIsRefreshingDevices(true);
    requestDevices();
    setTimeout(() => setIsRefreshingDevices(false), 800);
  };

  const handleSelectSession = (sessionId: string) => {
    setSession(sessionId);
    router.push("/chat");
  };

  const handleQuickPrompt = (promptText: string) => {
    // Navigate to chat
    router.push("/chat");
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-purple-500/20 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Welcome back,{" "}
            <span className="bg-linear-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              {user?.name || "Operator"}
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Nexus v2 Fleet Hub • {user?.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openPairModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Pair Device
          </button>
          <a
            href="https://github.com/Kashif-Coder404/nexus-v2/releases/latest/download/nexus.exe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/50 hover:text-white transition-all"
          >
            <Download className="w-4 h-4 text-purple-400" />
            Download v2.5.0
          </a>
        </div>
      </div>

      {/* 2. Real Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fleet Status */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-purple-500/20 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Active Companions
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">
                {onlineDevicesCount}
              </span>
              <span className="text-sm text-zinc-500 font-medium">
                / {devices.length} paired
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  onlineDevicesCount > 0
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-zinc-600"
                }`}
              />
              {onlineDevicesCount > 0
                ? `${onlineDevicesCount} device(s) ready for commands`
                : "No companion currently online"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        {/* Chat Sessions */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-purple-500/20 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Terminal Sessions
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">
                {sessions.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synchronized with cloud database
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* System Core */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-purple-500/20 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Engine Version
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white">Nexus v2.5.0</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span>●</span> Release Ready & Tagged
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real Paired Devices (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Laptop className="w-5 h-5 text-purple-400" />
              Paired Companions
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshDevices}
                title="Refresh Device List"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshingDevices ? "animate-spin text-purple-400" : ""
                  }`}
                />
              </button>
              <button
                onClick={openPairModal}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1 rounded-md hover:bg-purple-950/40 transition cursor-pointer"
              >
                + Pair New
              </button>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Laptop className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white">
                No Companion Paired Yet
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Install Nexus Companion on your Windows PC and pair it to enable
                terminal execution, screenshot streaming, and AI control.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={openPairModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition cursor-pointer"
                >
                  Pair Device Now
                </button>
                <a
                  href="https://github.com/Kashif-Coder404/nexus-v2/releases/latest/download/nexus.exe"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white transition"
                >
                  Download .exe
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-base">
                          {device.deviceName}
                        </h4>
                      </div>
                      <p className="text-xs font-mono text-zinc-500">
                        ID: {device.id.slice(0, 12)}...
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        device.online
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          device.online
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-zinc-500"
                        }`}
                      />
                      {device.online ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      Companion v2.5.0
                    </span>
                    <Link
                      href="/chat"
                      className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300 transition"
                    >
                      Launch Terminal <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick System Demo Prompts for Stage/Auditorium */}
          <div className="p-5 rounded-2xl bg-linear-to-br from-purple-950/20 to-zinc-900/40 border border-purple-500/20 space-y-3 mt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">
                Auditorium Quick Commands
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Click any command to test companion control live in the Chat Terminal:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: "📸 Screenshot", icon: Camera, prompt: "Take a screenshot of my screen" },
                { label: "💻 System Specs", icon: Cpu, prompt: "Show my system hardware and battery info" },
                { label: "📁 List Desktop", icon: Folder, prompt: "List files on my Desktop" },
                { label: "⚡ Terminal Check", icon: Terminal, prompt: "Run PowerShell command to check uptime" },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href="/chat"
                  className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/50 text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-2 transition"
                >
                  <item.icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Real Recent Sessions (1 col on lg) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              Recent Sessions
            </h2>
            <Link
              href="/chat"
              className="text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1 rounded-md hover:bg-purple-950/40 transition"
            >
              Open Terminal
            </Link>
          </div>

          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden">
            {loadingSessions ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                Loading history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-zinc-400">No chat history yet.</p>
                <Link
                  href="/chat"
                  className="inline-block text-xs font-medium text-purple-400 hover:underline"
                >
                  Start your first session →
                </Link>
              </div>
            ) : (
              sessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-purple-500/5 transition group cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-purple-300 truncate transition">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{s.date}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 shrink-0 transition" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
