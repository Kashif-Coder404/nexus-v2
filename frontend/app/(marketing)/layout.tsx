import React from "react";
import NavBar from "@/app/components/NavBar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
