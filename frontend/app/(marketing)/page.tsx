"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  Terminal,
  Cpu,
  Search,
  Zap,
  Folder,
  Code,
  Activity,
  Layers,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Radio,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
} from "lucide-react";
import { useUserCredentials } from "../store/useUserCredentials";
import useData from "../store/useData";

export default function Home() {
  const user = useUserCredentials((state) => state.user);
  const localBackendVersion = useData((state) => state.localBackendVersion);
  const openDownloadAlert = useData((state) => state.openDownloadAlert);

  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("nexus --start");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-14 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-24">
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[680px] h-[320px] bg-brand/15 blur-[150px] rounded-full pointer-events-none -z-10" />

      <section className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-12 lg:gap-16 pt-2">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface/80 border border-brand-border/40 text-xs font-medium text-brand-glow mb-6 shadow-sm shadow-brand/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Nexus v{localBackendVersion} • Autonomous Windows Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Stop Chatting. <br />
            <span className="bg-gradient-to-r from-white via-zinc-100 to-brand-glow bg-clip-text text-transparent">
              Put Things to Work.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            Control your Windows PC from anywhere with natural language and
            vision AI. Nexus connects high-speed Groq reasoning to your local
            operating system via sub-50ms WebSockets—running shell scripts,
            navigating UI, and streaming hardware vitals in real time.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 justify-center lg:justify-start">
            <span className="text-xs p-2 rounded-lg bg-brand-surface/60 border border-brand-border/30 text-zinc-300 hover:border-brand-border/60 transition cursor-default">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                "Check CPU & GPU thermals"
              </span>
            </span>
            <span className="text-xs p-2 rounded-lg bg-brand-surface/60 border border-brand-border/30 text-zinc-300 hover:border-brand-border/60 transition cursor-default">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                "Find all .env files on Desktop"
              </span>
            </span>
            <span className="text-xs p-2 rounded-lg bg-brand-surface/60 border border-brand-border/30 text-zinc-300 hover:border-brand-border/60 transition cursor-default">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                "Open project in VSCode"
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8 justify-center lg:justify-start">
            <Link
              href={user ? `/dashboard` : `/auth/signup`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-brand-hover hover:brightness-110 text-white font-semibold text-sm transition-all shadow-lg shadow-brand/30 cursor-pointer active:scale-95"
            >
              <span>{user ? "Open Dashboard" : "Launch Console"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={openDownloadAlert}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-surface/70 hover:bg-brand-surface border border-brand-border/40 hover:border-brand-border/70 text-zinc-200 hover:text-white text-sm font-semibold transition-all cursor-pointer shadow-sm shadow-brand/20 active:scale-95"
              title="Download Windows standalone binary"
            >
              <Download className="w-4 h-4 text-brand-hover" />
              <span>Download Nexus.exe</span>
            </button>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-surface/50 border border-brand-border/30 text-xs font-mono text-zinc-400">
            <span className="text-brand-hover">$</span>
            <span>nexus --start</span>
            <button
              onClick={copyCommand}
              className="p-1 hover:text-white transition-colors cursor-pointer ml-1 text-zinc-400"
              title="Copy CLI command"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="w-full flex-1 max-w-xl lg:max-w-2xl flex flex-col rounded-2xl border border-brand-border/40 bg-brand-surface/40 shadow-2xl backdrop-blur-md overflow-hidden transition-all hover:border-brand-border/70">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-border/30 bg-brand-surface/70">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Nexus Console • Duplex Stream</span>
            </div>
            <span className="text-[11px] font-mono text-brand-hover px-2 py-0.5 rounded bg-brand/10 border border-brand-border/30">
              42ms RTT
            </span>
          </div>

          <div className="p-2.5 bg-black/60 relative">
            <img
              src="https://i.ibb.co/LXdJ74yJ/Screenshot-2026-09-12-202908.png"
              alt="Nexus Dashboard Preview"
              className="w-full h-auto object-cover rounded-lg border border-brand-border/20 shadow-inner"
            />
          </div>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-8">
        <div className="text-center space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface/70 border border-brand-border/40 text-xs font-medium text-brand-glow">
            <Layers className="w-3.5 h-3.5 text-brand-hover" />
            <span>Architecture & Design</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Low Latency & Control
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            A bi-directional pipeline connecting your web console directly to
            Windows system internals with zero cloud middleware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="p-5 rounded-2xl bg-brand-surface/80 border border-brand-border/20 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Duplex WebSocket Gateway
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Sub-50ms bi-directional protocol with automatic reconnect,
                heartbeat watchdog, and binary screenshot buffer streaming.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-brand-border/20">
              Low-latency RPC
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-brand-surface/80 border border-brand-border/20 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Groq Reasoning & Vision
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Groq LLaMA-3.3-70B running at 300+ tok/s paired with Qwen2.5-VL
                for pixel-accurate UI coordinate grounding.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-brand-border/20">
              Fast Model Pipeline
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-brand-surface/80 border border-brand-border/20 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover mb-3">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Native Host Companion
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Lightweight Python & FastMCP companion executing PowerShell 7,
                file operations, and window management with sandbox protections.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-brand-border/20">
              Windows 11 Native
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-brand-surface/80 border border-brand-border/20 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Step-by-Step Auditability
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Live sanitized xterm.js terminal stream, execution timeline
                checkpoints, and multi-screenshot audit trail for complete
                safety.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-brand-border/20">
              Full Human-in-the-Loop
            </span>
          </div>
        </div>
      </section>

      <section className="w-full max-w-5xl mx-auto rounded-2xl border border-brand-border/30 bg-brand-surface/30 p-6 sm:p-8 backdrop-blur-md">
        <div className="text-center space-y-2 max-w-xl mx-auto mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Beyond Browser-Trapped Chatbots
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Most AI assistants stop at text generation. Nexus bridges thought to
            action directly on your machine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-black/40 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400">
                Standard Web Chatbots
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                Text Only
              </span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Isolated inside the web browser sandbox</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  Cannot execute local PowerShell or terminal commands
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Blind to active desktop windows and screen state</span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Requires manual copy-pasting of scripts and logs</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-brand-surface/70 border border-brand-border/50 space-y-4 shadow-lg shadow-brand/10">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/30">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-hover" />
                Nexus v2 Companion
              </span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Action Driven
              </span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Native Windows OS execution via lightweight companion
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Sub-50ms duplex WebSocket with real-time process control
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Vision OCR screen grounding detects and interacts with UI
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time hardware sensors (CPU, GPU, RAM, temps)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="w-full max-w-4xl mx-auto rounded-2xl border border-brand-border/40 bg-gradient-to-br from-brand-surface/60 via-brand-surface/30 to-brand-base/80 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/30 pb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-hover" />
              Get Started in 60 Seconds
            </h3>
            <p className="text-xs text-zinc-400">
              Three simple steps to connect and control your Windows machine:
            </p>
          </div>
          <button
            type="button"
            onClick={openDownloadAlert}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-md transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Binary</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand-border/40 text-brand-glow text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-semibold text-white">
                Download Companion
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Grab the standalone{" "}
              <code className="text-brand-glow font-mono">nexus.exe</code>{" "}
              binary or run via Python with zero external prerequisites.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand-border/40 text-brand-glow text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-semibold text-white">
                Launch Daemon
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Run{" "}
              <code className="text-brand-glow font-mono">nexus --start</code>{" "}
              in PowerShell to initiate the authenticated WebSocket daemon.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand-border/40 text-brand-glow text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-semibold text-white">
                Command Anywhere
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Open the web console from your phone or browser, send prompts, and
              watch your PC execute in real time.
            </p>
          </div>
        </div>
      </section>

      <footer className="w-full max-w-6xl mx-auto pt-8 border-t border-brand-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">Nexus v2</span>
          <span>•</span>
          <span>Autonomous Windows Desktop Platform</span>
          <span>•</span>
          <span className="text-brand-hover font-mono">
            v{localBackendVersion}
          </span>
        </div>

        <div className="flex items-center gap-4 text-zinc-400">
          <Link
            href={user ? "/dashboard" : "/auth/login"}
            className="hover:text-white transition"
          >
            Console
          </Link>
          <a
            href="https://github.com/Kashif-Coder404/nexus-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition flex items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={openDownloadAlert}
            className="hover:text-white transition cursor-pointer"
          >
            Releases
          </button>
        </div>
      </footer>
    </div>
  );
}
