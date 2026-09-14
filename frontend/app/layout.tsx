import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import "./globals.css";
import SideBar from "./components/SideBar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Nexus-AI",
  description: "Nexus-AI-Frontend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("min-h-dvh antialiased", "font-sans", geist.variable)}
    >
      <body className="min-h-screen flex flex-col bg-gradient-to-b from-black via-[#0d091a] to-brand-surface bg-fixed bg-no-repeat text-white">
        {children}
      </body>
    </html>
  );
}
