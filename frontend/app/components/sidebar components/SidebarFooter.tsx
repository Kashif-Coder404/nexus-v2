"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  EllipsisVertical,
  ExternalLink,
  Laptop,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useUserCredentials } from "../../store/useUserCredentials";
import { useDevices } from "../../store/useDevices";
import { useSideBar } from "../../store/useSideBar";

export default function SidebarFooter() {
  const router = useRouter();
  const user = useUserCredentials((state) => state.user);
  const logout = useUserCredentials((state) => state.logout);
  const openPairModal = useDevices((state) => state.openPairModal);
  const { toggleSidebar, isSidebarOpen } = useSideBar();

  const [isLogoutShown, setLogoutShown] = useState<boolean>(false);

  const handleOpenPairModal = () => {
    openPairModal();
    if (isSidebarOpen) toggleSidebar(false);
  };

  const handleSignOut = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="shrink-0 mt-auto w-full">
      {/* Settings Row */}
      <div
        onClick={() => router.push("/settings")}
        className="flex justify-between items-center p-3 my-1 rounded-xl hover:bg-white/10 transition cursor-pointer text-white"
      >
        <div className="flex justify-center items-center gap-2 max-w-fit">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
          <h3 className="text-sm sm:text-base font-semibold">Settings</h3>
        </div>
        <div>
          <ChevronRight strokeWidth={3} className="w-4 h-4" />
        </div>
      </div>

      <hr className="my-1 w-full border border-brand-border/40 rounded" />

      {/* User Profile Bar */}
      <div className="group relative flex justify-between items-center p-3 my-2 rounded-xl hover:bg-white/10 transition cursor-pointer text-white">
        <div className="flex justify-center items-center gap-2 max-w-fit">
          <div className="rounded-full border-2 p-0.5 border-brand-border/60 bg-brand-surface/40">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-brand-hover" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold truncate max-w-[140px]">
              {user?.name || "User"}
            </h3>
          </div>
        </div>

        <div className="text-brand-hover">
          {/* Popover Menu */}
          {isLogoutShown && (
            <div className="absolute bottom-full right-0 mb-2 w-60 bg-brand-base/95 border border-brand-border/40 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              {/* 1. User Header */}
              <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {user?.email || "Signed in"}
                </p>
              </div>

              {/* 2. Quick Actions */}
              <button
                onClick={() => {
                  handleOpenPairModal();
                  setLogoutShown(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-brand-surface/80 transition-colors cursor-pointer w-full text-left"
              >
                <Laptop className="w-4 h-4 text-brand shrink-0" />
                <span>Pair New Companion</span>
              </button>

              <a
                href="https://github.com/Kashif-Coder404/nexus-v2"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-brand-surface/80 transition-colors cursor-pointer w-full text-left"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-brand shrink-0" />
                  <span>GitHub Repository</span>
                </div>
                <span className="text-[10px] text-brand-hover font-mono bg-brand-surface/60 px-1.5 py-0.5 rounded border border-brand-border/50">
                  v2.6.1
                </span>
              </a>

              <hr className="my-1 border-zinc-800/80" />

              {/* 3. Sign Out Button */}
              <button
                onClick={handleSignOut}
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
            className="w-6 h-6 hover:text-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
