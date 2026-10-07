"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconDeviceDesktopPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  Laptop,
  MessageSquare,
  Download,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Camera,
  Terminal,
  Cpu,
  Folder,
  Play,
  Video,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useUserCredentials } from "@/app/store/useUserCredentials";
import { useDevices } from "@/app/store/useDevices";
import useChat from "@/app/store/useChat";
import { requestDevices } from "@/services/ws.service";
import useData from "@/app/store/useData";

interface ChatSession {
  id: string;
  title: string;
  date: string;
}

// ---------------------------------------------------------------------------
// DEMO VIDEO CONFIGURATION:
// Set your Recordly video path or embed URL here.
// e.g. "/nexus-demo.mp4" (in frontend/public/) or an external URL.
// ---------------------------------------------------------------------------
const RECORDLY_VIDEO_URL = "";

export default function DashboardUI() {
  const localBackendVersion = useData((state) => state.localBackendVersion);
  const openDownloadAlert = useData((state) => state.openDownloadAlert);
  const router = useRouter();
  const user = useUserCredentials((state) => state.user);
  const token = useUserCredentials((state) => state.token);
  const devices = useDevices((state) => state.devices);
  const openPairModal = useDevices((state) => state.openPairModal);
  const setSession = useChat((state) => state.setSession);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const onlineDevicesCount = devices.filter((d) => d.online).length;

  // Fetch real user sessions from MongoDB backend
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
              { month: "short", day: "numeric" },
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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border/30 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Autonomous Systems Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Welcome,{" "}
            <span className="bg-linear-to-r from-white via-zinc-100 to-brand-glow bg-clip-text text-transparent">
              {user?.name || "Operator"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Connected as <span className="font-mono text-zinc-300">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openPairModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-brand to-brand-hover hover:brightness-110 shadow-md shadow-brand/25 transition-all cursor-pointer active:scale-95"
          >
            <IconDeviceDesktopPlus className="w-4 h-4 text-brand-base" />
            <span>Pair Companion</span>
          </button>
          <button
            type="button"
            onClick={openDownloadAlert}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-zinc-300 bg-brand-surface/60 border border-brand-border/40 hover:border-brand-border/70 hover:text-white transition-all cursor-pointer shadow-sm shadow-brand/10 active:scale-95"
          >
            <Download className="w-4 h-4 text-brand-hover" />
            <span>Download Nexus.exe</span>
          </button>
        </div>
      </div>

      {/* 2. System Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Companion Fleet */}
        <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Active Companions
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white font-mono">
                {onlineDevicesCount}
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                / {devices.length} registered
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  onlineDevicesCount > 0
                    ? "bg-emerald-400"
                    : "bg-zinc-600"
                }`}
              />
              {onlineDevicesCount > 0
                ? `${onlineDevicesCount} daemon ready for execution`
                : "No desktop companion online"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand/10 text-brand-hover border border-brand-border/30">
            <Laptop className="w-5 h-5" />
          </div>
        </div>

        {/* Cloud Session Records */}
        <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Terminal Sessions
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white font-mono">
                {sessions.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synchronized with cloud database
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand/10 text-brand-hover border border-brand-border/30">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Engine Version */}
        <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Engine Version
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white font-mono">
                v{localBackendVersion}
              </span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span>●</span> Production Ready
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand/10 text-brand-hover border border-brand-border/30">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. FEATURED VIDEO SHOWCASE SECTION (RECORDLY DEMO PLAYER) */}
      <section className="rounded-2xl bg-brand-surface/50 border border-brand-border/40 p-5 sm:p-6 backdrop-blur-md space-y-4 shadow-lg shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand-border/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-brand/20 text-brand-glow border border-brand-border/40">
                Live Field Demonstration
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-zinc-400" /> Remote OS Control
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Autonomous Desktop Execution in Action
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Recorded field test showing Nexus remotely searching the filesystem, launching AnyDesk via Windows Shell, capturing screen telemetry, and extracting the access code using computer vision.
            </p>
          </div>

          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-hover hover:text-brand-glow self-start sm:self-center transition"
          >
            <span>Try in Live Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Video Player Box */}
        <div className="relative w-full aspect-video sm:aspect-21/9 max-h-[460px] rounded-xl overflow-hidden bg-black/80 border border-zinc-800 flex items-center justify-center group">
          {RECORDLY_VIDEO_URL ? (
            <video
              src={RECORDLY_VIDEO_URL}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            // Developer Placeholder Ready for User's Video
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-linear-to-b from-brand-surface/30 to-black/90">
              <div className="w-14 h-14 rounded-full bg-brand/20 border border-brand/40 text-brand-hover flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-brand-hover ml-0.5" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  Recordly Demo Video Slot
                </h3>
                <p className="text-xs text-zinc-400">
                  Place your recorded video file in <code className="text-brand-glow bg-zinc-900 px-1.5 py-0.5 rounded font-mono">public/demo.mp4</code> or set the URL in <code className="text-brand-glow bg-zinc-900 px-1.5 py-0.5 rounded font-mono">RECORDLY_VIDEO_URL</code>.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-zinc-400">
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Remote WebSocket Relay
                </span>
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Computer Vision OCR
                </span>
                <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Windows Process Control
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Video Key Moments Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-brand-base/40 border border-brand-border/20 text-xs space-y-1">
            <span className="font-mono text-[10px] font-semibold text-brand-glow">
              01 • Remote Instruction
            </span>
            <p className="text-zinc-200 font-medium">Prompt dispatched over WebSockets</p>
            <p className="text-[11px] text-zinc-500">
              Sent remotely from mobile/college browser to home machine.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand-base/40 border border-brand-border/20 text-xs space-y-1">
            <span className="font-mono text-[10px] font-semibold text-brand-glow">
              02 • App Discovery & Launch
            </span>
            <p className="text-zinc-200 font-medium">AnyDesk spawned via Windows Shell</p>
            <p className="text-[11px] text-zinc-500">
              Scanned filesystem, discovered path, launched detached from terminal.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand-base/40 border border-brand-border/20 text-xs space-y-1">
            <span className="font-mono text-[10px] font-semibold text-brand-glow">
              03 • Screen Inspection
            </span>
            <p className="text-zinc-200 font-medium">Vision OCR extracted session code</p>
            <p className="text-[11px] text-zinc-500">
              Captured desktop frame, extracted remote ID, delivered to user.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Main Grid: Paired Companions & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Paired Companions & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Companions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-brand-hover" />
                <span>Paired Companions</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshDevices}
                  title="Refresh Device List"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition cursor-pointer"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isRefreshingDevices ? "animate-spin text-brand-hover" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={openPairModal}
                  className="text-xs text-brand-hover hover:text-brand-glow font-medium px-2 py-1 rounded-md hover:bg-brand/15 transition cursor-pointer"
                >
                  + Pair New
                </button>
              </div>
            </div>

            {devices.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-brand-border/40 bg-brand-surface/20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-brand/10 text-brand-hover border border-brand-border/30">
                  <Laptop className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    No Companion Paired Yet
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Install Nexus Companion on your Windows machine and pair it to enable terminal execution, screen capture, and remote AI actions.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={openPairModal}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand hover:bg-brand-hover transition cursor-pointer"
                  >
                    Pair Device Now
                  </button>
                  <button
                    type="button"
                    onClick={openDownloadAlert}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-brand-surface/60 border border-brand-border/40 hover:text-white transition cursor-pointer"
                  >
                    Download Daemon
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 rounded-xl bg-brand-surface/30 border border-brand-border/30 hover:border-brand-border/60 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-white text-sm">
                          {device.deviceName}
                        </h4>
                        <p className="text-[11px] font-mono text-zinc-500">
                          ID: {device.id.slice(0, 12)}...
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
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

                    <div className="pt-2 border-t border-brand-border/20 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Companion v{localBackendVersion}
                      </span>
                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-hover hover:text-brand-glow transition"
                      >
                        Open Console <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-brand-surface/30 border border-brand-border/30 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-hover" />
              <h3 className="text-sm font-semibold text-white">
                Live Quick Actions
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Trigger autonomous commands directly in the Chat Console:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                {
                  label: "Screenshot",
                  icon: Camera,
                  desc: "Capture active desktop",
                },
                {
                  label: "System Specs",
                  icon: Cpu,
                  desc: "CPU/RAM diagnostics",
                },
                {
                  label: "List Files",
                  icon: Folder,
                  desc: "Explore active project",
                },
                {
                  label: "PowerShell",
                  icon: Terminal,
                  desc: "Run terminal checks",
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href="/chat"
                  className="p-3 rounded-xl bg-brand-surface/60 border border-brand-border/30 hover:border-brand-border/60 hover:bg-brand-surface/90 text-xs text-zinc-300 hover:text-white flex flex-col gap-1 transition"
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    <item.icon className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate">{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Sessions History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-hover" />
              <span>Recent Sessions</span>
            </h2>
            <Link
              href="/chat"
              className="text-xs text-brand-hover hover:text-brand-glow font-medium px-2 py-1 rounded-md hover:bg-brand/15 transition"
            >
              Open Console
            </Link>
          </div>

          <div className="rounded-2xl bg-brand-surface/30 border border-brand-border/30 divide-y divide-brand-border/20 overflow-hidden">
            {loadingSessions ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                Loading history...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-zinc-400">No chat history yet.</p>
                <Link
                  href="/chat"
                  className="inline-block text-xs font-medium text-brand-hover hover:text-brand-glow hover:underline"
                >
                  Start your first session →
                </Link>
              </div>
            ) : (
              sessions.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-brand/10 transition group cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-brand-glow truncate transition">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{s.date}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-brand-hover shrink-0 transition" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
