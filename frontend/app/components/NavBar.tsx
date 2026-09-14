"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSideBar } from "../store/useSideBar";
import { useUserCredentials } from "../store/useUserCredentials";
import { Download } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const user = useUserCredentials((state) => state.user);
  const { toggleSidebar, isSidebarOpen } = useSideBar();
  const isDashboard = user ? "/dashboard" : "/auth/login";
  const isChat = user ? "/chat" : "/auth/login";
  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: isDashboard },
    { label: "Chat", href: isChat },
  ];
  const handleDownloadNexus = () => {
    // window.location.href =
    //   "https://github.com/Kashif-Coder404/nexus-v2/releases/download/v2.2.0/nexus.exe";
    window.open(
      "https://github.com/Kashif-Coder404/nexus-v2/releases/latest",
      "_blank",
    );
  };
  return (
    <header className={style.navCont}>
      <div className={style.innerCont}>
        <div className={style.leftLinks}>
          <div
            className={`${style.imageCont} group relative flex items-center justify-center w-10 h-10 cursor-pointer`}
            onClick={() => toggleSidebar(isSidebarOpen)}
          >
            {pathname === "/" || pathname === "/auth/login" ? (
              <>
                <img
                  src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
                  alt="NexusIcon"
                  className={`${style.logoImageNav}`}
                />
              </>
            ) : (
              <p className="text-white text-2xl hover:scale-110 flex justify-center items-center">
                ☰
              </p>
            )}
          </div>
          <div className={style.brandCont}>
            <Link href="/" className={style.brandText}>
              Nexus<span className={style.brandDot}>.</span>
            </Link>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className={style.navLinks}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${style.navLinkItem} ${
                  isActive
                    ? "bg-purple-600/25 text-white border border-purple-400/30 shadow-sm shadow-purple-950/50"
                    : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action / Auth Buttons */}
        {user ? (
          <div className={style.leftCont}>
            <button
              onClick={handleDownloadNexus}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/25 hover:border-purple-400/50 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-sm shadow-purple-950/40 group"
              title="Download latest Windows Companion"
            >
              <Download className="w-3.5 h-3.5 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
              <span>v2.5.0</span>
            </button>
            <div
              className="rounded-full bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-600 border border-purple-400/40 w-8 h-8 text-xs font-bold text-white flex justify-center items-center shadow-md shadow-purple-900/50 cursor-default"
              title={user?.name || "User"}
            >
              {user?.name ? user.name.slice(0, 1).toUpperCase() : "U"}
            </div>
          </div>
        ) : (
          <div className={style.actionsCont}>
            <Link href="/auth/login" className={style.loginBtn}>
              Log in
            </Link>
            <Link href="/auth/signup" className={style.defaultBtn}>
              SignUp
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

const style = {
  navCont: "sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300",
  innerCont:
    "mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6 rounded-full bg-[#0b0f19]/75 backdrop-blur-2xl border border-purple-500/30 ring-1 ring-white/10 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8),0_0_24px_rgba(168,85,247,0.18)] pointer-events-auto transition-all duration-300 hover:border-purple-500/40",
  leftLinks: "flex items-center gap-2.5",
  imageCont: "flex items-center justify-center cursor-pointer",
  logoImageNav: "w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]",
  brandCont: "flex items-center",
  brandText:
    "text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-purple-300 bg-clip-text text-transparent",
  brandDot: "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]",
  navLinks: "hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full border border-white/5",
  navLinkItem:
    "text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 text-zinc-400 hover:text-white hover:bg-purple-900/30",
  actionsCont: "flex items-center gap-2 sm:gap-3",
  leftCont: "flex items-center gap-3",
  loginBtn:
    "text-xs font-semibold px-3 py-1.5 text-zinc-300 hover:text-white transition-colors",
  defaultBtn:
    "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-md shadow-purple-600/30 hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200",
};
