"use client";

import React, { useEffect, useState } from "react";
import { Device, useDevices } from "../store/useDevices";
import { livewebsocket } from "@/services/liveFeedWs.service";
import {
  Cpu,
  HardDrive,
  Clock,
  Wifi,
  User,
  Laptop,
  Radio,
  Pencil,
  Trash2,
} from "lucide-react";

interface SystemInfo {
  os?: {
    platform: string;
    type: string;
    release: string;
    arch: string;
    hostname: string;
    uptimeHours: string;
  };
  cpu?: {
    model: string;
    cores: number;
    speedMHz: number;
  };
  memory?: {
    totalGB: string;
    freeGB: string;
    usedGB: string;
    usagePercentage: string;
  };
  userInfo?: {
    username: string;
    homedir: string;
  };
}

const Devices = ({ device }: { device: Device }) => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const currentDevice = useDevices((state) => {
    return state.devices.find((d) => d.id === device.id);
  });
  const isDeviceOnline = Boolean(currentDevice?.online && isConnected);
  useEffect(() => {
    if (!currentDevice?.ipAddress || !currentDevice?.online) {
      setIsConnected(false);
      return;
    }
    const socket = livewebsocket(
      currentDevice.ipAddress,
      (msg) => setData(msg),
      (connected) => setIsConnected(connected),
    );
    return () => {
      socket?.close();
      setIsConnected(false);
    };
  }, [currentDevice?.ipAddress, currentDevice?.online]);

  // Safely extract system info whether wrapped or raw
  let sysInfo: SystemInfo | null = null;
  try {
    const raw = data?.data
      ? typeof data.data === "string"
        ? JSON.parse(data.data)
        : data.data
      : data;
    if (raw?.info) {
      sysInfo = typeof raw.info === "string" ? JSON.parse(raw.info) : raw.info;
    } else {
      sysInfo = raw;
    }
  } catch {
    sysInfo = null;
  }

  const ramPercentNumber = parseFloat(sysInfo?.memory?.usagePercentage || "0");

  return (
    <div className="relative w-full max-w-2xl p-5 rounded-2xl bg-brand-surface/70 border border-brand-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl text-white space-y-5 transition-all">
      {/* 1. Header: Device Name, IP, Live Pulse */}
      <div className="flex flex-col gap-3 border-b border-brand-border/30 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: icon + info */}
        {/* 1. Header: Top row (Title + Actions), Bottom row (Hostname + IP) */}
        <div className="border-b border-brand-border/30 pb-4 space-y-2.5">
          {/* Top Row: Device Name & Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Icon & Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover shadow-sm">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  {device.deviceName}
                </h2>
                <button
                  type="button"
                  className="text-zinc-400 hover:text-brand-hover transition-colors p-0.5 rounded shrink-0"
                  title="Rename device"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Live Badge & Revoke Button */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs font-semibold shrink-0 transition-all ${
                  isDeviceOnline
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <Radio
                  className={`w-3.5 h-3.5 ${isDeviceOnline ? "animate-pulse text-emerald-400" : "text-rose-400"}`}
                />
                <span className="font-mono text-[11px] sm:text-xs">
                  {isDeviceOnline ? "LIVE STREAM" : "OFFLINE"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                title="Revoke device"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs">Revoke</span>
              </button>
            </div>
          </div>

          {/* Subtitle Row: Hostname and IP (Full width, no squishing) */}
          <div className="pl-[52px] flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-zinc-400">
            <span>({sysInfo?.os?.hostname || device.id.slice(0, 8)})</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <p className="text-brand-glow/80 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>Direct LAN • {device.ipAddress}:4100</span>
            </p>
          </div>
        </div>
      </div>

      {!sysInfo ? (
        !isDeviceOnline ? (
          <div className="py-10 px-4 text-center rounded-xl bg-brand-base/40 border border-brand-border/30 space-y-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mx-auto animate-ping" />
            <p className="text-sm font-semibold text-rose-300">
              Device is Offline
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Unable to establish direct local connection at {device.ipAddress}
              :4100
            </p>
          </div>
        ) : (
          <div className="py-10 px-4 text-center font-semibold text-zinc-400 text-sm animate-pulse">
            Connecting and receiving live telemetry from {device.ipAddress}...
          </div>
        )
      ) : (
        <div
          className={`space-y-4 transition-all duration-300 ${!isDeviceOnline ? "opacity-45 grayscale pointer-events-none" : ""}`}
        >
          {/* 2. CPU & Memory Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* CPU Card */}
            <div className="p-5 rounded-xl bg-brand-base/60 border border-brand-border/30 space-y-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 gap-2">
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-brand-hover shrink-0" />{" "}
                  Processor
                </span>
                <span className="text-[11px] font-mono text-brand-glow bg-brand-surface px-2 py-0.5 rounded border border-brand-border/40 whitespace-nowrap shrink-0">
                  {sysInfo.cpu?.cores} Cores
                </span>
              </div>
              <p
                className="text-sm font-bold text-white truncate"
                title={sysInfo.cpu?.model}
              >
                {sysInfo.cpu?.model}
              </p>
              <div className="text-xs font-mono text-zinc-400">
                Clock Speed:{" "}
                <span className="text-zinc-200">
                  {sysInfo.cpu?.speedMHz} MHz
                </span>
              </div>
            </div>

            {/* RAM Usage Card */}
            <div className="p-5 rounded-xl bg-brand-base/60 border border-brand-border/30 space-y-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-400 gap-2">
                <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                  <HardDrive className="w-4 h-4 text-brand-hover shrink-0" />{" "}
                  Memory (RAM)
                </span>
                <span className="font-mono text-brand-hover font-bold whitespace-nowrap shrink-0">
                  {sysInfo.memory?.usagePercentage}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-brand to-brand-hover h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                  style={{ width: `${Math.min(ramPercentNumber, 100)}%` }}
                />
              </div>

              <div className="flex justify-center gap-2 items-center text-xs font-mono text-zinc-400">
                <span>
                  {Number(sysInfo.memory?.usedGB.replace("GB", "")).toFixed(0)}{" "}
                  GB used
                </span>
                <span>
                  of{" "}
                  {Number(sysInfo.memory?.totalGB.replace("GB", "")).toFixed(0)}{" "}
                  GB
                </span>
              </div>
            </div>
          </div>

          {/* 3. System Vitals Bottom Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-brand-surface/50 border border-brand-border/20 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-hover shrink-0" />
              <div className="min-w-0">
                <span className="text-zinc-400 block text-[10px]">UPTIME</span>
                <span className="text-white font-semibold truncate block">
                  {sysInfo.os?.uptimeHours} hrs
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-brand-surface/50 border border-brand-border/20 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-hover shrink-0" />
              <div className="min-w-0 truncate">
                <span className="text-zinc-400 block text-[10px]">
                  OPERATOR
                </span>
                <span className="text-white font-semibold truncate block">
                  {sysInfo.userInfo?.username}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-brand-surface/50 border border-brand-border/20 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-brand-hover shrink-0" />
              <div className="min-w-0 truncate">
                <span className="text-zinc-400 block text-[10px]">
                  PLATFORM
                </span>
                <span className="text-white font-semibold truncate block">
                  {sysInfo.os?.platform} ({sysInfo.os?.arch})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
