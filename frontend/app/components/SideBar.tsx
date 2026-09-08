"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSideBar } from "../store/useSideBar";
import {
  ArrowBigDown,
  ArrowDown,
  ArrowDownFromLine,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  ArrowLeft,
  ChevronDown,
  Computer,
  Download,
  DropletIcon,
  Icon,
  Laptop,
  LoaderIcon,
  MoveDown,
  Plus,
  RefreshCcw,
  RefreshCcwDot,
  Rotate3D,
  RotateCcw,
} from "lucide-react";
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
type Device = {
  id: string;
  name: string;
  online: boolean;
};
const devices: Device[] = [
  { id: "device1", name: "Gaming PC", online: true },
  { id: "device2", name: "Work PC", online: false },
  { id: "device3", name: "College PC", online: false },
];
export default function SideBar() {
  const { toggleSidebar, isSidebarOpen } = useSideBar();
  const [isDeviceRefreshing, setIsDeviceRefreshing] = useState(false);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const handlRefresh = () => {
    setIsDeviceRefreshing(true);
    setTimeout(() => {
      setIsDeviceRefreshing(false);
    }, 2000);
  };
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
          <img
            src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
            alt="Nexus Logo"
            className={style.logoImage}
          />
          <button onClick={() => toggleSidebar()} className={style.closeBtn}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
        <main className={style.mainCont}>
          <div className={style.deviceCont}>
            <div className={style.deviceHeaderCol}>
              <div className="flex gap-2">
                <Laptop />
                <span className={style.deviceText}>Devices</span>{" "}
                <button
                  className={style.deviceToggleBtn}
                  onClick={() => setIsDeviceOpen(!isDeviceOpen)}
                >
                  <ChevronDown
                    strokeWidth={3}
                    className={`${style.chevronIcon} ${
                      isDeviceOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className={style.actionsCont}>
              <button onClick={handlRefresh} className={style.refreshBtn}>
                <RotateCcw
                  strokeWidth={3}
                  className={`${style.refreshIcon} ${
                    isDeviceRefreshing
                      ? style.refreshSpin
                      : style.refreshSpinStopped
                  }`}
                />
              </button>{" "}
              <button className={style.addDeviceBtn}>
                <Plus />
              </button>
            </div>
          </div>
          {isDeviceOpen && (
            <div className={style.deviceList}>
              {devices.map((el) => {
                return (
                  <div className={style.deviceItem} key={el.id}>
                    <span className="font-bold">{el.name}</span>
                    <span
                      className={
                        el.online
                          ? "text-emerald-400 text-xs"
                          : "text-zinc-500 text-xs"
                      }
                    >
                      {el.online ? "● Online" : "○ Offline"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <hr className={style.divider} />
        </main>
      </aside>
    </>
  );
}

const style = {
  backdrop:
    "fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300 cursor-pointer",
  asideCont:
    "fixed inset-y-0 left-0 z-50 flex h-screen flex-col p-3 border-r border-purple-900/30 bg-linear-to-b from-black to-[#20193F] transition-all duration-300 ease-in-out w-72 max-w-[85vw] sm:w-72 md:w-64 lg:w-72 md:static md:shrink-0",
  asideOpen: "translate-x-0 md:ml-0",
  asideClose: "-translate-x-full md:-ml-64 lg:-ml-72",
  headerCont: "flex items-center justify-between pb-4",
  logoImage: "w-9 h-9 object-contain",
  closeBtn:
    "flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition cursor-pointer",
  mainCont:
    "border border-purple-900/30 rounded-xl p-3 bg-zinc-900/30 shadow-lg shadow-purple-950/20",
  deviceCont: "flex justify-between items-center text-center text-white",
  deviceHeaderCol: "flex flex-col justify-center items-center gap-2",
  deviceText: "text-lg font-bold",
  deviceToggleBtn: "text-white cursor-pointer",
  chevronIcon: "font-bold w-5 h-5 duration-300 scale-110",
  deviceList: "flex flex-col gap-1 mt-2 w-full",
  deviceItem:
    "px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-sm cursor-pointer text-white flex justify-between items-center",
  actionsCont: "flex flex-row gap-3",
  refreshBtn: "text-white p-2 rounded-full cursor-pointer",
  refreshIcon: "w-4 h-4",
  refreshSpin:
    "animate-[spin_1s_linear_infinite_reverse] transform duration-200 scale-150",
  refreshSpinStopped: "transform duration-200 scale-100",
  addDeviceBtn:
    "font-bold text-lg cursor-pointer border-2 border-purple-500 px-2 hover:bg-purple-800/60 hover:scale-110 transition-all rounded",
  divider: "w-full",
};
