"use client";
import React from "react";
import Link from "next/link";
import { useSideBar } from "../store/useSideBar";
import { ArrowLeft, Laptop, MessageSquare } from "lucide-react";
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
          <img
            src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
            alt="Nexus Logo"
            className={style.logoImage}
          />
          <button onClick={() => toggleSidebar()} className={style.closeBtn}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <main className="flex flex-col gap-2">
          {/* Devices Dropdown */}
          <Dropdown
            title="Devices"
            icon={<Laptop className="w-5 h-5" />}
            onRefresh={() => console.log("Refreshing devices...")}
            onAdd={() => console.log("Add device...")}
            viewAllHref="/devices"
          >
            {devices.map((el) => (
              <DropdownItem key={el.id}>
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
              </DropdownItem>
            ))}
          </Dropdown>

          <hr className={style.divider} />

          {/* Chats Dropdown */}
          <Dropdown
            title="Chats"
            defaultOpen={true}
            icon={<MessageSquare className="w-5 h-5" />}
            onRefresh={() => console.log("Refreshing chats...")}
            onAdd={() => console.log("New chat...")}
            viewAllHref="/chat"
          >
            {chats.map((el) => (
              <DropdownItem key={el.id}>
                <span className="font-bold">{el.title}</span>
                <span className="text-purple-200/70">{el.date}</span>
              </DropdownItem>
            ))}
          </Dropdown>
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
  divider: "w-full border-1 border-purple-400/40 rounded my-2 mt-20",
};
