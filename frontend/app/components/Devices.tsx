"use client";

import React, { useEffect, useState } from "react";
import { Device, useDevices } from "../store/useDevices";
import { useUserCredentials } from "../store/useUserCredentials";
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
  Minus,
  Dot,
} from "lucide-react";
import { IconSettingsPause, IconStatusChange } from "@tabler/icons-react";

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
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(device.deviceName);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  const token = useUserCredentials((state) => state.token);

  const handleRevoke = async () => {
    if (!token || !device.id) return;
    setIsRevoking(true);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "https://nexus-v2-e38m.onrender.com";
      const res = await fetch(`${backendUrl}/api/device/${device.id}`, {
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
            useDevices.getState().devices.filter((d) => d.id !== device.id),
          );
      } else {
        console.error("[REVOKE DEVICE FAILED]:", data.message);
      }
    } catch (err: any) {
      console.error("[REVOKE DEVICE ERROR]:", err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRenaming = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/devices/renameDevice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: device.id,
            deviceName: newName,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setIsRenaming(false);
      } else {
        setNewName(device.deviceName);
      }
    } catch (error) {
      console.error("Error renaming device:", error);
    } finally {
      setIsRenaming(false);
    }
  };

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
    <div className="relative w-full max-w-[30rem] p-5 rounded-2xl bg-brand-surface/70 border border-brand-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl text-white space-y-5 transition-all">
      {/* 1. Header: Top row (Title + Actions), Bottom row (Hostname + IP) */}
      <div className="border-b border-brand-border/30 pb-4 space-y-2.5">
        {/* Top Row: Device Name & Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 shrink-0 rounded-xl bg-brand/15 border border-brand-border/40 flex items-center justify-center text-brand-hover shadow-sm">
              <div
                className={`absolute -right-4 -bottom-2 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  isDeviceOnline
                    ? "text-emerald-400"
                    : "border-rose-500/30 text-rose-400"
                }`}
              >
                <Dot
                  strokeWidth={10}
                  className={`w-3.5 h-3.5 ${isDeviceOnline ? "animate-pulse text-emerald-400" : " animate-spin text-rose-400"}`}
                />
              </div>
              <Laptop className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div>
                <input
                  type="text"
                  id="renameDevice"
                  value={newName}
                  className="w-full min-w-0 max-w-[14rem] bg-transparent border-none text-white font-bold text-lg truncate focus:outline-none focus:ring-1 focus:ring-brand-hover rounded px-1"
                  onChange={(e) => {
                    setNewName(e.target.value);
                  }}
                  onFocus={(e) => {
                    e.target.select();
                  }}
                  maxLength={15}
                  onBlur={(e) => {
                    if (e.target.value !== device.deviceName) {
                      // handle rename
                    }
                  }}
                  disabled={!isRenaming}
                />
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-brand-hover transition-colors p-0.5 rounded shrink-0"
                title="Rename device"
                onClick={(e) => {
                  e.stopPropagation();
                  // focus to the input field
                  if (!isRenaming) {
                    setTimeout(() => {
                      document.getElementById("renameDevice")?.focus();
                    }, 100);
                  }
                  setIsRenaming((prev) => !prev);
                }}
              >
                <Pencil
                  className={`w-3.5 h-3.5 ${
                    isRenaming
                      ? "text-brand-hover scale-110"
                      : "text-zinc-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right: Live Badge & Revoke Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border transform hover:scale-110 active:border-white active:bg-red-950 border-rose-500/70 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 hover:border-rose-500/60 hover:text-rose-300 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              title="Revoke device"
              aria-label={`Revoke device ${device.deviceName}`}
            >
              <Minus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline text-[11px]">
                {isRevoking ? "Revoking..." : "Revoke"}
              </span>
            </button>
          </div>
        </div>

        {/* Subtitle Row: Hostname and IP (Full width, no squishing) */}
        <div className="flex flex-wrap justify-center w-full items-center gap-x-3 gap-y-1 text-xs font-mono text-zinc-400">
          <span>({sysInfo?.os?.hostname || device.id.slice(0, 8)})</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <p className="text-brand-glow/80 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Direct LAN • {device.ipAddress}:4100</span>
          </p>
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
