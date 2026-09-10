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
      <body className="min-h-screen flex flex-col bg-linear-to-b from-[#000000] to-[#20193F] bg-fixed bg-no-repeat">
        {/* <div className="flex w-screen h-screen">
          <SideBar />
          <div className="flex-1 flex flex-col">
            <NavBar />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </div> */}
        {children}
      </body>
    </html>
  );
}
