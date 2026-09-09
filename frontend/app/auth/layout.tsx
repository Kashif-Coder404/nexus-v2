import React from "react";
import SideBar from "@/app/components/SideBar";
import NavBar from "@/app/components/NavBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <NavBar />
        <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
