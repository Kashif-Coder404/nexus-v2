"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  HardDrive,
  Terminal,
  Zap,
  Radio,
  Search,
  ArrowUpRight,
  Laptop,
  Play,
  Sparkles,
  Clock,
  Server,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Command,
  Flame,
} from "lucide-react";

interface DeviceNode {
  id: string;
  name: string;
  type: "desktop" | "laptop" | "server";
  os: string;
  status: "online" | "offline";
  ip: string;
  cpuUsage: number;
  ramUsage: number;
  gpuTemp?: number;
  lastSeen?: string;
  companionVersion: string;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  status: "success" | "pending" | "failed";
  type: "search" | "cmd" | "ai" | "telemetry";
}

const initialDevices: DeviceNode[] = [
  {
    id: "dev-1",
    name: "Gaming PC",
    type: "desktop",
    os: "Windows 11 Pro",
    status: "online",
    ip: "192.168.1.104",
    cpuUsage: 26,
    ramUsage: 48,
    gpuTemp: 44,
    companionVersion: "v2.1.0",
  },
  {
    id: "dev-2",
    name: "Work PC",
    type: "desktop",
    os: "WSL 2 / Ubuntu 24.04",
    status: "online",
    ip: "192.168.1.115",
    cpuUsage: 14,
    ramUsage: 36,
    companionVersion: "v2.1.0",
  },
  {
    id: "dev-3",
    name: "College Laptop",
    type: "laptop",
    os: "Windows 11 Home",
    status: "offline",
    ip: "192.168.1.140",
    cpuUsage: 0,
    ramUsage: 0,
    lastSeen: "2 hours ago",
    companionVersion: "v2.0.8",
  },
];

const initialActivities: ActivityItem[] = [
  {
    id: "act-1",
    timestamp: "2 mins ago",
    action: 'voidtools.search("*.pdf project notes")',
    target: "Gaming PC",
    status: "success",
    type: "search",
  },
  {
    id: "act-2",
    timestamp: "8 mins ago",
    action: "AI ReAct: Orchestrated multi-screen workspace setup",
    target: "Gaming PC",
    status: "success",
    type: "ai",
  },
  {
    id: "act-3",
    timestamp: "25 mins ago",
    action: "RunCMD: git fetch && npm run build",
    target: "Work PC",
    status: "success",
    type: "cmd",
  },
  {
    id: "act-4",
    timestamp: "1 hour ago",
    action: "Companion Telemetry Sync & Health Check",
    target: "All Nodes",
    status: "success",
    type: "telemetry",
  },
];

export default function DashboardUI() {
  const [devices] = useState<DeviceNode[]>(initialDevices);
  const [activities] = useState<ActivityItem[]>(initialActivities);
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [quickCmd, setQuickCmd] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredDevices = devices.filter((dev) => {
    if (filter === "online") return dev.status === "online";
    if (filter === "offline") return dev.status === "offline";
    return true;
  });

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Barometer & Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-purple-900/30">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/40 text-purple-300 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM TELEMETRY NOMINAL
            </span>
            <span className="text-xs text-[#8A859E]">WS Gateway :3100</span>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="bg-linear-to-r from-[#DCD3FF] via-[#c4b5fd] to-[#9129b6] bg-clip-text text-transparent">
              Operator Console
            </span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-[#8A859E]">
            Real-time companion coordination, desktop automation & node
            telemetry.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-purple-200 bg-[#160E33] border border-purple-500/30 hover:bg-[#1E1345] hover:border-purple-400/50 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-950/40"
          >
            <RefreshCw
              className={`w-4 h-4 text-purple-400 ${isSyncing ? "animate-spin" : ""}`}
            />
            <span>{isSyncing ? "Syncing..." : "Sync Nodes"}</span>
          </button>
          <Link
            href="/chat"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-[#7357E2] to-[#9129b6] shadow-lg shadow-purple-950/60 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Launch AI Terminal</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Telemetry Cards (4-Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Connected Devices */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#0D091F]/70 border border-purple-500/20 p-5 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A859E] uppercase tracking-wider">
              Connected Nodes
            </span>
            <div className="p-2.5 rounded-xl bg-purple-900/30 text-purple-300 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Laptop className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              2
            </span>
            <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
            <span className="text-xs text-[#8A859E]">/ 3 Total</span>
          </div>
          <p className="mt-2 text-xs text-purple-300/70">
            Gaming PC & Work PC responsive
          </p>
        </div>

        {/* Metric 2: Automations Run */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#0D091F]/70 border border-purple-500/20 p-5 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A859E] uppercase tracking-wider">
              Autonomous Tasks
            </span>
            <div className="p-2.5 rounded-xl bg-purple-900/30 text-purple-300 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              142
            </span>
            <span className="text-xs font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/30">
              99.2% Success
            </span>
          </div>
          <p className="mt-2 text-xs text-purple-300/70">
            +18 executed in last 24 hours
          </p>
        </div>

        {/* Metric 3: Search Engine Index */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#0D091F]/70 border border-purple-500/20 p-5 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A859E] uppercase tracking-wider">
              Voidtools Index
            </span>
            <div className="p-2.5 rounded-xl bg-purple-900/30 text-purple-300 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              1.4M
            </span>
            <span className="text-xs text-emerald-400 font-medium">Synced</span>
          </div>
          <p className="mt-2 text-xs text-purple-300/70">
            Instant filesystem queries &lt; 15ms
          </p>
        </div>

        {/* Metric 4: AI ReAct Engine */}
        <div className="group relative overflow-hidden rounded-2xl bg-[#0D091F]/70 border border-purple-500/20 p-5 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8A859E] uppercase tracking-wider">
              ReAct AI Engine
            </span>
            <div className="p-2.5 rounded-xl bg-purple-900/30 text-purple-300 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              Active
            </span>
            <span className="text-xs font-medium text-purple-300">
              NIM / Gemini
            </span>
          </div>
          <p className="mt-2 text-xs text-purple-300/70">
            User memory & context linked
          </p>
        </div>
      </div>

      {/* 3. Quick Automation Bar */}
      <div className="rounded-2xl bg-linear-to-r from-[#160E33]/90 via-[#1C123F]/80 to-[#120B29]/90 border border-purple-500/30 p-4 sm:p-5 backdrop-blur-xl shadow-xl shadow-purple-950/30">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Quick Automation Dispatcher
              </h2>
              <p className="text-xs text-[#8A859E]">
                Send an instant prompt or shell command across your active nodes
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickCmd}
                onChange={(e) => setQuickCmd(e.target.value)}
                placeholder="e.g. 'search downloads for invoice.pdf' or 'check GPU temperature'..."
                className="w-full rounded-xl bg-[#090614]/90 border border-purple-500/30 px-4 py-2.5 text-sm text-white placeholder-purple-300/40 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
              />
            </div>
            <Link
              href={
                quickCmd
                  ? `/chat?prompt=${encodeURIComponent(quickCmd)}`
                  : "/chat"
              }
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-[#7357E2] to-[#9129b6] hover:scale-105 active:scale-95 transition-all text-nowrap cursor-pointer shadow-md shadow-purple-950/40"
            >
              <Play className="w-4 h-4 mr-1.5 fill-white" />
              Execute
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Main Section: Connected Devices & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Connected Companion Devices */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Live Companion Nodes
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center rounded-xl bg-[#0E0921] p-1 border border-purple-500/20 text-xs">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === "all"
                    ? "bg-purple-600/40 text-white font-semibold shadow-xs"
                    : "text-[#8A859E] hover:text-white"
                }`}
              >
                All ({devices.length})
              </button>
              <button
                onClick={() => setFilter("online")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === "online"
                    ? "bg-purple-600/40 text-white font-semibold shadow-xs"
                    : "text-[#8A859E] hover:text-white"
                }`}
              >
                Online (2)
              </button>
              <button
                onClick={() => setFilter("offline")}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === "offline"
                    ? "bg-purple-600/40 text-white font-semibold shadow-xs"
                    : "text-[#8A859E] hover:text-white"
                }`}
              >
                Offline (1)
              </button>
            </div>
          </div>

          {/* Node Cards */}
          <div className="space-y-4">
            {filteredDevices.map((device) => {
              const isOnline = device.status === "online";
              return (
                <div
                  key={device.id}
                  className={`group relative rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 ${
                    isOnline
                      ? "bg-[#0D091F]/80 border-purple-500/30 hover:border-purple-400/60 shadow-lg shadow-purple-950/20"
                      : "bg-[#0A0717]/50 border-purple-900/20 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Device Identity */}
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl border ${
                          isOnline
                            ? "bg-purple-900/30 border-purple-500/40 text-purple-300"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {isOnline ? (
                          <Wifi className="w-6 h-6 text-purple-300" />
                        ) : (
                          <WifiOff className="w-6 h-6 text-zinc-500" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {device.name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isOnline
                                ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                                : "bg-zinc-900 text-zinc-400 border-zinc-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOnline
                                  ? "bg-emerald-400 animate-pulse"
                                  : "bg-zinc-500"
                              }`}
                            />
                            {isOnline ? "ONLINE" : "STANDBY"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#8A859E]">
                          <span>{device.os}</span>
                          <span>•</span>
                          <span className="font-mono text-purple-300/80">
                            {device.ip}
                          </span>
                          <span>•</span>
                          <span>{device.companionVersion}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Node Controls */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat?target=${device.id}`}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                          isOnline
                            ? "bg-purple-600/30 text-purple-200 border-purple-500/40 hover:bg-purple-600/50"
                            : "bg-zinc-900/40 text-zinc-500 border-zinc-800 pointer-events-none"
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Terminal
                      </Link>
                      <button
                        title="Node Details"
                        className="p-1.5 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-900/30 border border-transparent hover:border-purple-500/30 transition cursor-pointer"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Hardware Telemetry Progress Bars (Only if online) */}
                  {isOnline ? (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-purple-900/30">
                      {/* CPU */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#8A859E] flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-purple-400" />
                            CPU Load
                          </span>
                          <span className="font-semibold text-white">
                            {device.cpuUsage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-purple-950/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                            style={{ width: `${device.cpuUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* RAM */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#8A859E] flex items-center gap-1">
                            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                            Memory
                          </span>
                          <span className="font-semibold text-white">
                            {device.ramUsage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-purple-950/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#7357E2] to-[#9129b6] rounded-full transition-all duration-500"
                            style={{ width: `${device.ramUsage}%` }}
                          />
                        </div>
                      </div>

                      {/* GPU or Extra */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[#8A859E] flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            GPU Thermals
                          </span>
                          <span className="font-semibold text-white">
                            {device.gpuTemp ? `${device.gpuTemp}°C` : "N/A"}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-purple-950/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{
                              width: device.gpuTemp
                                ? `${(device.gpuTemp / 90) * 100}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-purple-900/20 text-xs text-zinc-500 flex items-center justify-between">
                      <span>
                        Node is in sleep mode. Last heartbeat: {device.lastSeen}
                      </span>
                      <button className="text-purple-400 hover:underline cursor-pointer">
                        Send Wake-on-LAN
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Activity Feed & System Hub */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="rounded-2xl bg-[#0D091F]/70 border border-purple-500/20 p-5 backdrop-blur-xl shadow-xl shadow-purple-950/30">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-purple-400" />
              Companion Triggers
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/chat?preset=screenshot"
                className="p-3 rounded-xl bg-[#140D2E] border border-purple-500/20 hover:border-purple-400/50 hover:bg-[#1C123F] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center justify-between text-purple-300">
                  <Activity className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="mt-2 text-xs font-bold text-white">
                  Capture Screen
                </div>
                <div className="text-[10px] text-[#8A859E]">
                  Display 1 Preview
                </div>
              </Link>

              <Link
                href="/chat?preset=everything"
                className="p-3 rounded-xl bg-[#140D2E] border border-purple-500/20 hover:border-purple-400/50 hover:bg-[#1C123F] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center justify-between text-purple-300">
                  <Search className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="mt-2 text-xs font-bold text-white">
                  Find Files
                </div>
                <div className="text-[10px] text-[#8A859E]">
                  Voidtools Fast Scan
                </div>
              </Link>

              <Link
                href="/chat?preset=shell"
                className="p-3 rounded-xl bg-[#140D2E] border border-purple-500/20 hover:border-purple-400/50 hover:bg-[#1C123F] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center justify-between text-purple-300">
                  <Terminal className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="mt-2 text-xs font-bold text-white">
                  Run Command
                </div>
                <div className="text-[10px] text-[#8A859E]">
                  PowerShell / Bash
                </div>
              </Link>

              <Link
                href="/chat"
                className="p-3 rounded-xl bg-[#140D2E] border border-purple-500/20 hover:border-purple-400/50 hover:bg-[#1C123F] transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center justify-between text-purple-300">
                  <Radio className="w-4 h-4" />
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="mt-2 text-xs font-bold text-white">
                  Ask AI ReAct
                </div>
                <div className="text-[10px] text-[#8A859E]">
                  Multi-Step Execution
                </div>
              </Link>
            </div>
          </div>

          {/* Activity Log Feed */}
          <div className="rounded-2xl bg-[#0D091F]/70 border border-purple-500/20 p-5 backdrop-blur-xl shadow-xl shadow-purple-950/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Recent Activity Log
              </h3>
              <span className="text-[10px] font-mono text-purple-300/80 bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-500/20">
                LIVE FEED
              </span>
            </div>

            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl bg-[#080512]/80 border border-purple-900/20 p-3 text-xs transition hover:border-purple-500/30"
                >
                  <div className="flex items-center justify-between text-[#8A859E] mb-1">
                    <span className="font-mono text-[10px] text-purple-300">
                      {act.target}
                    </span>
                    <span className="text-[10px]">{act.timestamp}</span>
                  </div>
                  <div className="text-white font-mono font-medium truncate">
                    {act.action}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Success
                    </span>
                    <span className="uppercase text-[9px] text-[#8A859E] font-semibold">
                      {act.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
