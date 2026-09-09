"use client";
import React from "react";
import Link from "next/link";
import { useSideBar } from "../store/useSideBar";
import {
  ArrowLeft,
  ChevronRight,
  EllipsisVertical,
  Laptop,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import Dropdown, { DropdownItem } from "./Dropdown";

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
type ChatContent = {
  id: string; //Chat session id basically.
  title: string;
  date: string;
};
const devices: Device[] = [
  { id: "device1", name: "Gaming PC", online: true },
  { id: "device2", name: "Work PC", online: false },
  { id: "device3", name: "College PC", online: false },
];
const chats: ChatContent[] = [
  {
    id: "chat1", //Chat session id basically.
    title: "Chat 1 title",
    date: "20/20/2020",
  },
  {
    id: "chat2", //Chat session id basically.
    title: "Chat 2 title",
    date: "20/21/2020",
  },
];
export default function SideBar() {
  const { toggleSidebar, isSidebarOpen } = useSideBar();

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
            <button onClick={() => toggleSidebar()} className={style.closeBtn}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col items-stretch w-full">
            {/* Devices Dropdown */}
            <Dropdown
              title="Devices"
              itemNum={devices.length}
              icon={<Laptop className="w-5 h-5" />}
              onRefresh={() => console.log("Refreshing devices...")}
              onAdd={() => console.log("Add device...")}
              viewAllHref="/devices"
            >
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1 [scrollbar-width:thin] [scrollbar-color:#7e22ce_transparent]">
                {devices.map((el) => (
                  <DropdownItem key={el.id}>
                    <span className="font-semibold text-sm sm:text-base">
                      {el.name}
                    </span>
                    <span
                      className={
                        el.online
                          ? "text-emerald-400 text-xs"
                          : "text-zinc-500 text-xs"
                      }
                    >
                      {el.online ? "● Online" : "○ Offline"}
                    </span>
                  </DropdownItem>
                ))}
              </div>
            </Dropdown>

            <hr className={`my-2 ${style.divider}`} />

            {/* Chats Dropdown */}
            <Dropdown
              title="Chats"
              defaultOpen={true}
              itemNum={chats.length}
              icon={<MessageSquare className="w-5 h-5" />}
              onRefresh={() => console.log("Refreshing chats...")}
              onAdd={() => console.log("New chat...")}
              viewAllHref="/chat"
            >
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1 [scrollbar-width:thin] [scrollbar-color:#7e22ce_transparent]">
                {chats.map((el) => (
                  <DropdownItem key={el.id}>
                    <span
                      className="font-semibold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[140px]"
                      title={el.title}
                    >
                      {el.title}
                    </span>
                    <span className="text-purple-200/70 text-xs">
                      {el.date}
                    </span>
                  </DropdownItem>
                ))}
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

          <div className="flex justify-between items-center p-3 my-1 rounded-xl hover:bg-white/10 transition cursor-pointer text-white">
            <div className="flex justify-center items-center gap-2 max-w-fit">
              <div className="rounded-full border-2 p-0.5">
                <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold">KASHIF</h3>
            </div>
            <div>
              <EllipsisVertical strokeWidth={3} className="w-4 h-4" />
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
