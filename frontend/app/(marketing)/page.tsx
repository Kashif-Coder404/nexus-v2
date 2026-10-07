"use client";

import React, { useState, useRef } from "react";
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
  Play,
  Video,
  Activity,
  Layers,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Radio,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useUserCredentials } from "../store/useUserCredentials";
import useData from "../store/useData";

export default function Home() {
  const user = useUserCredentials((state) => state.user);
  const localBackendVersion = useData((state) => state.localBackendVersion);
  const openDownloadAlert = useData((state) => state.openDownloadAlert);

  const [copied, setCopied] = useState(false);
  const [videoSrc, setVideoSrc] = useState("/demo.mp4");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const [videoHasError, setVideoHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const copyCommand = () => {
    navigator.clipboard.writeText("nexus --start-server");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrlInput.trim()) {
      setVideoSrc(customUrlInput.trim());
      setVideoHasError(false);
      setShowUrlField(false);
    }
  };

  const scrollToDemo = () => {
    const el = document.getElementById("demo-video");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-20">
      {/* Subtle Background Lighting Accent */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-brand/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* ============================================================
          1. HERO SECTION
          ============================================================ */}
      <section className="flex flex-col lg:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-12 lg:gap-16 pt-2">
        {/* Left Side: Pitch, CTAs & Command */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1 max-w-xl">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface/80 border border-brand-border/40 text-xs font-medium text-brand-glow mb-6 shadow-sm shadow-brand/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nexus v{localBackendVersion} • Autonomous Windows Agent</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop Chatting. <br />
            <span className="bg-gradient-to-r from-white via-zinc-100 to-brand-glow bg-clip-text text-transparent">
              Put Things to Work.
            </span>
          </h1>

          {/* Description */}
          <p className="mt-5 text-base sm:text-lg text-zinc-300 leading-relaxed">
            Control your Windows PC using natural language and vision AI.
            Nexus connects high-speed Groq reasoning to your local machine via
            sub-50ms WebSockets—running shell commands, inspecting UI, and
            streaming telemetry to a unified console.
          </p>

          {/* Example Command Chips */}
          <div className="mt-5 flex flex-wrap gap-2 justify-center lg:justify-start">
            <span className="text-xs p-2 rounded-lg bg-brand-surface/60 border border-brand-border/30 text-zinc-300 hover:border-brand-border/60 transition">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                "Check CPU & GPU telemetry"
              </span>
            </span>
            <span className="text-xs p-2 rounded-lg bg-brand-surface/60 border border-brand-border/30 text-zinc-300 hover:border-brand-border/60 transition">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                "Find all .env files on Desktop"
              </span>
            </span>
            <span className="text-xs p-2 rounded-lg bg-brand-surface/60 border border-brand-border/30 text-zinc-300 hover:border-brand-border/60 transition">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-brand-hover shrink-0" />
                "Open project in VSCode"
              </span>
            </span>
          </div>

          {/* Action CTAs */}
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
              onClick={scrollToDemo}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-surface/70 hover:bg-brand-surface border border-brand-border/40 hover:border-brand-border/70 text-zinc-200 hover:text-white text-sm font-semibold transition-all cursor-pointer shadow-sm shadow-brand/20 active:scale-95"
            >
              <Play className="w-4 h-4 text-brand-hover fill-brand-hover/30" />
              <span>Watch Demo</span>
            </button>

            <button
              type="button"
              onClick={openDownloadAlert}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-500 text-zinc-300 hover:text-white text-sm font-medium transition-all cursor-pointer active:scale-95"
              title="Download Windows standalone binary"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>.exe Binary</span>
            </button>
          </div>

          {/* Quick CLI command */}
          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-surface/50 border border-brand-border/30 text-xs font-mono text-zinc-400">
            <span className="text-brand-hover">$</span>
            <span>nexus --start-server</span>
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

        {/* Right Side: Hero App Window Frame */}
        <div className="w-full flex-1 max-w-xl lg:max-w-2xl flex flex-col rounded-2xl border border-brand-border/40 bg-brand-surface/40 shadow-2xl backdrop-blur-md overflow-hidden transition-all hover:border-brand-border/70">
          {/* Window Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand-border/30 bg-brand-surface/70">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Nexus Console • WebSocket Live</span>
            </div>
            <span className="text-[11px] font-mono text-brand-hover px-2 py-0.5 rounded bg-brand/10 border border-brand-border/30">
              42ms RTT
            </span>
          </div>

          {/* Real App Screenshot Preview */}
          <div className="p-2.5 bg-black/60 relative group">
            <img
              src="https://i.ibb.co/LXdJ74yJ/Screenshot-2026-09-12-202908.png"
              alt="Nexus Dashboard Preview"
              className="w-full h-auto object-cover rounded-lg border border-brand-border/20 shadow-inner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-base/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold shadow-lg hover:brightness-110 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Jump to Video Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. RECORDLY VIDEO DEMO SECTION (FOR JUDGES & VISITORS)
          ============================================================ */}
      <section
        id="demo-video"
        className="w-full max-w-5xl mx-auto flex flex-col items-center text-center scroll-mt-24 space-y-6"
      >
        {/* Section Header */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface/70 border border-brand-border/40 text-xs font-medium text-brand-glow">
            <Video className="w-3.5 h-3.5 text-brand-hover" />
            <span>Field Recording • Live Video Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See Nexus v2 in Action
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Watch how Nexus parses complex natural language instructions,
            analyzes the desktop screen with vision models, executes native
            Windows PowerShell commands, and streams step-by-step logs.
          </p>
        </div>

        {/* Video Player Window Container */}
        <div className="w-full rounded-2xl border border-brand-border/40 bg-brand-surface/30 shadow-2xl backdrop-blur-md overflow-hidden text-left">
          {/* Player Window Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border/30 bg-brand-surface/70">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-zinc-300 ml-2 hidden sm:inline">
                nexus-desktop-runner-demo.mp4
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                1080p 60fps
              </span>
              <button
                type="button"
                onClick={() => setShowUrlField(!showUrlField)}
                className="text-xs text-zinc-400 hover:text-brand-glow transition cursor-pointer flex items-center gap-1 underline underline-offset-4"
                title="Change video source URL"
              >
                <span>{showUrlField ? "Hide URL" : "Custom Video Link"}</span>
              </button>
            </div>
          </div>

          {/* Optional Custom Video / Recordly Embed Input */}
          {showUrlField && (
            <form
              onSubmit={handleApplyCustomUrl}
              className="px-4 py-2.5 bg-brand-surface/90 border-b border-brand-border/30 flex items-center gap-2 text-xs"
            >
              <span className="text-zinc-400 shrink-0 font-mono">Video URL:</span>
              <input
                type="text"
                placeholder="e.g. /demo.mp4 or https://... (Recordly / MP4)"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-brand-border/40 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-hover text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold transition cursor-pointer"
              >
                Apply
              </button>
            </form>
          )}

          {/* Main Video Area */}
          <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
            {videoSrc.includes("<iframe") ? (
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: videoSrc }}
              />
            ) : (
              <video
                ref={videoRef}
                src={videoSrc}
                poster="https://i.ibb.co/LXdJ74yJ/Screenshot-2026-09-12-202908.png"
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-contain bg-black"
                onError={() => setVideoHasError(true)}
              >
                Your browser does not support the video tag.
              </video>
            )}

            {/* Graceful Fallback Overlay if demo.mp4 is not yet uploaded */}
            {videoHasError && (
              <div className="absolute inset-0 bg-brand-base/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-brand-surface/90 border border-brand-border/60 flex items-center justify-center shadow-lg shadow-brand/20">
                  <Video className="w-7 h-7 text-brand-hover" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-lg font-bold text-white">
                    Recordly Field Demo Video Slot
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Place your demo recording at{" "}
                    <code className="text-brand-glow font-mono px-1 py-0.5 rounded bg-brand-surface border border-brand-border/40">
                      frontend/public/demo.mp4
                    </code>{" "}
                    or click "Custom Video Link" above to paste your hosted URL.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoHasError(false);
                      if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    Retry /demo.mp4
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlField(true)}
                    className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-surface/80 border border-brand-border/40 text-zinc-300 text-xs font-medium transition cursor-pointer"
                  >
                    Paste Video URL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Under Video: 4 Milestone Chapters */}
          <div className="p-4 sm:p-5 border-t border-brand-border/30 bg-brand-surface/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="font-mono text-brand-hover bg-brand/10 px-1.5 py-0.5 rounded border border-brand-border/30">
                  00:15
                </span>
                <span>WebSocket Handshake</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Zero-config device pairing with local biometric / token auth.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="font-mono text-brand-hover bg-brand/10 px-1.5 py-0.5 rounded border border-brand-border/30">
                  00:48
                </span>
                <span>Native Shell Execution</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Groq LLaMA-3.3 decomposes tasks into verified PowerShell commands.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="font-mono text-brand-hover bg-brand/10 px-1.5 py-0.5 rounded border border-brand-border/30">
                  01:25
                </span>
                <span>Vision Grounding</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Screen capture + Qwen2.5-VL OCR detects UI coordinates for actions.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-brand-surface/50 border border-brand-border/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="font-mono text-brand-hover bg-brand/10 px-1.5 py-0.5 rounded border border-brand-border/30">
                  02:00
                </span>
                <span>Real-Time Telemetry</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Live CPU/GPU vitals and step terminal audit with error recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. CORE ARCHITECTURE HIGHLIGHTS (BUILT FOR JUDGES)
          ============================================================ */}
      <section className="w-full max-w-6xl mx-auto flex flex-col items-center space-y-8">
        <div className="text-center space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface/70 border border-brand-border/40 text-xs font-medium text-brand-glow">
            <Layers className="w-3.5 h-3.5 text-brand-hover" />
            <span>Under The Hood</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built for Real-World Execution
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            A real-time bridge connecting browser clients directly to Windows
            operating system kernels without cloud intermediaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Card 1: WebSocket Gateway */}
          <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
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

          {/* Card 2: Groq + Vision AI */}
          <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
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

          {/* Card 3: Native Host Runner */}
          <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover mb-3">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Native Host Runner
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

          {/* Card 4: Dual Terminal & Audit */}
          <div className="p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/30 hover:border-brand-border/60 transition-all space-y-3 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                Step-by-Step Auditability
              </h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Live sanitized xterm.js terminal stream, execution timeline
                checkpoints, and multi-screenshot audit trail for complete safety.
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-brand-border/20">
              Full Human-in-the-Loop
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. HOW TO TEST & VERIFY (JUDGE'S QUICK CHECKLIST)
          ============================================================ */}
      <section className="w-full max-w-4xl mx-auto rounded-2xl border border-brand-border/40 bg-gradient-to-br from-brand-surface/60 via-brand-surface/30 to-brand-base/80 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/30 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-hover" />
              <h3 className="text-lg font-bold text-white">
                Judge & Reviewer Evaluation Guide
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Follow these 3 quick steps to verify local agent execution:
            </p>
          </div>
          <button
            type="button"
            onClick={openDownloadAlert}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-md transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Companion</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand-border/40 text-brand-glow text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-xs font-semibold text-white">
                Clone or Download
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Grab the latest release binary from GitHub Releases or run the
              Python companion locally.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand-border/40 text-brand-glow text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-xs font-semibold text-white">
                Start Daemon
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Execute <code className="text-brand-glow font-mono">nexus --start-server</code> in PowerShell to begin listening for incoming WebSocket tasks.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand/20 border border-brand-border/40 text-brand-glow text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-xs font-semibold text-white">
                Control from Web
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Launch the web console, send any natural language command, and
              watch your Windows desktop react in real time.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. DEVELOPER FOOTER
          ============================================================ */}
      <footer className="w-full max-w-6xl mx-auto pt-8 border-t border-brand-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">Nexus v2</span>
          <span>•</span>
          <span>Autonomous Windows Desktop Agent</span>
          <span>•</span>
          <span className="text-brand-hover font-mono">v{localBackendVersion}</span>
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
