import type { Metadata } from "next";
import NavBar from "./components/NavBar";
import "./globals.css";

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
    <html lang="en" className="min-h-dvh antialiased">
      <body className="min-h-screen flex flex-col bg-linear-to-b from-[#000000] to-[#20193F] bg-fixed bg-no-repeat">
        <NavBar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
