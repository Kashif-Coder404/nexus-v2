"use client";
import { useUserCredentials } from "@/app/store/useUserCredentials";
import { Loader, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import DashboardUI from "./Dashboard";

const Dashboard = () => {
  const user = useUserCredentials((state) => state.user);
  const hasHydrated = useUserCredentials((state) => state._hasHydrated);

  const router = useRouter();
  useEffect(() => {
    if (hasHydrated && !user) router.push("/auth/login");
  }, [hasHydrated, user, router]);
  if (!hasHydrated)
    return (
      <div className="flex-1 h-full w-full flex justify-center items-center text-white">
        <Loader2 size={96} className="animate-spin text-purple-500" />
      </div>
    );
  if (!user) {
    return null;
  }
  // return <h1 className="text-white">Dashboard must be here!</h1>;
  return <DashboardUI />;
};

export default Dashboard;
