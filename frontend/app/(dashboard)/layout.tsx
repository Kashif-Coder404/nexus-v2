"use client";
// import React from "react";
import SideBar from "@/app/components/SideBar";
import NavBar from "@/app/components/NavBar";
import { useUserCredentials } from "@/app/store/useUserCredentials";
import WebSocketInit from "@/services/ws.service";
import { useEffect, useState } from "react";
import { PairDevice, WindowAlert } from "@/app/components/PairDevice";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isWindowAlert, setIsWindowAlert] = useState(false);
  const token = useUserCredentials((state) => state.token);
  useEffect(() => {
    if (!token) return;
    let socket: WebSocket | undefined;
    WebSocketInit().then((ws) => {
      socket = ws;
      if (socket?.readyState !== WebSocket.OPEN) return;
      socket?.send(JSON.stringify({ type: "get_devices" }));
    });
    return () => {
      socket?.close();
    };
  }, [token]);
  return (
    <>
      {isWindowAlert ? (
        <WindowAlert setWindowAlert={setIsWindowAlert} />
      ) : (
        <PairDevice setWindowAlert={setIsWindowAlert} />
      )}
      <div className="flex w-screen h-screen overflow-hidden">
        <SideBar />
        <div className="flex-1 flex flex-col min-w-0">
          <NavBar />
          <main className="flex-1 flex flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
