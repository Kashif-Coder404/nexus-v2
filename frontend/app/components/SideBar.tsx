"use client";

import React from "react";
import { useSideBar } from "../store/useSideBar";
import SideBarHeader from "./sidebar components/SideBarHeader";
import SidebarDevices from "./sidebar components/SidebarDevices";
import SidebarChats from "./sidebar components/SidebarChats";
import SidebarFooter from "./sidebar components/SidebarFooter";

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
          <SideBarHeader />
          <div className="flex flex-col items-stretch w-full">
            {/* Devices Dropdown */}
            <SidebarDevices />

            <hr className={`my-2 ${style.divider}`} />

            {/* Chats Dropdown */}
            <SidebarChats />
          </div>
        </div>

        <SidebarFooter />
      </aside>
    </>
  );
}

const style = {
  backdrop:
    "fixed inset-0 z-60 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300 cursor-pointer",
  asideCont:
    "fixed inset-y-0 left-0 z-60 flex justify-between h-dvh flex-col p-3 border-r border-brand-border/30 bg-[#080711]/95 backdrop-blur-xl transition-all duration-300 ease-in-out w-80 max-w-[88vw] sm:w-80 md:w-80 lg:w-80 md:static md:shrink-0",
  asideOpen: "translate-x-0 md:ml-0",
  asideClose: "-translate-x-full md:-ml-80 lg:-ml-80",
  headerCont: "flex flex-col items-center justify-between pb-4 w-full",
  divider: "w-full border border-brand-border/40 rounded",
};
