import React from "react";
import NavBar from "@/app/components/NavBar";
import CursorGrid from "@/app/components/CursorGrid";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#080711] overflow-x-hidden">
      {/* Interactive Background CursorGrid Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
        <CursorGrid
          cellSize={60}
          color="#a855f7"
          radius={160}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.95}
          fillOpacity={0.08}
          gridOpacity={0.07}
          cellRadius={3}
          clickPulse
          pulseSpeed={600}
          listenOnWindow
        />
      </div>

      {/* Foreground Content Layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
