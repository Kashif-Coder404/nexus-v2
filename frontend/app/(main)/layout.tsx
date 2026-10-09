"use client";
// import React from "react";
import SideBar from "@/app/components/SideBar";
import NavBar from "@/app/components/NavBar";
import {
  useUserCredentials,
  isTokenExpired,
} from "@/app/store/useUserCredentials";
import WebSocketInit from "@/services/ws.service";
import { useEffect, useState, useCallback } from "react";
import { PairDevice, WindowAlert } from "@/app/components/PairDevice";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isWindowAlert, setIsWindowAlert] = useState(false);
  const token = useUserCredentials((state) => state.token);
  const _hasHydrated = useUserCredentials((state) => state._hasHydrated);
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const verifySession = useCallback(() => {
    if (!_hasHydrated) return;
    if (!token || isTokenExpired(token)) {
      console.warn("🔒 [AUTH] Token expired or missing. Logging out...");
      setIsAuthorized(false);
      router.replace("/auth/login");
      useUserCredentials.getState().logout();
      return;
    }
    setIsAuthorized(true);
  }, [token, _hasHydrated, router, pathname]);

  useEffect(() => {
    verifySession();

    // const handleVisibility = () => {
    //   if (document.visibilityState === "visible") verifySession();
    // };

    // window.addEventListener("focus", verifySession);
    // document.addEventListener("visibilitychange", handleVisibility);
    // window.addEventListener("resize", verifySession);

    // return () => {
    //   window.removeEventListener("focus", verifySession);
    //   document.removeEventListener("visibilitychange", handleVisibility);
    //   window.removeEventListener("resize", verifySession);
    // };
  }, [verifySession, pathname]);

  useEffect(() => {
    if (!token || isTokenExpired(token)) return;
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
  if (!_hasHydrated || !isAuthorized) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-brand-base">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }
  return (
    <>
      {isWindowAlert && <WindowAlert setWindowAlert={setIsWindowAlert} />}
      <PairDevice setWindowAlert={setIsWindowAlert} />
      <div className="flex w-full h-dvh overflow-hidden bg-brand-base">
        <SideBar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
          <NavBar />
          <main className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
